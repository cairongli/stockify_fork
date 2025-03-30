'use client';
import { useState, useEffect, useRef } from 'react';
import Navbar from './Navbar';
import { supabase } from '@/config/supabaseClient';
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";

// UI Components
const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={`rounded-lg border bg-card text-card-foreground shadow-sm ${className}`}
    {...props}
  />
));
Card.displayName = "Card";

const Input = React.forwardRef(({ className, type, ...props }, ref) => {
  return (
    <input
      type={type}
      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      ref={ref}
      {...props}
    />
  );
});
Input.displayName = "Input";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
});
Button.displayName = "Button";

const TRADING_HOURS = {
  START: 9.5, // 9:30 AM EST
  END: 16,    // 4:00 PM EST
};

const FEATURED_STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.', price: 217.90, tradeValue: 39818617 },
  { symbol: 'TSLA', name: 'Tesla, Inc.', price: 172.45, tradeValue: 12567890 },
  { symbol: 'MSFT', name: 'Microsoft Corporation', price: 428.74, tradeValue: 25678901 },
  { symbol: 'AMZN', name: 'Amazon.com, Inc.', price: 180.38, tradeValue: 18765432 },
];

const getCompanyName = (symbol) => {
  const companies = {
    'AAPL': 'Apple Inc.',
    'TSLA': 'Tesla, Inc.',
    'MSFT': 'Microsoft Corporation',
    'AMZN': 'Amazon.com, Inc.',
  };
  return companies[symbol] || symbol;
};

const formatNumber = (number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number);
};

const formatVolume = (volume) => {
  if (!volume) return '0';
  if (volume >= 1000000) {
    return `${(volume / 1000000).toFixed(2)}M`;
  } else if (volume >= 1000) {
    return `${(volume / 1000).toFixed(2)}K`;
  }
  return volume.toString();
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds
const RATE_LIMIT_DELAY = 2000; // 2 seconds base delay
const MAX_RETRIES = 3;

const stockDataCache = new Map();

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const fetchStockData = async (symbol, retryCount = 0) => {
    try {
      // Check cache first and return if data is fresh
      const cachedData = stockDataCache.get(symbol);
      if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION && 
          cachedData.data.price !== null && cachedData.data.tradeValue !== null) {
        return cachedData.data;
      }

      const companyName = cachedData?.data?.name || symbol;
      const apiKey = process.env.NEXT_PUBLIC_POLY_API_KEY;
      if (!apiKey) {
        throw new Error('API key not found');
      }

      // Get the latest price data with a single API call
      const response = await fetch(
        `https://api.polygon.io/v2/aggs/ticker/${symbol}/prev?adjusted=true&apiKey=${apiKey}`
      );
      
      const data = await response.json();
      
      if (!response.ok) {
        if (response.status === 429 && retryCount < MAX_RETRIES) {
          // Exponential backoff with jitter
          const delay = RATE_LIMIT_DELAY * Math.pow(2, retryCount) + Math.random() * 1000;
          console.log(`Rate limited, retrying in ${delay}ms... (attempt ${retryCount + 1}/${MAX_RETRIES})`);
          await sleep(delay);
          return fetchStockData(symbol, retryCount + 1);
        }
        throw new Error(data.message || `Failed to fetch data for ${symbol}. Status: ${response.status}`);
      }

      if (data.status === 'ERROR') {
        throw new Error(data.message || 'Failed to fetch stock data');
      }

      if (!data.results || data.results.length === 0) {
        // If no data available, use cached data if it exists, otherwise throw error
        if (cachedData && cachedData.data.price !== null && cachedData.data.tradeValue !== null) {
          console.log(`No new data available for ${symbol}, using cached data`);
          return cachedData.data;
        }
        throw new Error(`No data available for ${symbol}. Please check if the symbol is correct.`);
      }

      // Extract the closing price (c) and volume (v) from the results
      const latestData = data.results[0];
      const result = {
        symbol,
        name: companyName,
        tradeValue: latestData.v,  // Volume
        price: latestData.c,       // Closing price
      };

      // Validate the data
      if (typeof result.price !== 'number' || typeof result.tradeValue !== 'number') {
        throw new Error(`Invalid data received for ${symbol}`);
      }

      // Cache the result
      stockDataCache.set(symbol, {
        data: result,
        timestamp: Date.now()
      });

      return result;
    } catch (error) {
      console.error('Error in fetchStockData:', error);
      
      // If we have cached data and hit an error, return cached data as fallback
      const cachedData = stockDataCache.get(symbol);
      if (cachedData && cachedData.data.price !== null && cachedData.data.tradeValue !== null) {
        console.log(`Error fetching fresh data for ${symbol}, using cached data`);
        return cachedData.data;
      }

      // If no valid data available, throw error
      if (error.message.includes('429')) {
        throw new Error('API rate limit exceeded. Please try again in a few moments.');
      }
      throw new Error(error.message || 'Failed to fetch stock data. Please try again later.');
    }
  };

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [trendingStocks, setTrendingStocks] = useState([]);
  const [featuredStocks, setFeaturedStocks] = useState(FEATURED_STOCKS);
  const [isMarketOpen, setIsMarketOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchResult, setSearchResult] = useState(null);
  const [user, setUser] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        // Redirect to home if not authenticated
        window.location.href = '/';
        return;
      }
      setUser(session.user);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    // Check if market is open (9:30 AM - 4:00 PM EST)
    const checkMarketHours = () => {
      const now = new Date();
      const estHour = now.getUTCHours() - 4; // Convert to EST
      const estMinutes = now.getUTCMinutes();
      const currentTimeInHours = estHour + (estMinutes / 60);
      setIsMarketOpen(currentTimeInHours >= TRADING_HOURS.START && currentTimeInHours < TRADING_HOURS.END);
    };

    checkMarketHours();
    const interval = setInterval(checkMarketHours, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const fetchTrendingStocks = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const symbols = ['AAPL', 'TSLA', 'MSFT', 'AMZN'];
        
        // Initialize with mock data that includes full company names
        const mockData = [
          { symbol: 'AAPL', name: 'Apple Inc.', price: 217.90, tradeValue: 39818617 },
          { symbol: 'TSLA', name: 'Tesla, Inc.', price: 263.55, tradeValue: 123530000 },
          { symbol: 'MSFT', name: 'Microsoft Corporation', price: 378.80, tradeValue: 21630000 },
          { symbol: 'AMZN', name: 'Amazon.com, Inc.', price: 192.72, tradeValue: 52540000 }
        ];
        setTrendingStocks(mockData);
        
        // Fetch real data with delays between requests
        const stocksData = [];
        for (const symbol of symbols) {
          try {
            // Pre-cache the company name
            const companyData = {
              'AAPL': 'Apple Inc.',
              'TSLA': 'Tesla, Inc.',
              'MSFT': 'Microsoft Corporation',
              'AMZN': 'Amazon.com, Inc.'
            };
            
            // Cache the company name before fetching data
            stockDataCache.set(symbol, {
              data: {
                symbol: symbol,
                name: companyData[symbol],
                price: null,
                tradeValue: null
              },
              timestamp: Date.now()
            });
            
            const data = await fetchStockData(symbol);
            stocksData.push({
              ...data,
              name: companyData[symbol] || data.name // Ensure we use the full company name
            });
            // Add small delay between requests to avoid rate limits
            await sleep(500);
          } catch (error) {
            console.error(`Error fetching data for ${symbol}:`, error);
            // If error occurs, use mock data for this stock with full company name
            const mockStock = mockData.find(s => s.symbol === symbol);
            if (mockStock) stocksData.push(mockStock);
          }
        }
        
        if (stocksData.length > 0) {
          const sortedStocks = stocksData.sort((a, b) => b.tradeValue - a.tradeValue);
          setTrendingStocks(sortedStocks);
        }
      } catch (error) {
        console.error('Error in fetchTrendingStocks:', error);
        setError('Unable to load stock data. Showing sample data instead.');
        // Use mock data with full company names as fallback
        setTrendingStocks([
          { symbol: 'AAPL', name: 'Apple Inc.', price: 217.90, tradeValue: 39818617 },
          { symbol: 'TSLA', name: 'Tesla, Inc.', price: 263.55, tradeValue: 123530000 },
          { symbol: 'MSFT', name: 'Microsoft Corporation', price: 378.80, tradeValue: 21630000 },
          { symbol: 'AMZN', name: 'Amazon.com, Inc.', price: 192.72, tradeValue: 52540000 }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrendingStocks();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchStockSuggestions = async (query) => {
    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      const apiKey = process.env.NEXT_PUBLIC_POLY_API_KEY;
      // Increase limit and remove sorting to get more comprehensive results
      const response = await fetch(
        `https://api.polygon.io/v3/reference/tickers?search=${query}&limit=20&market=stocks&active=true&apiKey=${apiKey}`
      );
      
      if (!response.ok) return;
      
      const data = await response.json();
      if (data.results) {
        const seenTickers = new Set();
        const filteredResults = data.results
          .filter(stock => {
            // Prioritize exact matches first
            const exactTickerMatch = stock.ticker.toUpperCase() === query.toUpperCase();
            const startsWithMatch = stock.ticker.toUpperCase().startsWith(query.toUpperCase());
            const containsMatch = stock.ticker.toUpperCase().includes(query.toUpperCase()) ||
                                stock.name.toLowerCase().includes(query.toLowerCase());
            
            if (!seenTickers.has(stock.ticker) && (exactTickerMatch || startsWithMatch || containsMatch)) {
              seenTickers.add(stock.ticker);
              return true;
            }
            return false;
          })
          // Sort results to prioritize exact matches and "starts with" matches
          .sort((a, b) => {
            const aExact = a.ticker.toUpperCase() === query.toUpperCase();
            const bExact = b.ticker.toUpperCase() === query.toUpperCase();
            if (aExact && !bExact) return -1;
            if (!aExact && bExact) return 1;
            
            const aStarts = a.ticker.toUpperCase().startsWith(query.toUpperCase());
            const bStarts = b.ticker.toUpperCase().startsWith(query.toUpperCase());
            if (aStarts && !bStarts) return -1;
            if (!aStarts && bStarts) return 1;
            
            return a.ticker.localeCompare(b.ticker);
          })
          .map(stock => ({
            ...stock,
            displayName: stock.name.length > 30 
              ? stock.name.substring(0, 30) + '...' 
              : stock.name
          }));

        setSuggestions(filteredResults);
        setShowSuggestions(true);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    fetchStockSuggestions(value);
  };

  const handleSuggestionClick = async (suggestion) => {
    setSearchQuery(suggestion.ticker);
    // Cache the company name but don't set price/volume yet
    stockDataCache.set(suggestion.ticker, {
      data: {
        symbol: suggestion.ticker,
        name: suggestion.name,
        tradeValue: null,  // Set to null to indicate price/volume need to be fetched
        price: null
      },
      timestamp: Date.now()
    });
    setShowSuggestions(false);
    setSuggestions([]);
    // Trigger search
    handleSearch({ preventDefault: () => {} });
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setIsLoading(true);
      setError(null);
      const stockData = await fetchStockData(searchQuery.toUpperCase());
      setSearchResult(stockData);
    } catch (error) {
      console.error('Error searching stock:', error);
      setError(error.message || 'Stock not found or error fetching data. Please check the symbol and try again.');
      setSearchResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const renderStockCard = (stock) => (
    <Card key={stock.symbol} className="p-4 bg-navy-900 border-navy-800 hover:border-blue-500 transition-all duration-300">
      <h3 className="font-bold text-white">{stock.name}</h3>
      <p className="text-sm text-blue-300">{stock.symbol}</p>
      <p className="text-sm font-medium text-white mt-2">Price: {formatNumber(stock.price)}</p>
      <p className="text-sm text-blue-300">Volume: {formatVolume(stock.tradeValue)}</p>
      <Button
        className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white border-none"
        disabled={!isMarketOpen}
      >
        {isMarketOpen ? 'Trade' : 'Market Closed'}
      </Button>
    </Card>
  );

  // Add new useEffect for featured stocks
  useEffect(() => {
    const fetchFeaturedStocks = async () => {
      try {
        const symbols = ['AAPL', 'TSLA', 'MSFT', 'AMZN'];
        const stocksData = [];
        
        // Pre-cache company names
        const companyData = {
          'AAPL': 'Apple Inc.',
          'TSLA': 'Tesla, Inc.',
          'MSFT': 'Microsoft Corporation',
          'AMZN': 'Amazon.com, Inc.'
        };
        
        // Initialize cache with company names
        for (const symbol of symbols) {
          stockDataCache.set(symbol, {
            data: {
              symbol: symbol,
              name: companyData[symbol],
              price: null,
              tradeValue: null
            },
            timestamp: Date.now()
          });
        }
        
        // Fetch real data for each stock
        for (const symbol of symbols) {
          try {
            const data = await fetchStockData(symbol);
            stocksData.push({
              ...data,
              name: companyData[symbol] || data.name
            });
            await sleep(500); // Add delay between requests
          } catch (error) {
            console.error(`Error fetching featured stock data for ${symbol}:`, error);
            // Use mock data as fallback
            const mockStock = FEATURED_STOCKS.find(s => s.symbol === symbol);
            if (mockStock) stocksData.push(mockStock);
          }
        }
        
        if (stocksData.length > 0) {
          setFeaturedStocks(stocksData);
        }
      } catch (error) {
        console.error('Error fetching featured stocks:', error);
      }
    };

    fetchFeaturedStocks();
  }, []);

  // If no user is authenticated, don't render the component
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black">
      <Navbar user={user} />
      <div className="container mx-auto px-4 py-8 pt-28">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-8">Explore Stocks</h1>
          <div className="relative max-w-2xl" ref={dropdownRef}>
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  type="text"
                  placeholder="Search stocks by symbol (e.g., AAPL)"
                  value={searchQuery}
                  onChange={handleInputChange}
                  onFocus={() => setShowSuggestions(true)}
                  className="flex-1 bg-navy-900 border-navy-800 text-black placeholder-blue-300 focus:border-blue-500"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={`${suggestion.ticker}-${index}`}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        <div className="font-medium text-gray-900">{suggestion.ticker}</div>
                        <div className="text-sm text-gray-600 truncate">{suggestion.displayName}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <Button 
                type="submit" 
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white border-none"
              >
                {isLoading ? 'Searching...' : 'Search'}
              </Button>
            </form>
          </div>
          {error && <p className="text-red-400 mt-2">{error}</p>}
          {searchResult && (
            <div className="mt-6">
              <h2 className="text-2xl font-bold mb-4 text-white">Search Result</h2>
              {renderStockCard(searchResult)}
            </div>
          )}
        </div>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-white">Featured Stocks</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredStocks.map((stock) => renderStockCard(stock))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold mb-6 text-white">Trending Stocks</h2>
          {isLoading ? (
            <p className="text-blue-300">Loading trending stocks...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {trendingStocks.map(renderStockCard)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Explore; 