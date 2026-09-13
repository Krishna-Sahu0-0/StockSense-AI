import { formatTimeAgo } from "@/lib/utils";

const WatchlistNews = ({ news }: WatchlistNewsProps) => {
  if (!news || news.length === 0) {
    return (
      <div className="text-sm text-gray-500">
        No recent news for your watchlist yet. As you add more stocks, related headlines will appear here.
      </div>
    );
  }

  return (
    <div className="watchlist-news">
      {news.map((article) => (
        <a
          key={article.id}
          href={article.url}
          target="_blank"
          rel="noreferrer"
          className="news-item"
        >
          <span className="news-tag">
            {article.category?.toUpperCase() || "MARKET NEWS"}
          </span>
          <h3 className="news-title">{article.headline}</h3>
          <div className="news-meta">
            <span className="mr-2 text-xs">
              {formatTimeAgo(article.datetime)}
            </span>
            {article.source && (
              <span className="ml-auto text-xs text-gray-500">
                {article.source}
              </span>
            )}
          </div>
          <p className="news-summary">{article.summary}</p>
          <span className="news-cta">Read more →</span>
        </a>
      ))}
    </div>
  );
};

export default WatchlistNews;

