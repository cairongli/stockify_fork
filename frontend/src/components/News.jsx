"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";

export default function NewsPage() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [category, setCategory] = useState("general");
  const [visibleArticles, setVisibleArticles] = useState(6);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const apiKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;

        if (!apiKey) {
          throw new Error(
            "Finnhub API key is missing. Please check your .env.local file."
          );
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const response = await fetch(
          `https://finnhub.io/api/v1/news?category=${category}&token=${apiKey}`,
          {
            signal: controller.signal,
            headers: {
              Accept: "application/json",
            },
          }
        );

        clearTimeout(timeoutId);

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error(
              "Invalid API key. Please check your Finnhub API key in .env.local."
            );
          }
          throw new Error(
            `Failed to fetch news: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();
        setNews(data);
      } catch (err) {
        console.error("Error fetching news:", err);
        if (err.name === "AbortError") {
          setError("Request timed out. Please try again later.");
        } else {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    // Initial fetch
    fetchNews();

    // Set up interval to refresh news every 30 minutes
    const intervalId = setInterval(fetchNews, 30 * 60 * 1000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [category]);

  const loadMoreArticles = () => {
    setVisibleArticles((prev) => prev + 6);
  };

  const categories = [
    { id: "general", name: "General" },
    { id: "forex", name: "Forex" },
    { id: "crypto", name: "Crypto" },
    { id: "merger", name: "Mergers" },
    { id: "economic", name: "Economy" },
  ];

  if (loading)
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 rounded-full border-4 border-t-blue-500 border-b-blue-700 border-gray-200 animate-spin"></div>
          <p className="mt-4 text-gray-700 dark:text-gray-300 font-medium">
            Loading latest financial news...
          </p>
        </div>
      </div>
    );

  if (error)
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Financial News
            </h1>
            <div
              className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-6 py-4 rounded-lg shadow-md"
              role="alert"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 inline-block mr-2 mb-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <strong className="font-bold">Error: </strong>
              <span className="block sm:inline">{error}</span>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-6 rounded-full shadow-md transition-colors duration-200"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 pt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-12 text-center">
          <h1 className="text-5xl font-extrabold text-gray-900 dark:text-white bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-500">
            Financial News
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mt-4 max-w-2xl mx-auto">
            Stay updated with the latest market news, insights, and financial
            developments from around the world.
          </p>
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap justify-center mb-10 gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setCategory(cat.id);
                setVisibleArticles(6);
              }}
              className={`px-6 py-2 rounded-full font-medium text-sm transition-all duration-200 shadow-sm
                ${
                  category === cat.id
                    ? "bg-blue-600 text-white"
                    : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Featured article */}
        {news.length > 0 && (
          <div className="mb-12">
            <article className="rounded-xl overflow-hidden shadow-xl bg-white dark:bg-gray-800 transition-transform duration-300 hover:shadow-2xl relative">
              <div className="relative h-80 md:h-96 overflow-hidden">
                {news[0].image ? (
                  <img
                    src={news[0].image}
                    alt={news[0].headline}
                    className="w-full h-full object-cover transform transition-transform duration-500 hover:scale-105"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src =
                        "https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=1470&auto=format&fit=crop";
                    }}
                  />
                ) : (
                  <img
                    src="https://images.unsplash.com/photo-1590283603385-17ffb3a7f29f?q=80&w=1470&auto=format&fit=crop"
                    alt="Financial news"
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent"></div>
                <div className="absolute bottom-0 left-0 p-6 text-white">
                  <div className="bg-blue-600 text-white text-xs font-bold uppercase rounded-full px-3 py-1 mb-3 inline-block">
                    Featured
                  </div>
                  <h2 className="text-3xl font-bold mb-2 leading-tight">
                    {news[0].headline}
                  </h2>
                  <p className="text-gray-200 text-sm mb-4">
                    {format(
                      new Date(news[0].datetime * 1000),
                      "MMMM d, yyyy h:mm a"
                    )}
                  </p>
                  <a
                    href={news[0].url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white bg-blue-600 hover:bg-blue-700 font-medium px-5 py-2 rounded-full inline-flex items-center transition-colors duration-200"
                  >
                    Read Full Article
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4 ml-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M14 5l7 7m0 0l-7 7m7-7H3"
                      />
                    </svg>
                  </a>
                </div>
              </div>
            </article>
          </div>
        )}

        {/* News grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {news.slice(1, visibleArticles).map((article) => (
            <article
              key={article.id}
              className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300 flex flex-col h-full"
            >
              <div className="h-48 overflow-hidden">
                {article.image ? (
                  <img
                    src={article.image}
                    alt={article.headline}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src =
                        "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1430&auto=format&fit=crop";
                    }}
                  />
                ) : (
                  <img
                    src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1430&auto=format&fit=crop"
                    alt="Financial news"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center mb-3">
                  <div className="inline-block bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs px-2 py-1 rounded mr-2">
                    {article.category.charAt(0).toUpperCase() +
                      article.category.slice(1)}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400 text-xs">
                    {format(new Date(article.datetime * 1000), "MMM d, yyyy")}
                  </div>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3 line-clamp-2 flex-grow">
                  {article.headline}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-3">
                  {article.summary}
                </p>
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium inline-flex items-center mt-auto"
                >
                  Read more
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 ml-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              </div>
            </article>
          ))}
        </div>

        {/* Load more button */}
        {visibleArticles < news.length && (
          <div className="text-center mt-12">
            <button
              onClick={loadMoreArticles}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-full shadow-md transition-colors duration-200 flex items-center mx-auto"
            >
              Load More Articles
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 ml-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
