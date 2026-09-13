'use server';

import { headers } from 'next/headers';
import { auth } from '@/lib/better-auth/auth';
import { connectToDatabase } from '@/database/mongoose';
import { Watchlist } from '@/database/models/watchlist.model';
import { fetchJSON } from '@/lib/actions/finnhub.actions';

async function getUserIdByEmail(email: string): Promise<string | null> {
  if (!email) return null;

  const mongoose = await connectToDatabase();
  const db = mongoose.connection.db;
  if (!db) throw new Error('MongoDB connection not found');

  const user = await db
    .collection('user')
    .findOne<{ _id?: unknown; id?: string; email?: string }>({ email });

  if (!user) return null;

  const userId = (user.id as string) || String(user._id || '');
  return userId || null;
}

export async function getWatchlistSymbolsByEmail(email: string): Promise<string[]> {
  if (!email) return [];

  try {
    const userId = await getUserIdByEmail(email);
    if (!userId) return [];

    const items = await Watchlist.find({ userId }, { symbol: 1 }).lean();
    return items.map((i) => String(i.symbol));
  } catch (err) {
    console.error('getWatchlistSymbolsByEmail error:', err);
    return [];
  }
}

export async function getWatchlistByEmail(email: string): Promise<StockWithData[]> {
  if (!email) return [];

  try {
    const userId = await getUserIdByEmail(email);
    if (!userId) return [];

    const docs = await Watchlist.find({ userId }).lean();

    const symbols = Array.from(
      new Set(
        docs
          .map((doc: any) => String(doc.symbol || '').trim().toUpperCase())
          .filter((s) => s.length > 0),
      ),
    );

    let quotesBySymbol: Record<string, QuoteData> = {};
    let financialsBySymbol: Record<string, FinancialsData> = {};

    try {
      const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';
      const token =
        process.env.FINNHUB_API_KEY ?? process.env.NEXT_PUBLIC_FINNHUB_API_KEY ?? '';

      if (token && symbols.length > 0) {
        const quoteResults = await Promise.all(
          symbols.map(async (sym) => {
            try {
              const url = `${FINNHUB_BASE_URL}/quote?symbol=${encodeURIComponent(
                sym,
              )}&token=${token}`;
              const data = await fetchJSON<QuoteData>(url, 60);
              return { sym, data };
            } catch (e) {
              console.error('Error fetching quote for', sym, e);
              return { sym, data: {} as QuoteData };
            }
          }),
        );

        quotesBySymbol = quoteResults.reduce<Record<string, QuoteData>>((acc, { sym, data }) => {
          acc[sym] = data;
          return acc;
        }, {});

        const financialResults = await Promise.all(
          symbols.map(async (sym) => {
            try {
              const url = `${FINNHUB_BASE_URL}/stock/metric?symbol=${encodeURIComponent(
                sym,
              )}&metric=valuation&token=${token}`;
              const data = await fetchJSON<FinancialsData>(url, 3600);
              return { sym, data };
            } catch (e) {
              console.error('Error fetching financials for', sym, e);
              return { sym, data: {} as FinancialsData };
            }
          }),
        );

        financialsBySymbol = financialResults.reduce<Record<string, FinancialsData>>(
          (acc, { sym, data }) => {
            acc[sym] = data;
            return acc;
          },
          {},
        );
      }
    } catch (e) {
      console.error('getWatchlistByEmail: failed to fetch quotes/financials', e);
      quotesBySymbol = {};
      financialsBySymbol = {};
    }

    // Shape documents into StockWithData with live price fields when available
    const watchlist: StockWithData[] = docs.map((doc: any) => {
      const symbol = String(doc.symbol).toUpperCase();
      const quote = quotesBySymbol[symbol];
      const fin = financialsBySymbol[symbol];

      const currentPrice = quote?.c;
      const changePercent = quote?.dp;

      const rawMarketCap = fin?.metric?.marketCapitalization;
      const rawPe = fin?.metric?.peTTM ?? fin?.metric?.peNormalizedAnnual ?? fin?.metric?.peAnnual;

      const marketCap =
        typeof rawMarketCap === 'number'
          ? `${(rawMarketCap / 1_000_000_000).toFixed(1)}B`
          : undefined;

      const peRatio =
        typeof rawPe === 'number' && rawPe > 0 ? rawPe.toFixed(1) : undefined;

      return {
        userId: String(doc.userId),
        symbol,
        company: String(doc.company),
        addedAt: doc.addedAt instanceof Date ? doc.addedAt : new Date(doc.addedAt),
        currentPrice,
        changePercent,
        priceFormatted: undefined,
        changeFormatted: undefined,
        marketCap,
        peRatio,
      };
    });

    return watchlist;
  } catch (err) {
    console.error('getWatchlistByEmail error:', err);
    return [];
  }
}

export async function isSymbolInWatchlist(email: string, symbol: string): Promise<boolean> {
  if (!email || !symbol) return false;

  try {
    const symbols = await getWatchlistSymbolsByEmail(email);
    return symbols.includes(symbol.toUpperCase());
  } catch (err) {
    console.error('isSymbolInWatchlist error:', err);
    return false;
  }
}

export async function toggleWatchlist(symbol: string, company: string): Promise<{ added: boolean }> {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    const email = session?.user?.email;

    if (!email) {
      throw new Error('User is not authenticated');
    }

    const userId = await getUserIdByEmail(email);
    if (!userId) {
      throw new Error('User not found');
    }

    const normalizedSymbol = symbol.toUpperCase();

    const existing = await Watchlist.findOne({ userId, symbol: normalizedSymbol });

    if (existing) {
      await Watchlist.deleteOne({ _id: existing._id });
      return { added: false };
    }

    await Watchlist.create({
      userId,
      symbol: normalizedSymbol,
      company,
    });

    return { added: true };
  } catch (err) {
    console.error('toggleWatchlist error:', err);
    throw err;
  }
}

