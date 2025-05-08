"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Navbar from "./Navbar";
import { supabase } from "@/config/supabaseClient";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import TradeModal from "./TradeModal";
import {
  getStockQuote,
  getCompanyProfile,
  searchStocks,
} from "@/config/finnhubClient";
import { debounce } from "lodash";

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

const ExploreButton = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
ExploreButton.displayName = "ExploreButton";

const TRADING_HOURS = {
  START: 9.5, // 9:30 AM EST
  END: 16, // 4:00 PM EST
};

// Add holiday list (2025 major US market holidays)
const MARKET_HOLIDAYS = [
  "2025-01-01", // New Year's Day
  "2025-01-20", // Martin Luther King Jr. Day
  "2025-02-17", // Presidents Day
  "2025-04-18", // Good Friday
  "2025-05-26", // Memorial Day
  "2025-06-19", // Juneteenth
  "2025-07-04", // Independence Day
  "2025-09-01", // Labor Day
  "2025-10-13", // Columbus Day
  "2025-11-27", // Thanksgiving Day
  "2025-12-24", // Christmas Eve (early close)
  "2025-12-25", // Christmas Day
];

// Define featured and trending stocks
const FEATURED_STOCKS = ["AAPL", "MSFT", "GOOGL", "AMZN"];
const TRENDING_STOCKS = ["TSLA", "META", "NVDA", "AMD"];

const formatNumber = (number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number);
};

const formatVolume = (volume) => {
  if (volume === undefined || volume === null) return "N/A";
  if (volume === 0) return "0";

  // Always format in thousands (K)
  const volumeInThousands = volume / 1000;
  return `${volumeInThousands.toFixed(2)}K`;
};

const CACHE_DURATION = 60 * 1000; // Keep this for future use
const API_REQUESTS_PER_MINUTE = 5; // Keep this for future use
const REQUEST_INTERVAL = Math.ceil((60 * 1000) / API_REQUESTS_PER_MINUTE);

const DataSource = {
  MOCK: "mock",
  FINNHUB: "finnhub",
};

const createStockData = (data, source) => ({
  ...data,
  dataSource: source,
  lastUpdated: new Date().toLocaleTimeString(),
});

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [trendingStocks, setTrendingStocks] = useState([]);
  const [featuredStocks, setFeaturedStocks] = useState([]);
  const [isMarketOpen, setIsMarketOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchResult, setSearchResult] = useState(null);
  const [user, setUser] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const dropdownRef = useRef(null);
  const [selectedStocks, setSelectedStocks] = useState([]);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [userBalance, setUserBalance] = useState(0);
  const [userPortfolio, setUserPortfolio] = useState({});
  const [stockSymbolMap, setStockSymbolMap] = useState({});
  const [stockData, setStockData] = useState({});
  const [isLoadingStocks, setIsLoadingStocks] = useState(true);
  const [loadingStates, setLoadingStates] = useState({});
  const searchTimeoutRef = useRef(null);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        // Redirect to home if not authenticated
        window.location.href = "/";
        return;
      }
      setUser(session.user);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          // Fetch user balance from profiles table
          const { data: profileData, error: profileError } = await supabase
            .from("profiles")
            .select("wallet_amt")
            .eq("user_id", session.user.id)
            .single();

          if (profileError) {
            throw new Error("Failed to fetch profile");
          }

          // Fetch user's stock portfolio from userstock table with stock information
          const { data: portfolioData, error: portfolioError } = await supabase
            .from("userstock")
            .select(
              `
              stock_id,
              amt_bought,
              total_spent,
              stock:stock (
                tick
              )
            `
            )
            .eq("user_id", session.user.id);

          if (portfolioError) {
            throw new Error("Failed to fetch portfolio data");
          }

          if (profileData) {
            setUserBalance(profileData.wallet_amt || 0);
          }

          if (portfolioData) {
            const portfolio = {};
            const symbolMap = {};

            portfolioData.forEach((item) => {
              const symbol = item.stock.tick;
              portfolio[symbol] = {
                quantity: item.amt_bought,
                totalSpent: item.total_spent,
                stockId: item.stock_id,
              };
              symbolMap[item.stock_id] = symbol;
            });

            setUserPortfolio(portfolio);
            setStockSymbolMap(symbolMap);
          }
        }
      } catch (error) {
        setError("Error fetching user data");
      }
    };

    fetchUserData();
  }, []);

  useEffect(() => {
    // Check if market is open (9:30 AM - 4:00 PM EST, weekdays only, excluding holidays)
    const checkMarketHours = () => {
      const now = new Date();
      const estHour = now.getUTCHours() - 4; // Convert to EST
      const estMinutes = now.getUTCMinutes();
      const currentTimeInHours = estHour + estMinutes / 60;

      // Check if it's a weekend (0 = Sunday, 6 = Saturday)
      const isWeekend = now.getUTCDay() === 0 || now.getUTCDay() === 6;

      // Check if it's a holiday
      const today = now.toISOString().split("T")[0];
      const isHoliday = MARKET_HOLIDAYS.includes(today);

      // Market is open only on weekdays, during trading hours, and not on holidays
      setIsMarketOpen(
        !isWeekend &&
          !isHoliday &&
          currentTimeInHours >= TRADING_HOURS.START &&
          currentTimeInHours < TRADING_HOURS.END
      );
    };

    checkMarketHours();
    const interval = setInterval(checkMarketHours, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  // Fetch stock data for a given symbol
  const fetchStockData = async (symbol) => {
    try {
      const [quote, profile] = await Promise.all([
        getStockQuote(symbol),
        getCompanyProfile(symbol),
      ]);

      // Update the stock data
      setStockData((prevData) => ({
        ...prevData,
        [symbol]: {
          quote,
          profile,
        },
      }));
    } catch (error) {}
  };

  // Update all stock data
  const updateAllStockData = async () => {
    setIsLoadingStocks(true);
    try {
      // Prepare all symbols to fetch
      const allSymbols = [...FEATURED_STOCKS];

      // Add trending stocks that aren't in featured stocks
      TRENDING_STOCKS.filter(
        (symbol) => !FEATURED_STOCKS.includes(symbol)
      ).forEach((symbol) => allSymbols.push(symbol));

      // Add selected stock if any
      if (selectedStocks.length > 0) {
        allSymbols.push(...selectedStocks);
      }

      // Process stocks in parallel batches of 4 to balance speed and rate limiting
      const batchSize = 4;
      for (let i = 0; i < allSymbols.length; i += batchSize) {
        const batch = allSymbols.slice(i, i + batchSize);
        await Promise.all(batch.map((symbol) => fetchStockData(symbol)));

        // Small delay between batches to avoid rate limiting
        if (i + batchSize < allSymbols.length) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      }
    } catch (error) {
      setError("Error updating stock data");
    } finally {
      setIsLoadingStocks(false);
    }
  };

  // Update stock data periodically
  useEffect(() => {
    // Initial load with featured stocks first
    const loadInitialData = async () => {
      try {
        // Load featured stocks first for faster initial render
        const featuredPromises = FEATURED_STOCKS.slice(0, 2).map((symbol) =>
          fetchStockData(symbol)
        );
        await Promise.all(featuredPromises);

        // Then load the rest in the background
        const remainingStocks = [
          ...FEATURED_STOCKS.slice(2),
          ...TRENDING_STOCKS,
        ];
        const loadRemainingStocks = async () => {
          for (const symbol of remainingStocks) {
            await fetchStockData(symbol);
            // Small delay between requests to avoid rate limiting
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
          setIsLoadingStocks(false);
        };

        // Start loading remaining stocks in the background
        loadRemainingStocks();
      } catch (error) {
        setIsLoadingStocks(false);
      }
    };

    loadInitialData();

    // Update stocks every minute if market is open
    const interval = setInterval(() => {
      if (isMarketOpen) {
        updateAllStockData();
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [isMarketOpen]);

  // Add a separate effect to handle selectedStock changes
  useEffect(() => {
    if (selectedStocks.length > 0 && !stockData[selectedStocks[0]]) {
      fetchStockData(selectedStocks[0]);
    }
  }, [selectedStocks]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      // Only handle clicks outside the dropdown when suggestions are showing
      if (
        showSuggestions &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSuggestions]);

  const fetchStockSuggestions = async (query) => {
    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    try {
      // Show loading state immediately
      setSuggestions([
        { symbol: "Loading...", name: "", displayName: "Loading..." },
      ]);
      setShowSuggestions(true);

      // Special case for popular companies to ensure they show up first
      const popularCompanies = {
        apple: "AAPL",
        microsoft: "MSFT",
        amazon: "AMZN",
        google: "GOOGL",
        alphabet: "GOOGL",
        tesla: "TSLA",
        facebook: "META",
        meta: "META",
        nvidia: "NVDA",
      };

      const lowerQuery = query.toLowerCase().trim();

      // If the query exactly matches a popular company name, prioritize that stock
      if (popularCompanies[lowerQuery]) {
        const symbol = popularCompanies[lowerQuery];
        // Fetch the specific symbol directly if it's a known popular company
        try {
          const [quote, profile] = await Promise.all([
            getStockQuote(symbol),
            getCompanyProfile(symbol),
          ]);

          // Create a suggestion with this specific stock
          setSuggestions([
            {
              symbol: symbol,
              name: profile.name || "",
              description: profile.name || "",
              score: 1000,
            },
          ]);
          setShowSuggestions(true);
          return;
        } catch (err) {
          // Fall back to standard search if direct fetch fails
          console.log(
            "Direct popular company fetch failed, falling back to search"
          );
        }
      }

      const searchResults = await searchStocks(query);

      if (searchResults && searchResults.length > 0) {
        // Filter the results to include only stocks (remove crypto, forex, etc.)
        const filteredResults = searchResults.filter(
          (item) =>
            // Include common stock types
            !item.type ||
            item.type === "Common Stock" ||
            item.type === "Stock" ||
            item.type === "ETP" ||
            // Or if type is missing but we have a symbol and description
            (item.symbol && item.description)
        );

        if (filteredResults.length > 0) {
          // Process results to prioritize exact matches and add name for display
          const processedResults = filteredResults
            .map((result) => ({
              ...result,
              score: calculateRelevanceScore(result, query),
              name: result.description || "",
            }))
            // Sort by relevance score (higher first)
            .sort((a, b) => b.score - a.score)
            // Limit to first 10 results
            .slice(0, 10);

          setSuggestions(processedResults);
          setShowSuggestions(true);
        } else {
          setSuggestions([
            {
              symbol: "No results",
              name: "Try a different search term",
              displayName: "No matching stocks found",
            },
          ]);
          setTimeout(() => {
            setSuggestions([]);
            setShowSuggestions(false);
          }, 2000);
        }
      } else {
        setSuggestions([
          {
            symbol: "No results",
            name: "Try a different search term",
            displayName: "No matching stocks found",
          },
        ]);
        setShowSuggestions(true);

        // Hide "no results" message after 2 seconds
        setTimeout(() => {
          setSuggestions([]);
          setShowSuggestions(false);
        }, 2000);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setSuggestions([
        {
          symbol: "Error",
          name: "Please try again",
          displayName: "Failed to fetch results",
        },
      ]);
      setShowSuggestions(true);

      // Hide error message after 2 seconds
      setTimeout(() => {
        setSuggestions([]);
        setShowSuggestions(false);
      }, 2000);
    }
  };

  // Helper function to calculate relevance score for search results
  const calculateRelevanceScore = (item, query) => {
    const queryLower = query.toLowerCase().trim();
    const symbolLower = (item.symbol || "").toLowerCase().trim();
    const nameLower = (item.description || "").toLowerCase().trim();

    // Special cases for major companies - prioritize these
    const popularCompanies = {
      apple: "AAPL",
      microsoft: "MSFT",
      amazon: "AMZN",
      google: "GOOGL",
      alphabet: "GOOGL",
      tesla: "TSLA",
      facebook: "META",
      meta: "META",
      nvidia: "NVDA",
    };

    let score = 0;

    // Direct match with popular company - highest score
    if (
      popularCompanies[queryLower] &&
      popularCompanies[queryLower] === symbolLower
    ) {
      return 1000; // Return immediately with highest priority
    }

    // Check if description/name directly matches a popular company name
    if (popularCompanies[queryLower] && nameLower.includes(queryLower)) {
      return 900; // Very high score for popular companies
    }

    // Exact symbol match (highest for normal cases)
    if (symbolLower === queryLower) {
      score += 200;
    }
    // Symbol starts with query
    else if (symbolLower.startsWith(queryLower)) {
      score += 150;
    }
    // Symbol contains query
    else if (symbolLower.includes(queryLower)) {
      score += 100;
    }

    // Exact name match (almost as good as exact symbol)
    if (nameLower === queryLower) {
      score += 180;
    }
    // Name starts with query (very good signal)
    else if (nameLower.startsWith(queryLower)) {
      score += 160;
    }
    // Name contains query as a whole word
    else if (
      nameLower.includes(` ${queryLower} `) ||
      nameLower.startsWith(`${queryLower} `) ||
      nameLower.endsWith(` ${queryLower}`)
    ) {
      score += 140;
    }
    // Name contains query
    else if (nameLower.includes(queryLower)) {
      score += 120;
    }

    // Prioritize US exchanges and common stocks if available
    if (item.type === "Common Stock") {
      score += 50;
    }

    // Penalize ADRs and foreign stocks slightly
    if (nameLower.includes("adr") || item.type === "ADR") {
      score -= 20;
    }

    // Penalize preferred stocks slightly
    if (nameLower.includes("preferred") || item.type?.includes("Preferred")) {
      score -= 10;
    }

    return score;
  };

  // Debounce the search with a shorter delay
  const debouncedSearch = useCallback(
    debounce((query) => {
      if (query.trim().length >= 2) {
        fetchStockSuggestions(query);
      }
    }, 300),
    []
  );

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Clear any existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Only search if we have at least 2 characters
    if (value.trim().length >= 2) {
      debouncedSearch(value);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = async (suggestion) => {
    // Don't process clicks on loading or error states
    if (
      suggestion.symbol === "Loading..." ||
      suggestion.symbol === "Error" ||
      suggestion.symbol === "No results"
    ) {
      return;
    }

    try {
      // Set loading state for this stock
      setLoadingStates((prev) => ({ ...prev, [suggestion.symbol]: true }));

      const [quote, profile] = await Promise.all([
        getStockQuote(suggestion.symbol),
        getCompanyProfile(suggestion.symbol),
      ]);

      // Update the stock data first
      setStockData((prevData) => ({
        ...prevData,
        [suggestion.symbol]: {
          quote,
          profile,
        },
      }));

      // Clear search state
      setSearchQuery("");
      setSuggestions([]);
      setShowSuggestions(false);

      // Update selected stocks
      setSelectedStocks((prevStocks) =>
        prevStocks.includes(suggestion.symbol)
          ? prevStocks
          : [suggestion.symbol]
      );
    } catch (error) {
      console.error("Error handling suggestion click:", error);
      setError(`Failed to load stock data for ${suggestion.symbol}`);
    } finally {
      setLoadingStates((prev) => ({ ...prev, [suggestion.symbol]: false }));
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setIsLoading(true);
      setError(null);

      // Special handling for popular companies
      const popularCompanies = {
        apple: "AAPL",
        microsoft: "MSFT",
        amazon: "AMZN",
        google: "GOOGL",
        alphabet: "GOOGL",
        tesla: "TSLA",
        facebook: "META",
        meta: "META",
        nvidia: "NVDA",
      };

      const lowerQuery = searchQuery.toLowerCase().trim();

      // Direct match with popular company name
      if (popularCompanies[lowerQuery]) {
        const symbol = popularCompanies[lowerQuery];

        // Fetch the stock data if we don't have it
        if (!stockData[symbol]) {
          await fetchStockData(symbol);
        }

        if (stockData[symbol] || symbol in stockData) {
          setSelectedStocks([symbol]);
          setIsLoading(false);
          setSearchQuery("");
          setShowSuggestions(false);
          return;
        }
      }

      // Next try exact symbol match (case insensitive)
      const queryUppercase = searchQuery.toUpperCase();

      // Check if we have this stock in our data by symbol
      if (stockData[queryUppercase] || queryUppercase in stockData) {
        setSelectedStocks([queryUppercase]);
        setIsLoading(false);
        setSearchQuery("");
        setShowSuggestions(false);
        return;
      }

      // If not found by symbol, search by name and symbol via API
      try {
        const searchResults = await searchStocks(searchQuery);

        if (searchResults && searchResults.length > 0) {
          // Filter to include only stocks
          const filteredResults = searchResults.filter(
            (item) =>
              !item.type ||
              item.type === "Common Stock" ||
              item.type === "Stock" ||
              item.type === "ETP" ||
              (item.symbol && item.description)
          );

          if (filteredResults.length > 0) {
            // Process and score the results
            const scoredResults = filteredResults
              .map((result) => ({
                ...result,
                score: calculateRelevanceScore(result, searchQuery),
              }))
              .sort((a, b) => b.score - a.score);

            // Use the best match
            const bestMatch = scoredResults[0];
            const symbol = bestMatch.symbol;

            // Fetch stock data if we don't have it
            if (!stockData[symbol]) {
              await fetchStockData(symbol);
            }

            // Update selected stocks to display the search result
            if (stockData[symbol] || symbol in stockData) {
              setSelectedStocks([symbol]);
            } else {
              throw new Error(`Could not fetch data for ${symbol}`);
            }
          } else {
            throw new Error(
              "No matching stocks found. Try a different search term."
            );
          }
        } else {
          throw new Error(
            "No matching stocks found. Try a different search term."
          );
        }
      } catch (error) {
        throw new Error(error.message || "Error searching for stock");
      }
    } catch (error) {
      setError(error.message || "Error searching stock");
      setSearchResult(null);
    } finally {
      setIsLoading(false);
      // Clear search query after search
      setSearchQuery("");
      // Close suggestions if open
      setShowSuggestions(false);
    }
  };

  const handleTrade = async (symbol, type, quantity) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error("User not authenticated");
      }

      // Get stock data from stockData state
      const stockInfo = stockData[symbol];

      if (!stockInfo) {
        throw new Error("Stock not found");
      }

      const currentPrice = stockInfo.quote.c;
      const tradeCost = currentPrice * quantity;

      // Get stock ID from the stock table
      const { data: stockTableData, error: stockTableError } = await supabase
        .from("stock")
        .select("id")
        .eq("tick", symbol)
        .maybeSingle();

      let stockId;
      if (!stockTableData) {
        // Insert the stock if it doesn't exist
        const { data: newStock, error: insertError } = await supabase
          .from("stock")
          .insert({
            name: symbol,
            tick: symbol,
            num_investors: 1,
          })
          .select("id")
          .single();

        if (insertError) {
          throw new Error(
            `Failed to create stock record: ${
              insertError.message || "Unknown error"
            }`
          );
        }

        stockId = newStock.id;
      } else {
        stockId = stockTableData.id;
      }

      // Get current profile data
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("wallet_amt")
        .eq("user_id", session.user.id)
        .single();

      if (profileError) {
        throw new Error("Failed to fetch user profile");
      }

      const currentBalance = profileData.wallet_amt || 0;

      // Get current stock holding
      const { data: userStockData, error: stockError } = await supabase
        .from("userstock")
        .select("amt_bought, total_spent")
        .eq("user_id", session.user.id)
        .eq("stock_id", stockId)
        .maybeSingle();

      if (stockError) {
        throw new Error(
          `Failed to fetch current stock holding: ${
            stockError.message || "Unknown error"
          }`
        );
      }

      const currentQuantity = userStockData?.amt_bought || 0;
      const currentTotalSpent = userStockData?.total_spent || 0;

      if (type === "buy") {
        if (currentBalance < tradeCost) {
          throw new Error(
            `Insufficient funds. Required: ${formatNumber(
              tradeCost
            )}, Available: ${formatNumber(currentBalance)}`
          );
        }
      } else if (type === "sell") {
        if (currentQuantity < quantity) {
          throw new Error(
            `Insufficient shares. Required: ${quantity}, Available: ${currentQuantity}`
          );
        }
      }

      // Calculate new values
      const newQuantity =
        type === "buy"
          ? currentQuantity + quantity
          : currentQuantity - quantity;
      let newTotalSpent;

      if (type === "buy") {
        newTotalSpent = currentTotalSpent + tradeCost;
      } else {
        const avgCostPerShare = currentTotalSpent / currentQuantity;
        newTotalSpent = currentTotalSpent - avgCostPerShare * quantity;
      }

      // Calculate the actual amount to add/subtract from wallet
      const walletAdjustment = type === "buy" ? -tradeCost : tradeCost;

      // First, update the wallet balance
      const { error: walletError } = await supabase
        .from("profiles")
        .update({
          wallet_amt: currentBalance + walletAdjustment,
        })
        .eq("user_id", session.user.id);

      if (walletError) {
        throw new Error(
          `Failed to update wallet balance: ${
            walletError.message || "Unknown error"
          }`
        );
      }

      // Then, handle the stock transaction
      let tradeError;
      if (newQuantity > 0) {
        const { error } = await supabase.from("userstock").upsert(
          [
            {
              user_id: session.user.id,
              stock_id: stockId,
              amt_bought: newQuantity,
              total_spent: newTotalSpent,
            },
          ],
          {
            onConflict: "user_id,stock_id",
            ignoreDuplicates: false,
          }
        );
        tradeError = error;

        // Update num_investors in stock table if this is a new investment
        if (!userStockData) {
          // First get current num_investors
          const { data: currentStock } = await supabase
            .from("stock")
            .select("num_investors")
            .eq("id", stockId)
            .single();

          const currentInvestors = currentStock?.num_investors || 0;

          await supabase
            .from("stock")
            .update({ num_investors: currentInvestors + 1 })
            .eq("id", stockId);
        }
      } else {
        const { error } = await supabase
          .from("userstock")
          .delete()
          .eq("user_id", session.user.id)
          .eq("stock_id", stockId);
        tradeError = error;

        // Decrease num_investors in stock table
        const { data: currentStock } = await supabase
          .from("stock")
          .select("num_investors")
          .eq("id", stockId)
          .single();

        const currentInvestors = currentStock?.num_investors || 0;
        const newInvestors = Math.max(0, currentInvestors - 1);

        await supabase
          .from("stock")
          .update({ num_investors: newInvestors })
          .eq("id", stockId);
      }

      if (tradeError) {
        // Rollback wallet update if stock transaction fails
        await supabase
          .from("profiles")
          .update({
            wallet_amt: currentBalance,
          })
          .eq("user_id", session.user.id);

        throw new Error(
          `Failed to execute trade: ${tradeError.message || "Unknown error"}`
        );
      }

      //Record transaction
      const {data: recordedTransaction, error: transactionError } = await supabase
        .from('transactionhistory')
        .insert({
          user_id: session.user.id,
          stock_id: stockId,
          type,
          quantity,
          price_per_share: currentPrice,
          total_amount: tradeCost
        });
        console.log(recordedTransaction);
        console.log(transactionError);
        if (transactionError) {
          console.error('Failed to log transaction:', transactionError);
        }

      // Fetch updated balance
      const { data: updatedProfile, error: updateError } = await supabase
        .from("profiles")
        .select("wallet_amt")
        .eq("user_id", session.user.id)
        .single();

      if (!updateError) {
        setUserBalance(updatedProfile.wallet_amt);
      }

      // Update portfolio in state
      if (newQuantity > 0) {
        setUserPortfolio((prev) => ({
          ...prev,
          [symbol]: {
            quantity: newQuantity,
            totalSpent: newTotalSpent,
          },
        }));
      } else {
        setUserPortfolio((prev) => {
          const newPortfolio = { ...prev };
          delete newPortfolio[symbol];
          return newPortfolio;
        });
      }
    } catch (error) {
      throw error.message || "Failed to execute trade";
    }
  };

  // Optimize the stock card rendering
  const renderStockCard = (stock, symbol) => {
    if (!stock || !stock.profile || !stock.quote) {
      return (
        <Card
          key={`loading-${symbol}`}
          className="p-4 bg-white dark:bg-gray-800 animate-pulse"
        >
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </Card>
      );
    }

    const handleCardClick = (e) => {
      // Stop event propagation to prevent click outside handler from firing
      e.stopPropagation();

      // Only update selectedStocks if this is a search result card
      if (selectedStocks.includes(symbol)) {
        setSelectedStocks([symbol]);
      }

      // Only show trade modal if market is open
      if (isMarketOpen) {
        setShowTradeModal(true);
      }
    };

    // Calculate daily change in dollar value
    const priceChange = stock.quote.d || 0;
    const percentChange = stock.quote.dp || 0;
    const isPositive = percentChange >= 0;

    return (
      <Card
        key={stock.profile.ticker}
        className={`overflow-hidden bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-blue-500 hover:shadow-lg transition-all duration-300 ${
          isMarketOpen ? "cursor-pointer" : ""
        }`}
        onClick={handleCardClick}
      >
        <div className="relative">
          {/* Color bar at top - green for positive, red for negative */}
          <div
            className={`absolute top-0 left-0 right-0 h-1 ${
              isPositive
                ? "bg-gradient-to-r from-green-400 to-green-500"
                : "bg-gradient-to-r from-red-400 to-red-500"
            }`}
          />

          <div className="p-5">
            {/* Header with company name and logo placeholder */}
            <div className="flex items-center mb-3">
              <div
                className={`w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold mr-3 ${
                  isPositive ? "bg-green-500" : "bg-red-500"
                }`}
              >
                {symbol.charAt(0)}
              </div>
              <div className="flex-1">
                <h3
                  className="font-bold text-gray-900 dark:text-white text-lg truncate"
                  title={stock.profile.name}
                >
                  {stock.profile.name}
                </h3>
                <span className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 text-xs px-2 py-0.5 rounded">
                  {stock.profile.ticker}
                </span>
              </div>
            </div>

            {/* Main price display */}
            <div className="flex justify-between items-baseline mb-3">
              <span className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(stock.quote.c)}
              </span>
              <div className="flex items-center">
                <span
                  className={`text-sm font-semibold ${
                    isPositive
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {isPositive ? "+" : ""}
                  {formatNumber(priceChange)}
                </span>
              </div>
            </div>

            {/* Price change info */}
            <div
              className={`flex items-center ${
                isPositive
                  ? "text-green-600 dark:text-green-400"
                  : "text-red-600 dark:text-red-400"
              } mb-3`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-1"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                {isPositive ? (
                  <path
                    fillRule="evenodd"
                    d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z"
                    clipRule="evenodd"
                  />
                ) : (
                  <path
                    fillRule="evenodd"
                    d="M12 13a1 1 0 100 2h5a1 1 0 001-1v-5a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586l-4.293-4.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z"
                    clipRule="evenodd"
                  />
                )}
              </svg>
              <span className="font-medium">
                {isPositive ? "+" : ""}
                {percentChange.toFixed(2)}%
              </span>
            </div>

            {/* Additional info */}
            <div className="grid grid-cols-2 gap-2 mt-3 text-sm border-t border-gray-100 dark:border-gray-700 pt-3">
              {stock.quote.o && (
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Open</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatNumber(stock.quote.o)}
                  </p>
                </div>
              )}
              {stock.quote.h && (
                <div>
                  <p className="text-gray-500 dark:text-gray-400">High</p>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {formatNumber(stock.quote.h)}
                  </p>
                </div>
              )}
            </div>

            {/* Market status indicator */}
            {!isMarketOpen && (
              <div className="mt-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-md px-3 py-1.5 text-xs flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Market Closed
              </div>
            )}

            {/* Trade button (visible only when market is open) */}
            {isMarketOpen && (
              <button
                className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-md text-sm font-medium transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedStocks([symbol]);
                  setShowTradeModal(true);
                }}
              >
                Trade
              </button>
            )}
          </div>
        </div>
      </Card>
    );
  };

  const renderPortfolioCard = (symbol) => {
    const position = userPortfolio[symbol];
    if (!position) return null;

    const stock = stockData[symbol];
    if (!stock) return null;

    const quantity = position.quantity;
    const currentValue = stock.quote.c * quantity;
    const avgCostBasis = position.totalSpent / quantity;
    const totalGainLoss = (stock.quote.c - avgCostBasis) * quantity;
    const percentageChange =
      ((stock.quote.c - avgCostBasis) / avgCostBasis) * 100;
    const isPositive = percentageChange >= 0;

    return (
      <Card
        key={symbol}
        className="overflow-hidden bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-blue-500 hover:shadow-lg transition-all duration-300 cursor-pointer"
        onClick={() => {
          if (isMarketOpen) {
            setSelectedStocks([symbol]);
            setShowTradeModal(true);
          }
        }}
      >
        <div className="relative">
          {/* Color bar at top - green for positive, red for negative */}
          <div
            className={`absolute top-0 left-0 right-0 h-1 ${
              isPositive
                ? "bg-gradient-to-r from-green-400 to-green-500"
                : "bg-gradient-to-r from-red-400 to-red-500"
            }`}
          />

          <div className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-md flex items-center justify-center text-white font-bold mr-2 ${
                    isPositive ? "bg-green-500" : "bg-red-500"
                  }`}
                >
                  {symbol.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">
                    {symbol}
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {quantity} shares
                  </p>
                </div>
              </div>
              <div
                className={`text-xs font-medium px-2 py-1 rounded-full ${
                  isPositive
                    ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
                    : "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                }`}
              >
                {isPositive ? "+" : ""}
                {percentageChange.toFixed(2)}%
              </div>
            </div>

            <div className="flex justify-between items-baseline mt-3">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs">
                  Current Value
                </p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {formatNumber(currentValue)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-gray-500 dark:text-gray-400 text-xs">
                  Price
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {formatNumber(stock.quote.c)}
                </p>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 grid grid-cols-2 gap-2">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs">
                  Avg Cost
                </p>
                <p className="text-sm font-medium">
                  {formatNumber(avgCostBasis)}
                </p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-xs">
                  Gain/Loss
                </p>
                <p
                  className={`text-sm font-medium ${
                    totalGainLoss >= 0
                      ? "text-green-600 dark:text-green-400"
                      : "text-red-600 dark:text-red-400"
                  }`}
                >
                  {totalGainLoss >= 0 ? "+" : ""}
                  {formatNumber(totalGainLoss)}
                </p>
              </div>
            </div>

            {!isMarketOpen && (
              <div className="mt-3 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-md px-3 py-1.5 text-xs flex items-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-1"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
                Market Closed
              </div>
            )}

            {isMarketOpen && (
              <button
                className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded-md text-xs font-medium transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedStocks([symbol]);
                  setShowTradeModal(true);
                }}
              >
                Trade
              </button>
            )}
          </div>
        </div>
      </Card>
    );
  };

  // If no user is authenticated, don't render the component
  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar user={user} />
      <div className="container mx-auto px-4 py-8 pt-28">
        {/* Main header section with balance */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Explore Stocks
          </h1>
          <div className="bg-white dark:bg-gray-800 px-6 py-3 rounded-lg shadow-md border border-gray-100 dark:border-gray-700">
            <p className="text-gray-900 dark:text-white text-lg">
              Balance:{" "}
              <span className="font-bold">{formatNumber(userBalance)}</span>
            </p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Main Content - Left Side */}
          <div className="col-span-12 lg:col-span-9">
            <div className="mb-12">
              <div className="relative max-w-2xl mb-6" ref={dropdownRef}>
                <form onSubmit={handleSearch} className="flex flex-col gap-2">
                  <div className="relative flex-1 group">
                    {/* Search icon */}
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-gray-400 dark:text-gray-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>

                    {/* Loading spinner */}
                    {isLoading && (
                      <div className="absolute inset-y-0 right-3 flex items-center">
                        <svg
                          className="animate-spin h-5 w-5 text-blue-500"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                      </div>
                    )}

                    {/* Enhanced input with animation and better styling */}
                    <Input
                      type="text"
                      placeholder="Search by symbol or company name (e.g., AAPL, Apple)"
                      value={searchQuery}
                      onChange={handleInputChange}
                      onFocus={() => {
                        if (searchQuery.trim()) {
                          setShowSuggestions(true);
                        }
                      }}
                      className="flex-1 pl-10 pr-3 py-3 h-12 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg shadow-sm focus:border-blue-500 focus:ring-0 transition-all duration-200 group-hover:border-blue-300 dark:group-hover:border-blue-800"
                    />

                    {/* Enhanced search button that appears on small screens */}
                    <div className="mt-2 md:mt-0 md:absolute md:inset-y-0 md:right-0 md:flex md:items-center md:pr-1">
                      <ExploreButton
                        type="submit"
                        disabled={isLoading}
                        className="w-full md:w-auto h-12 md:h-10 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 rounded-lg md:rounded-r-lg md:rounded-l-none border-2 border-blue-600 hover:border-blue-700 shadow-sm transition-colors duration-200"
                      >
                        <span className="flex items-center justify-center">
                          {isLoading ? "Searching..." : "Search"}
                        </span>
                      </ExploreButton>
                    </div>
                  </div>

                  {/* Error message display */}
                  {error && (
                    <div className="px-4 py-2 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-md text-sm flex items-center mt-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {error}
                    </div>
                  )}

                  {/* Popular searches chips */}
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400 self-center">
                      Popular:
                    </span>
                    {["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA"].map((symbol) => (
                      <button
                        key={symbol}
                        type="button"
                        onClick={() => {
                          setSearchQuery(symbol);
                          handleSearch({ preventDefault: () => {} });
                        }}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-gray-700 dark:text-gray-300 hover:text-blue-700 dark:hover:text-blue-300 rounded-full text-xs transition-colors duration-200 border border-gray-200 dark:border-gray-700"
                      >
                        {symbol}
                      </button>
                    ))}
                  </div>
                </form>

                {/* Enhanced suggestions dropdown */}
                {showSuggestions && (
                  <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-80 overflow-y-auto">
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={`${suggestion.symbol}-${index}`}
                        className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-150 ${
                          index !== suggestions.length - 1
                            ? "border-b border-gray-100 dark:border-gray-700"
                            : ""
                        }`}
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        {suggestion.symbol === "Loading..." ? (
                          <div className="flex items-center justify-center py-2">
                            <svg
                              className="animate-spin h-5 w-5 text-blue-500 mr-3"
                              xmlns="http://www.w3.org/2000/svg"
                              fill="none"
                              viewBox="0 0 24 24"
                            >
                              <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                              />
                              <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              />
                            </svg>
                            <span className="text-gray-600 dark:text-gray-400">
                              Searching...
                            </span>
                          </div>
                        ) : suggestion.symbol === "Error" ||
                          suggestion.symbol === "No results" ? (
                          <div className="flex items-center py-2">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-5 w-5 text-red-500 mr-3"
                              viewBox="0 0 20 20"
                              fill="currentColor"
                            >
                              <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <span className="text-gray-600 dark:text-gray-400">
                              {suggestion.name}
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-md flex items-center justify-center bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 mr-3 font-bold">
                              {suggestion.symbol.charAt(0)}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-center">
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {suggestion.symbol}
                                </div>
                                <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 px-2 py-0.5 rounded-full">
                                  Stock
                                </span>
                              </div>
                              <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                {suggestion.name || suggestion.description}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Search Result Card */}
              {selectedStocks.length > 0 && stockData[selectedStocks[0]] && (
                <div className="mb-12">
                  <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                    Search Result
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderStockCard(
                      stockData[selectedStocks[0]],
                      selectedStocks[0]
                    )}
                  </div>
                </div>
              )}
            </div>

            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                Featured Stocks
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {FEATURED_STOCKS.map((symbol) =>
                  renderStockCard(stockData[symbol], symbol)
                )}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
                Trending Stocks
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {TRENDING_STOCKS.map((symbol) =>
                  renderStockCard(stockData[symbol], symbol)
                )}
              </div>
            </section>
          </div>

          {/* Stock List - Right Side */}
          <div className="col-span-12 lg:col-span-3">
            <div className="sticky top-28">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">
                My Stock List
              </h2>
              <div className="space-y-3 max-h-[calc(100vh-150px)] overflow-y-auto pr-2">
                {Object.keys(userPortfolio)
                  .filter((symbol) => userPortfolio[symbol].quantity > 0)
                  .map((symbol) => renderPortfolioCard(symbol))}
                {Object.keys(userPortfolio).length === 0 && (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    No stocks owned yet. Start trading to build your portfolio!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {showTradeModal &&
        selectedStocks.length > 0 &&
        stockData[selectedStocks[0]] && (
          <TradeModal
            stock={stockData[selectedStocks[0]]}
            onClose={() => {
              setShowTradeModal(false);
              setSelectedStocks([]);
            }}
            onTrade={handleTrade}
          />
        )}
    </div>
  );
};

export default Explore;