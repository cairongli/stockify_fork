import React, { useState, useEffect } from 'react';
import { supabase } from '@/config/supabaseClient';
import { Button } from './ui/button';

const TradeModal = ({ stock, onClose, onTrade }) => {
  const [quantity, setQuantity] = useState(1);
  const [tradeType, setTradeType] = useState('buy');
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [userBalance, setUserBalance] = useState(0);
  const [userPortfolio, setUserPortfolio] = useState({});
  const [stockData, setStockData] = useState(null);

  // Fetch user data and stock data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Get current user session
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          throw new Error('User not authenticated');
        }

        // Fetch user balance
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('wallet_amt')
          .eq('user_id', session.user.id)
          .single();

        if (profileError) {
          throw new Error('Failed to fetch user balance');
        }

        setUserBalance(profileData.wallet_amt || 0);

        // Fetch user's stock portfolio
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

        // Process portfolio data
        const portfolio = {};
        portfolioData.forEach(item => {
          const symbol = item.stock.tick;
          portfolio[symbol] = {
            quantity: item.amt_bought,
            totalSpent: item.total_spent,
            stockId: item.stock_id
          };
        });

        setUserPortfolio(portfolio);

        // Fetch stock data if not already available
        if (typeof stock === 'string') {
          // If stock is just a symbol, fetch the data
          const { data: stockTableData, error: stockTableError } = await supabase
            .from('stock')
            .select('*')
            .eq('tick', stock)
            .single();

          if (stockTableError) {
            throw new Error('Failed to fetch stock data');
          }

          setStockData({
            symbol: stockTableData.tick,
            name: stockTableData.name,
            price: stockTableData.current_price || 0
          });
        } else {
          // If stock is already a full object, use it
          setStockData(stock);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [stock]);

  const handleQuantityChange = (e) => {
    const value = e.target.value;
    // Allow empty string for better UX during typing
    if (value === '') {
      setQuantity(value);
      return;
    }
    // Convert to number and validate
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue >= 0) {
      setQuantity(numValue);
    }
  };

  const handleTrade = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!stock || !stock.profile || !stock.quote) {
        throw new Error('Invalid stock data');
      }

      await onTrade(stock.profile.ticker, tradeType, quantity);
      onClose();
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const calculateTotal = () => {
    if (!stock || !stock.quote) return 0;
    return stock.quote.c * quantity;
  };

  const getCurrentPosition = () => {
    if (!stock || !stock.profile) return null;
    return userPortfolio[stock.profile.ticker];
  };

  const currentPosition = getCurrentPosition();
  const total = calculateTotal();
  const canBuy = tradeType === 'buy' ? userBalance >= total : true;
  const canSell = tradeType === 'sell' ? (currentPosition?.quantity || 0) >= quantity : true;

  if (isLoading && !stock) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent">
        {/* Semi-transparent overlay with very light opacity */}
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-[1px]"
          onClick={onClose}
        />
        
        {/* Loading content with glass effect */}
        <div className="relative bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-xl p-6 w-full max-w-md mx-4 z-10 backdrop-blur-sm">
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-2 text-gray-600 dark:text-gray-400">Loading trade data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!stock || !stock.profile || !stock.quote) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent">
        <div 
          className="fixed inset-0 bg-black/20 backdrop-blur-[1px]"
          onClick={onClose}
        />
        <div className="relative bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-xl p-6 w-full max-w-md mx-4 z-10 backdrop-blur-sm">
          <div className="flex justify-center items-center py-8">
            <span className="text-red-500">Error: Invalid stock data</span>
          </div>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent">
      {/* Semi-transparent overlay with very light opacity */}
      <div 
        className="fixed inset-0 bg-black/20 backdrop-blur-[1px]"
        onClick={onClose}
      />
      
      {/* Modal content with glass effect */}
      <div className="relative bg-white/90 dark:bg-gray-800/90 rounded-lg shadow-xl p-6 w-full max-w-md mx-4 z-10 backdrop-blur-sm">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {tradeType === 'buy' ? 'Buy' : 'Sell'} {stock.profile.name} ({stock.profile.ticker})
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded-md">
            {error}
          </div>
        )}

        <div className="mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-300">Current Price:</span>
            <span className="text-gray-900 dark:text-white font-medium">
              ${stock.quote.c.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-300">Total:</span>
            <span className="text-gray-900 dark:text-white font-medium">${(stock.quote.c * quantity).toFixed(2)}</span>
          </div>
          {currentPosition && (
            <div className="flex justify-between text-sm mt-2">
              <span className="text-gray-600 dark:text-gray-300">Current Position:</span>
              <span className="text-gray-900 dark:text-white font-medium">{currentPosition.quantity} shares</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-300">Available Balance:</span>
            <span className="text-gray-900 dark:text-white font-medium">${userBalance.toFixed(2)}</span>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Trade Type
          </label>
          <div className="flex space-x-2">
            <button
              type="button"
              className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                tradeType === 'buy'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
              onClick={() => setTradeType('buy')}
            >
              Buy
            </button>
            <button
              type="button"
              className={`flex-1 py-2 px-4 rounded-md transition-colors ${
                tradeType === 'sell'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
              onClick={() => setTradeType('sell')}
            >
              Sell
            </button>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Quantity
          </label>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={quantity}
            onChange={handleQuantityChange}
            placeholder="Enter quantity"
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>

        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleTrade}
            disabled={isLoading || !canBuy || !canSell}
            className={`px-4 py-2 rounded-md text-white ${
              'bg-blue-600 hover:bg-blue-700'
            } ${
              (isLoading || !canBuy || !canSell) ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isLoading ? 'Processing...' : tradeType === 'buy' ? 'Buy' : 'Sell'}
          </button>
        </div>

        {!canBuy && tradeType === 'buy' && (
          <p className="mt-2 text-sm text-red-500">Insufficient funds for this trade</p>
        )}
        {!canSell && tradeType === 'sell' && (
          <p className="mt-2 text-sm text-red-500">Insufficient shares for this trade</p>
        )}
      </div>
    </div>
  );
};

export default TradeModal; 