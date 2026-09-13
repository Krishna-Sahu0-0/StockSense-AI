import Link from "next/link";
import WatchlistButton from "@/components/WatchlistButton";
import { WATCHLIST_TABLE_HEADER } from "@/lib/constants";
import { formatChangePercent, formatPrice, getChangeColorClass } from "@/lib/utils";

const WatchlistTable = ({ watchlist }: WatchlistTableProps) => {
  if (!watchlist || watchlist.length === 0) return null;

  const formatNumeric = (value?: string | number) => {
    if (value === undefined || value === null || value === "") return "—";
    return String(value);
  };

  return (
    <div className="watchlist-table overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-700">
        <thead className="bg-gray-800">
          <tr className="table-header-row">
            {WATCHLIST_TABLE_HEADER.map((header) => (
              <th
                key={header}
                scope="col"
                className="table-header px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-gray-800 divide-y divide-gray-700">
          {watchlist.map((item) => (
            <tr key={item.symbol} className="table-row">
              <td className="table-cell px-4 py-3">
                <div className="flex flex-col">
                  <Link
                    href={`/stocks/${item.symbol}`}
                    className="font-semibold text-gray-100 hover:text-blue-400"
                  >
                    {item.company}
                  </Link>
                  <span className="text-xs text-gray-500">
                    Added {item.addedAt.toLocaleDateString()}
                  </span>
                </div>
              </td>
              <td className="table-cell px-4 py-3">
                <Link
                  href={`/stocks/${item.symbol}`}
                  className="text-blue-500 hover:text-blue-400"
                >
                  {item.symbol}
                </Link>
              </td>
              <td className="table-cell px-4 py-3">
                {item.currentPrice !== undefined ? formatPrice(item.currentPrice) : "—"}
              </td>
              <td className="table-cell px-4 py-3">
                <span className={getChangeColorClass(item.changePercent)}>
                  {formatChangePercent(item.changePercent)}
                </span>
              </td>
              <td className="table-cell px-4 py-3">{formatNumeric(item.marketCap)}</td>
              <td className="table-cell px-4 py-3">{formatNumeric(item.peRatio)}</td>
              <td className="table-cell px-4 py-3">
                <button className="add-alert" type="button">
                  <span className="text-xs">Add alert</span>
                </button>
              </td>
              <td className="table-cell px-4 py-3 text-right">
                <WatchlistButton
                  symbol={item.symbol}
                  company={item.company}
                  isInWatchlist
                  type="icon"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default WatchlistTable;

