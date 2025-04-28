'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';

export default function NewsPage() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const apiKey = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
        
        if (!apiKey) {
          throw new Error('Finnhub API key is missing. Please check your .env.local file.');
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);

        const response = await fetch(
          `https://finnhub.io/api/v1/news?category=general&token=${apiKey}`,
          {
            signal: controller.signal,
            headers: {
              'Accept': 'application/json',
            }
          }
        );
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          if (response.status === 401) {
            throw new Error('Invalid API key. Please check your Finnhub API key in .env.local.');
          }
          throw new Error(`Failed to fetch news: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        setNews(data);
      } catch (err) {
        console.error('Error fetching news:', err);
        if (err.name === 'AbortError') {
          setError('Request timed out. Please try again later.');
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
  }, []);

  if (loading) return <div className="flex justify-center items-center min-h-screen text-white">Loading...</div>;
  if (error) return (
    <div className="min-h-screen bg-background pt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">Financial News</h1>
          <div className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded relative" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-background pt-20">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-foreground">Financial News</h1>
          <p className="text-muted-foreground mt-2">Stay updated with the latest market news and insights</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.slice(0, 10).map((article) => (
            <div key={article.id} className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-2 text-foreground">{article.headline}</h2>
                <p className="text-muted-foreground text-sm mb-4">
                  {format(new Date(article.datetime * 1000), 'MMM d, yyyy h:mm a')}
                </p>
                <p className="text-muted-foreground mb-4">{article.summary}</p>
                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/90"
                >
                  Read more
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
} 