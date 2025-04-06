'use client';
import { useState, useEffect, useRef } from 'react';
import Navbar from './Navbar';
import { supabase } from '@/config/supabaseClient';
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva } from "class-variance-authority";
import { cn } from "@/lib/utils";
import TradeModal from './TradeModal';

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

const MOCK_DATA = {
  'AAPL': { symbol: 'AAPL', name: 'Apple Inc.', price: 217.90, tradeValue: 39818617 },
  'TSLA': { symbol: 'TSLA', name: 'Tesla, Inc.', price: 263.55, tradeValue: 123530000 },
  'MSFT': { symbol: 'MSFT', name: 'Microsoft Corporation', price: 378.80, tradeValue: 21630000 },
  'AMZN': { symbol: 'AMZN', name: 'Amazon.com, Inc.', price: 192.72, tradeValue: 52540000 },
  'GOOGL': { symbol: 'GOOGL', name: 'Alphabet Inc.', price: 152.50, tradeValue: 25630000 },
  'META': { symbol: 'META', name: 'Meta Platforms Inc.', price: 486.35, tradeValue: 18720000 },
  'NVDA': { symbol: 'NVDA', name: 'NVIDIA Corporation', price: 875.28, tradeValue: 35240000 },
  'AMD': { symbol: 'AMD', name: 'Advanced Micro Devices', price: 178.90, tradeValue: 15920000 }
};

const FEATURED_STOCKS = Object.values(MOCK_DATA).slice(0, 4); // First 4 stocks
const ALL_STOCKS = Object.values(MOCK_DATA); // All stocks for search

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

const CACHE_DURATION = 60 * 1000; // Keep this for future use
const API_REQUESTS_PER_MINUTE = 5; // Keep this for future use
const REQUEST_INTERVAL = Math.ceil((60 * 1000) / API_REQUESTS_PER_MINUTE);

const DataSource = {
  MOCK: 'mock'
};

const createStockData = (data, source) => ({
  ...data,
  dataSource: source,
  lastUpdated: new Date().toLocaleTimeString()
});

const Explore = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [trendingStocks, setTrendingStocks] = useState(FEATURED_STOCKS);
  const [featuredStocks, setFeaturedStocks] = useState(FEATURED_STOCKS);
  const [isMarketOpen, setIsMarketOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchResult, setSearchResult] = useState(null);
  const [user, setUser] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const dropdownRef = useRef(null);
  const [selectedStock, setSelectedStock] = useState(null);
  const [showTradeModal, setShowTradeModal] = useState(false);
  const [userBalance, setUserBalance] = useState(0);
  const [userPortfolio, setUserPortfolio] = useState({});
  const [stockSymbolMap, setStockSymbolMap] = useState({});

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
            console.error('Error fetching profile:', profileError);
            return;
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
            console.error('Error fetching portfolio:', portfolioError);
            return;
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
        console.error('Error fetching user data:', error);
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

  useEffect(() => {
    const fetchTrendingStocks = () => {
      try {
        setIsLoading(true);
        setError(null);
        // Use a different subset of stocks for trending
        const trendingData = Object.values(MOCK_DATA)
          .sort((a, b) => b.tradeValue - a.tradeValue)
          .slice(0, 4);
        setTrendingStocks(trendingData);
      } catch (error) {
        console.error('Error in fetchTrendingStocks:', error);
        setError('Unable to load trending stocks.');
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

    const filteredStocks = ALL_STOCKS
      .filter(stock => 
        stock.symbol.toLowerCase().includes(query.toLowerCase()) ||
        stock.name.toLowerCase().includes(query.toLowerCase())
      )
      .map(stock => ({
        ticker: stock.symbol,
        name: stock.name,
        displayName: stock.name
      }));

    setSuggestions(filteredStocks);
    setShowSuggestions(true);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    fetchStockSuggestions(value);
  };

  const handleSuggestionClick = async (suggestion) => {
    setSearchQuery(suggestion.ticker);
    setShowSuggestions(false);
    setSuggestions([]);
    // Trigger search with the selected stock
    const stock = MOCK_DATA[suggestion.ticker];
    if (stock) {
      setSearchResult(stock);
      setError(null);
    } else {
      setError('Stock not found. Please check the symbol and try again.');
      setSearchResult(null);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setIsLoading(true);
      setError(null);
      const stock = MOCK_DATA[searchQuery.toUpperCase()];
      if (stock) {
        setSearchResult(stock);
      } else {
        throw new Error('Stock not found. Please check the symbol and try again.');
      }
    } catch (error) {
      console.error('Error searching stock:', error);
      setError(error.message);
      setSearchResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrade = async (symbol, type, quantity) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('User not authenticated');
      }

      const stock = trendingStocks.find(s => s.symbol === symbol) || 
                   featuredStocks.find(s => s.symbol === symbol) ||
                   searchResult;

      if (!stock) {
        throw new Error('Stock not found');
      }

      const currentPrice = stock.price;
      const tradeCost = currentPrice * quantity;

      // Get stock ID from the stock table
      const { data: stockTableData, error: stockTableError } = await supabase
        .from('stock')
        .select('id')
        .eq('tick', symbol)
        .maybeSingle();

      console.log('Stock lookup result:', { stockTableData, stockTableError });

      let stockId;
      if (!stockTableData) {
        // Insert the stock if it doesn't exist
        console.log('Inserting new stock:', { name: stock.name, tick: symbol });
        const { data: newStock, error: insertError } = await supabase
          .from('stock')
          .insert({
            name: symbol,
            tick: symbol,
            num_investors: 1
          })
          .select('id')
          .single();

        if (insertError) {
          console.error('Error inserting stock:', insertError);
          throw new Error(`Failed to create stock record: ${insertError.message || 'Unknown error'}`);
        }
        
        console.log('New stock inserted:', newStock);
        stockId = newStock.id;
      } else {
        stockId = stockTableData.id;
      }

      // Get current profile data
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('wallet_amt')
        .eq('user_id', session.user.id)
        .single();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        throw new Error('Failed to fetch user profile');
      }

      const currentBalance = profileData.wallet_amt || 0;

      // Get current stock holding
      console.log('Fetching stock data for:', { userId: session.user.id, stockId });
      const { data: stockData, error: stockError } = await supabase
        .from('userstock')
        .select('amt_bought, total_spent')
        .eq('user_id', session.user.id)
        .eq('stock_id', stockId)
        .maybeSingle();

      if (stockError) {
        console.error('Error fetching stock data:', {
          error: stockError,
          userId: session.user.id,
          stockId,
          errorMessage: stockError.message,
          errorDetails: stockError.details,
          errorHint: stockError.hint
        });
        throw new Error(`Failed to fetch current stock holding: ${stockError.message || 'Unknown error'}`);
      }

      const currentQuantity = stockData?.amt_bought || 0;
      const currentTotalSpent = stockData?.total_spent || 0;

      if (type === 'buy') {
        if (currentBalance < tradeCost) {
          throw new Error(`Insufficient funds. Required: ${formatNumber(tradeCost)}, Available: ${formatNumber(currentBalance)}`);
        }
      } else if (type === 'sell') {
        if (currentQuantity < quantity) {
          throw new Error(`Insufficient shares. Required: ${quantity}, Available: ${currentQuantity}`);
        }
      }

      // Calculate new values
      const newQuantity = type === 'buy' ? currentQuantity + quantity : currentQuantity - quantity;
      let newTotalSpent;
      
      if (type === 'buy') {
        // When buying, add the new purchase cost to total spent
        newTotalSpent = currentTotalSpent + tradeCost;
      } else {
        // When selling, reduce total spent proportionally to shares sold
        const avgCostPerShare = currentTotalSpent / currentQuantity;
        newTotalSpent = currentTotalSpent - (avgCostPerShare * quantity);
      }

      // Calculate the actual amount to add/subtract from wallet
      const walletAdjustment = type === 'buy' ? -tradeCost : tradeCost;

      // First, update the wallet balance
      const { error: walletError } = await supabase
        .from('profiles')
        .update({
          wallet_amt: currentBalance + walletAdjustment
        })
        .eq('user_id', session.user.id);

      if (walletError) {
        console.error('Wallet update error:', walletError);
        throw new Error(`Failed to update wallet balance: ${walletError.message || 'Unknown error'}`);
      }

      // Then, handle the stock transaction
      let tradeError;
      if (newQuantity > 0) {
        // Update or insert stock record
        console.log('Upserting stock record:', {
          userId: session.user.id,
          stockId,
          newQuantity,
          newTotalSpent,
          type
        });
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

        // Update num_investors in stock table if this is a new investment
        if (!stockData) {
          // First get current num_investors
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
        // Delete the record if quantity is 0
        console.log('Deleting stock record:', {
          userId: session.user.id,
          stockId
        });
        const { error } = await supabase
          .from('userstock')
          .delete()
          .eq('user_id', session.user.id)
          .eq('stock_id', stockId);
        tradeError = error;

        // Decrease num_investors in stock table
        // First get current num_investors
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
        // Rollback wallet update if stock transaction fails
        await supabase
          .from('profiles')
          .update({
            wallet_amt: currentBalance
          })
          .eq('user_id', session.user.id);

        console.error('Trade error:', tradeError);
        throw new Error(`Failed to execute trade: ${tradeError.message || 'Unknown error'}`);
      }

      // Fetch updated balance
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .select('wallet_amt')
        .eq('user_id', session.user.id)
        .single();

      if (updateError) {
        console.error('Error fetching updated balance:', updateError);
      } else {
        setUserBalance(updatedProfile.wallet_amt);
      }

      // Update portfolio in state
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
      console.error('Error executing trade:', error);
      throw error.message || 'Failed to execute trade';
    }
  };

  const renderStockCard = (stock) => (
    <Card 
      key={stock.symbol} 
      className="p-4 bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 shadow-md cursor-pointer"
      onClick={() => {
        if (isMarketOpen) {
          setSelectedStock(stock);
          setShowTradeModal(true);
        }
      }}
    >
      <div>
        <h3 className="font-bold text-gray-900 dark:text-white">{stock.name}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">{stock.symbol}</p>
      </div>
      <p className="text-sm font-medium text-gray-900 dark:text-white mt-2">Price: {formatNumber(stock.price)}</p>
      <p className="text-sm text-gray-600 dark:text-gray-400">Volume: {formatVolume(stock.tradeValue)}</p>
      {!isMarketOpen && (
        <p className="text-sm text-red-500 mt-2">Market Closed</p>
      )}
    </Card>
  );

  const renderPortfolioCard = (symbol) => {
    const position = userPortfolio[symbol];
    if (!position) return null;

    const stock = trendingStocks.find(s => s.symbol === symbol) || 
                 featuredStocks.find(s => s.symbol === symbol) ||
                 (searchResult?.symbol === symbol ? searchResult : null);

    if (!stock) return null;

    const quantity = position.quantity;
    const currentValue = stock.price * quantity;
    const avgCostBasis = position.totalSpent / quantity;
    const totalGainLoss = (stock.price - avgCostBasis) * quantity;
    const percentageChange = ((stock.price - avgCostBasis) / avgCostBasis) * 100;
    
    return (
      <Card 
        key={symbol} 
        className="p-4 bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 hover:border-blue-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-300 shadow-md cursor-pointer"
        onClick={() => {
          if (isMarketOpen) {
            setSelectedStock(stock);
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
              <p className="text-sm text-gray-600 dark:text-gray-400">Current: {formatNumber(stock.price)}</p>
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

  // Add new useEffect for featured stocks
  useEffect(() => {
    const fetchFeaturedStocks = () => {
      try {
        setFeaturedStocks(FEATURED_STOCKS);
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
              <div className="relative max-w-2xl mb-12" ref={dropdownRef}>
                <form onSubmit={handleSearch} className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type="text"
                      placeholder="Search stocks by symbol (e.g., AAPL)"
                      value={searchQuery}
                      onChange={handleInputChange}
                      onFocus={() => setShowSuggestions(true)}
                      className="flex-1 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                    {showSuggestions && suggestions.length > 0 && (
                      <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg max-h-60 overflow-y-auto">
                        {suggestions.map((suggestion, index) => (
                          <div
                            key={`${suggestion.ticker}-${index}`}
                            className="px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                            onClick={() => handleSuggestionClick(suggestion)}
                          >
                            <div className="font-medium text-gray-900 dark:text-white">{suggestion.ticker}</div>
                            <div className="text-sm text-gray-600 dark:text-gray-400 truncate">{suggestion.displayName}</div>
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
                    {isLoading ? 'Searching...' : 'Search'}
                  </Button>
                </form>
              </div>
              {error && <p className="text-red-500 mt-2">{error}</p>}
              {searchResult && (
                <div className="mt-6">
                  <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-white">Search Result</h2>
                  {renderStockCard(searchResult)}
                </div>
              )}
            </div>

            <section className="mb-12">
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Featured Stocks</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {featuredStocks.map((stock) => renderStockCard(stock))}
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Trending Stocks</h2>
              {isLoading ? (
                <p className="text-blue-500">Loading trending stocks...</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {trendingStocks.map(renderStockCard)}
                </div>
              )}
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
      {showTradeModal && selectedStock && (
        <TradeModal
          stock={selectedStock}
          onClose={() => {
            setShowTradeModal(false);
            setSelectedStock(null);
          }}
          onTrade={handleTrade}
        />
      )}
    </div>
  );
};

export default Explore; 