import Link from "next/link";
import { headers } from "next/headers";

import { auth } from "@/lib/better-auth/auth";
import { getWatchlistByEmail } from "@/lib/actions/watchlist.actions";
import { getNews } from "@/lib/actions/finnhub.actions";

import WatchlistTable from "@/components/WatchlistTable";
import WatchlistNews from "@/components/WatchlistNews";

const WatchlistPage = async () => {
  const session = await auth.api.getSession({ headers: await headers() });
  const email = session?.user?.email ?? "";

  const watchlist = await getWatchlistByEmail(email);

  const symbols = watchlist.map((item) => item.symbol);
  const newsForWatchlist = symbols.length > 0 ? await getNews(symbols) : [];

  if (!watchlist || watchlist.length === 0) {
    return (
      <div className="watchlist-empty-container">
        <div className="watchlist-empty">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            className="watchlist-star"
            fill="none"
            stroke="#FACC15"
            strokeWidth="1.5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.385a.563.563 0 00-.182-.557L3.04 10.385a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345l2.125-5.111z"
            />
          </svg>

          <h1 className="empty-title">Your watchlist is empty</h1>
          <p className="empty-description">
            Start building your watchlist by searching for stocks and adding
            them to follow price moves, news, and alerts in one place.
          </p>

          <Link href="/" className="blue-btn px-6 flex items-center justify-center">
            Browse stocks
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="watchlist-page">
      <section className="watchlist-main">
        <div className="watchlist-header">
          <div>
            <h1 className="watchlist-title">Your watchlist</h1>
            <p className="watchlist-subtitle">
              Track live prices, valuation metrics, and related headlines for the companies you care about.
            </p>
          </div>
          <Link href="/" className="search-btn">
            Add stocks
          </Link>
        </div>

        <WatchlistTable watchlist={watchlist} />
      </section>

      <aside className="watchlist-sidebar">
        <div className="watchlist-card">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold text-gray-100">Alerts</h2>
            <p className="text-sm text-gray-500">
              Price alerts and advanced watchlist automation will appear here in a future update.
            </p>
          </div>
        </div>

        <div className="watchlist-card">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-100">Watchlist news</h2>
            {symbols.length > 0 && (
              <span className="text-xs px-2 py-1 rounded-full bg-gray-700/80 text-gray-300 uppercase tracking-wide">
                {symbols.length} symbol{symbols.length > 1 ? "s" : ""}
              </span>
            )}
          </div>
          <WatchlistNews news={newsForWatchlist} />
        </div>
      </aside>
    </div>
  );
};

export default WatchlistPage;

