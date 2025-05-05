'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from './Navbar';
import { supabase } from '@/config/supabaseClient';
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import TradeModal from './TradeModal';
import { getStockQuote, getCompanyProfile, searchStocks } from '@/config/finnhubClient';
import { debounce } from 'lodash';

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

// Add holiday list (2025 major US market holidays)
const MARKET_HOLIDAYS = [
  '2025-01-01', // New Year's Day
  '2025-01-20', // Martin Luther King Jr. Day
  '2025-02-17', // Presidents Day
  '2025-04-18', // Good Friday
  '2025-05-26', // Memorial Day
  '2025-06-19', // Juneteenth
  '2025-07-04', // Independence Day
  '2025-09-01', // Labor Day
  '2025-10-13', // Columbus Day
  '2025-11-27', // Thanksgiving Day
  '2025-12-24', // Christmas Eve (early close)
  '2025-12-25', // Christmas Day
];

// Define featured and trending stocks
const FEATURED_STOCKS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN'];
const TRENDING_STOCKS = ['TSLA', 'META', 'NVDA', 'AMD'];

const formatNumber = (number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number);
};

const formatVolume = (volume) => {
  if (volume === undefined || volume === null) return 'N/A';
  if (volume === 0) return '0';
  
  // Always format in thousands (K)
  const volumeInThousands = volume / 1000;
  return `${volumeInThousands.toFixed(2)}K`;
};

const CACHE_DURATION = 60 * 1000; // Keep this for future use
const API_REQUESTS_PER_MINUTE = 5; // Keep this for future use
const REQUEST_INTERVAL = Math.ceil((60 * 1000) / API_REQUESTS_PER_MINUTE);

const DataSource = {
  MOCK: 'mock',
  FINNHUB: 'finnhub'
};

const createStockData = (data, source) => ({
  ...data,
  dataSource: source,
  lastUpdated: new Date().toLocaleTimeString()
});

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState('');
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
    const fetchUserData = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          // Fetch user balance from profiles table
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('wallet_amt')
            .eq('user_id', session.user.id)
            .single();

          if (profileError) {
            throw new Error('Failed to fetch profile');
          }

          // Fetch user's stock portfolio from userstock table with stock information
          const { data: portfolioData, error: portfolioError } = await supabase
            .from('userstock')
            .select(`
              stock_id,
              amt_bought,
              total_spent,
              stock:stock (
                tick
              )
            `)
            .eq('user_id', session.user.id);

          if (portfolioError) {
            throw new Error('Failed to fetch portfolio data');
          }

          if (profileData) {
            setUserBalance(profileData.wallet_amt || 0);
          }

          if (portfolioData) {
            const portfolio = {};
            const symbolMap = {};
            
            portfolioData.forEach(item => {
              const symbol = item.stock.tick;
              portfolio[symbol] = {
                quantity: item.amt_bought,
                totalSpent: item.total_spent,
                stockId: item.stock_id
              };
              symbolMap[item.stock_id] = symbol;
            });
            
            setUserPortfolio(portfolio);
            setStockSymbolMap(symbolMap);
          }
        }
      } catch (error) {
        setError('Error fetching user data');
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
      const currentTimeInHours = estHour + (estMinutes / 60);
      
      // Check if it's a weekend (0 = Sunday, 6 = Saturday)
      const isWeekend = now.getUTCDay() === 0 || now.getUTCDay() === 6;
      
      // Check if it's a holiday
      const today = now.toISOString().split('T')[0];
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
        getCompanyProfile(symbol)
      ]);

      // Update the stock data
      setStockData(prevData => ({
        ...prevData,
        [symbol]: {
          quote,
          profile
        }
      }));
    } catch (error) {
    }
  };

  // Update all stock data
  const updateAllStockData = async () => {
    setIsLoadingStocks(true);
    try {
      // Prepare all symbols to fetch
      const allSymbols = [...FEATURED_STOCKS];
      
      // Add trending stocks that aren't in featured stocks
      TRENDING_STOCKS.filter(symbol => !FEATURED_STOCKS.includes(symbol))
        .forEach(symbol => allSymbols.push(symbol));
      
      // Add selected stock if any
      if (selectedStocks.length > 0) {
        allSymbols.push(...selectedStocks);
      }

      // Process stocks in parallel batches of 4 to balance speed and rate limiting
      const batchSize = 4;
      for (let i = 0; i < allSymbols.length; i += batchSize) {
        const batch = allSymbols.slice(i, i + batchSize);
        await Promise.all(batch.map(symbol => fetchStockData(symbol)));
        
        // Small delay between batches to avoid rate limiting
        if (i + batchSize < allSymbols.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
    } catch (error) {
      setError('Error updating stock data');
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
        const featuredPromises = FEATURED_STOCKS.slice(0, 2).map(symbol => fetchStockData(symbol));
        await Promise.all(featuredPromises);
        
        // Then load the rest in the background
        const remainingStocks = [...FEATURED_STOCKS.slice(2), ...TRENDING_STOCKS];
        const loadRemainingStocks = async () => {
          for (const symbol of remainingStocks) {
            await fetchStockData(symbol);
            // Small delay between requests to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
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
      if (showSuggestions && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
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
      setSuggestions([{ symbol: 'Loading...', name: '', displayName: 'Loading...' }]);
      setShowSuggestions(true);

      const searchResults = await searchStocks(query);

      if (searchResults && searchResults.length > 0) {
        setSuggestions(searchResults);
        setShowSuggestions(true);
      } else {
        setSuggestions([{ 
          symbol: 'No results', 
          name: 'Try a different search term', 
          displayName: 'No matching stocks found' 
        }]);
        setShowSuggestions(true);
        
        // Hide "no results" message after 2 seconds
        setTimeout(() => {
          setSuggestions([]);
          setShowSuggestions(false);
        }, 2000);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([{ 
        symbol: 'Error', 
        name: 'Please try again', 
        displayName: 'Failed to fetch results' 
      }]);
      setShowSuggestions(true);
      
      // Hide error message after 2 seconds
      setTimeout(() => {
        setSuggestions([]);
        setShowSuggestions(false);
      }, 2000);
    }
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
    if (suggestion.symbol === 'Loading...' || suggestion.symbol === 'Error' || suggestion.symbol === 'No results') {
      return;
    }
    
    try {
      // Set loading state for this stock
      setLoadingStates(prev => ({ ...prev, [suggestion.symbol]: true }));
      
      const [quote, profile] = await Promise.all([
        getStockQuote(suggestion.symbol),
        getCompanyProfile(suggestion.symbol)
      ]);

      // Update the stock data first
      setStockData(prevData => ({
        ...prevData,
        [suggestion.symbol]: {
          quote,
          profile
        }
      }));

      // Clear search state
      setSearchQuery('');
      setSuggestions([]);
      setShowSuggestions(false);

      // Update selected stocks
      setSelectedStocks(prevStocks => 
        prevStocks.includes(suggestion.symbol) 
          ? prevStocks 
          : [suggestion.symbol]
      );
    } catch (error) {
      console.error('Error handling suggestion click:', error);
      setError(`Failed to load stock data for ${suggestion.symbol}`);
    } finally {
      setLoadingStates(prev => ({ ...prev, [suggestion.symbol]: false }));
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setIsLoading(true);
      setError(null);
      const symbol = searchQuery.toUpperCase();
      const stock = await fetchStockData(symbol);
      
      if (stock) {
        setSearchResult(stock);
        // Add to stockData if not already present
        setStockData(prev => ({
          ...prev,
          [symbol]: stock
        }));
      } else {
        throw new Error('Stock not found. Please check the symbol and try again.');
      }
    } catch (error) {
      setError('Error searching stock');
      setSearchResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrade = async (symbol, type, quantity) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error('User not authenticated');
  
      const stockInfo = stockData[symbol];
      if (!stockInfo) throw new Error('Stock not found');
  
      const currentPrice = stockInfo.quote.c;
      const tradeCost = currentPrice * quantity;
  
      const { data: stockTableData } = await supabase
        .from('stock')
        .select('id')
        .eq('tick', symbol)
        .maybeSingle();
  
      let stockId;
      if (!stockTableData) {
        const { data: newStock, error: insertError } = await supabase
          .from('stock')
          .insert({
            name: symbol,
            tick: symbol,
            num_investors: 1
          })
          .select('id')
          .single();
  
        if (insertError) throw new Error(`Failed to create stock record: ${insertError.message}`);
        stockId = newStock.id;
      } else {
        stockId = stockTableData.id;
      }
  
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('wallet_amt')
        .eq('user_id', session.user.id)
        .single();
      if (profileError) throw new Error('Failed to fetch user profile');
  
      const currentBalance = profileData.wallet_amt || 0;
  
      const { data: userStockData, error: stockError } = await supabase
        .from('userstock')
        .select('amt_bought, total_spent')
        .eq('user_id', session.user.id)
        .eq('stock_id', stockId)
        .maybeSingle();
      if (stockError) throw new Error(`Failed to fetch current stock holding: ${stockError.message}`);
  
      const currentQuantity = userStockData?.amt_bought || 0;
      const currentTotalSpent = userStockData?.total_spent || 0;
  
      if (type === 'buy' && currentBalance < tradeCost)
        throw new Error(`Insufficient funds. Required: ${formatNumber(tradeCost)}, Available: ${formatNumber(currentBalance)}`);
  
      if (type === 'sell' && currentQuantity < quantity)
        throw new Error(`Insufficient shares. Required: ${quantity}, Available: ${currentQuantity}`);
  
      const newQuantity = type === 'buy' ? currentQuantity + quantity : currentQuantity - quantity;
      let newTotalSpent;
      if (type === 'buy') {
        newTotalSpent = currentTotalSpent + tradeCost;
      } else {
        const avgCostPerShare = currentTotalSpent / currentQuantity;
        newTotalSpent = currentTotalSpent - (avgCostPerShare * quantity);
      }
  
      const walletAdjustment = type === 'buy' ? -tradeCost : tradeCost;
  
      const { error: walletError } = await supabase
        .from('profiles')
        .update({ wallet_amt: currentBalance + walletAdjustment })
        .eq('user_id', session.user.id);
      if (walletError) throw new Error(`Failed to update wallet balance: ${walletError.message}`);
  
      let tradeError;
      if (newQuantity > 0) {
        const { error } = await supabase
          .from('userstock')
          .upsert([{
            user_id: session.user.id,
            stock_id: stockId,
            amt_bought: newQuantity,
            total_spent: newTotalSpent
          }], {
            onConflict: 'user_id,stock_id',
            ignoreDuplicates: false
          });
        tradeError = error;
  
        if (!userStockData) {
          const { data: currentStock } = await supabase
            .from('stock')
            .select('num_investors')
            .eq('id', stockId)
            .single();
  
          const currentInvestors = currentStock?.num_investors || 0;
          await supabase
            .from('stock')
            .update({ num_investors: currentInvestors + 1 })
            .eq('id', stockId);
        }
      } else {
        const { error } = await supabase
          .from('userstock')
          .delete()
          .eq('user_id', session.user.id)
          .eq('stock_id', stockId);
        tradeError = error;
  
        const { data: currentStock } = await supabase
          .from('stock')
          .select('num_investors')
          .eq('id', stockId)
          .single();
  
        const currentInvestors = currentStock?.num_investors || 0;
        const newInvestors = Math.max(0, currentInvestors - 1);
  
        await supabase
          .from('stock')
          .update({ num_investors: newInvestors })
          .eq('id', stockId);
      }
  
      if (tradeError) {
        await supabase
          .from('profiles')
          .update({ wallet_amt: currentBalance })
          .eq('user_id', session.user.id);
  
        throw new Error(`Failed to execute trade: ${tradeError.message}`);
      }

      const { error: transactionError } = await supabase
        .from('TransactionHistory')
        .insert({
          user_id: session.user.id,
          stock_id: stockId,
          type,
          quantity,
          price_per_share: currentPrice,
          total_amount: tradeCost
        });
      if (transactionError) console.error('Failed to log transaction:', transactionError.message);
  
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .select('wallet_amt')
        .eq('user_id', session.user.id)
        .single();
  
      if (!updateError) {
        setUserBalance(updatedProfile.wallet_amt);
      }
  
      if (newQuantity > 0) {
        setUserPortfolio(prev => ({
          ...prev,
          [symbol]: {
            quantity: newQuantity,
            totalSpent: newTotalSpent
          }
        }));
      } else {
        setUserPortfolio(prev => {
          const newPortfolio = { ...prev };
          delete newPortfolio[symbol];
          return newPortfolio;
        });
      }
  
    } catch (error) {
      throw error.message || 'Failed to execute trade';
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

    return (
      <Card 
        key={stock.profile.ticker}
        className={`p-4 bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 shadow-md ${isMarketOpen ? 'cursor-pointer' : ''}`}
        onClick={handleCardClick}
      >
        <div>
          <h3 className="font-bold text-gray-900 dark:text-white">{stock.profile.name}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{stock.profile.ticker}</p>
        </div>
        <p className="text-sm font-medium text-gray-900 dark:text-white mt-2">
          Price: {formatNumber(stock.quote.c)}
        </p>
        <p className={`text-sm ${stock.quote.dp >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {stock.quote.dp >= 0 ? '+' : ''}{stock.quote.dp.toFixed(2)}%
        </p>
        {!isMarketOpen && (
          <p className="text-sm text-red-500 mt-2">Market Closed</p>
        )}
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
    const percentageChange = ((stock.quote.c - avgCostBasis) / avgCostBasis) * 100;
    
    return (
      <Card 
        key={symbol} 
        className="p-4 bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 shadow-md cursor-pointer"
        onClick={() => {
          if (isMarketOpen) {
            setSelectedStocks([symbol]);
            setShowTradeModal(true);
          }
        }}
      >
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-gray-900 dark:text-white">{symbol}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{quantity} shares</p>
            </div>
            <div className="text-right">
              <p className="font-medium text-gray-900 dark:text-white">{formatNumber(currentValue)}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Current: {formatNumber(stock.quote.c)}</p>
            </div>
          </div>
          
          <div className="border-t border-gray-100 dark:border-gray-700 pt-2 mt-1">
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">Avg Cost: {formatNumber(avgCostBasis)}</p>
              <p className={`text-sm font-medium ${percentageChange >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {percentageChange >= 0 ? '+' : ''}{percentageChange.toFixed(2)}%
              </p>
            </div>
            <p className={`text-sm font-medium ${totalGainLoss >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              {totalGainLoss >= 0 ? '+' : ''}{formatNumber(totalGainLoss)}
            </p>
          </div>
        </div>
        {!isMarketOpen && (
          <p className="text-sm text-red-500 mt-2">Market Closed</p>
        )}
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
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Explore Stocks</h1>
          <div className="bg-white dark:bg-gray-800 px-6 py-3 rounded-lg shadow-md border border-gray-100 dark:border-gray-700">
            <p className="text-gray-900 dark:text-white text-lg">Balance: <span className="font-bold">{formatNumber(userBalance)}</span></p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Main Content - Left Side */}
          <div className="col-span-12 lg:col-span-9">
            <div className="mb-12">
              <div className="relative max-w-2xl mb-6" ref={dropdownRef}>
                <form onSubmit={handleSearch} className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type="text"
                      placeholder="Search stocks by symbol (e.g., AAPL)"
                      value={searchQuery}
                      onChange={handleInputChange}
                      onFocus={() => {
                        if (searchQuery.trim()) {
                          setShowSuggestions(true);
                        }
                      }}
                      className="flex-1 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                    {showSuggestions && (
                      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {suggestions.map((suggestion, index) => (
                          <div
                            key={`${suggestion.symbol}-${index}`}
                            className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                            onClick={() => handleSuggestionClick(suggestion)}
                          >
                            <div className="font-medium text-gray-900 dark:text-white">{suggestion.symbol}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 truncate">{suggestion.name}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Search
                  </Button>
                </form>
              </div>

              {/* Search Result Card */}
              {selectedStocks.length > 0 && stockData[selectedStocks[0]] && (
                <div className="mb-12">
                  <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Search Result</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {renderStockCard(stockData[selectedStocks[0]], selectedStocks[0])}
                  </div>
                </div>
              )}
            </div>

            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Featured Stocks</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {FEATURED_STOCKS.map(symbol => renderStockCard(stockData[symbol], symbol))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Trending Stocks</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {TRENDING_STOCKS.map(symbol => renderStockCard(stockData[symbol], symbol))}
              </div>
            </section>
          </div>

          {/* Stock List - Right Side */}
          <div className="col-span-12 lg:col-span-3">
            <div className="sticky top-28">
              <h2 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">My Stock List</h2>
              <div className="space-y-3 max-h-[calc(100vh-150px)] overflow-y-auto pr-2">
                {Object.keys(userPortfolio)
                  .filter(symbol => userPortfolio[symbol].quantity > 0)
                  .map(symbol => renderPortfolioCard(symbol))
                }
                {Object.keys(userPortfolio).length === 0 && (
                  <p className="text-gray-500 dark:text-gray-400 text-sm">No stocks owned yet. Start trading to build your portfolio!</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      {showTradeModal && selectedStocks.length > 0 && stockData[selectedStocks[0]] && (
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