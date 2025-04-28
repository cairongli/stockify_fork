'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/config/supabaseClient';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Posts from '@/components/Posts';

// Dummy data for testing
const DUMMY_INVESTED_STOCKS = [
  { quantity: 10, purchase_price: 150, stocks: { symbol: 'AAPL', name: 'Apple Inc.', current_price: 175 } },
  { quantity: 5, purchase_price: 2750, stocks: { symbol: 'GOOGL', name: 'Alphabet Inc.', current_price: 2900 } }
  
];

const DUMMY_FOLLOWED_STOCKS = [
  { symbol: 'AMZN', name: 'Amazon.com, Inc.', current_price: 178.75 },
  { symbol: 'TSLA', name: 'Tesla, Inc.', current_price: 175.21 }
  
];

const DUMMY_TRADE_HISTORY = [
  { id: 1, date: '2024-04-01', symbol: 'AAPL', type: 'buy', quantity: 5, price: 175.50 },
  { id: 2, date: '2024-04-03', symbol: 'GOOGL', type: 'buy', quantity: 2, price: 2850.75 },
  { id: 3, date: '2024-04-05', symbol: 'MSFT', type: 'sell', quantity: 3, price: 410.25 },
  { id: 4, date: '2024-04-08', symbol: 'TSLA', type: 'buy', quantity: 10, price: 172.35 },
  { id: 5, date: '2024-04-10', symbol: 'NVDA', type: 'buy', quantity: 2, price: 865.20 }
];

const Profile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [investedStocks, setInvestedStocks] = useState([]);
  const [followedStocks, setFollowedStocks] = useState([]);
  const [tradeHistory, setTradeHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('stocks');
  const [useDummyData, setUseDummyData] = useState(false);

  // Fetch actual user data
  useEffect(() => {
    const fetchUserData = async () => {
      setLoading(true);
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          // If not authenticated, show error state
          setLoading(false);
          return;
        }

        // Fetch profile data from Supabase
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (profileError) {
          console.error('Error fetching profile:', profileError);
        } else if (profileData) {
          setProfile(profileData);
          
          // Set some placeholder follower counts for now
          setFollowersCount(Math.floor(Math.random() * 50) + 5);
          setFollowingCount(Math.floor(Math.random() * 30) + 3);
        }

        let hasRealData = false;

        // In a real implementation, you would fetch both invested and followed stocks
        // This is just placeholder code - update with your actual database queries
        
        // Example: Fetch invested stocks
        const { data: userStocks, error: stocksError } = await supabase
          .from('user_stocks')
          .select(`
            quantity, purchase_price,
            stocks:stock_id (symbol, name, current_price)
          `)
          .eq('user_id', user.id);

        if (stocksError) {
          console.error('Error fetching stocks:', stocksError);
        } else if (userStocks && userStocks.length > 0) {
          setInvestedStocks(userStocks);
          hasRealData = true;
        }
        
        // Example: Fetch followed stocks (replace with your actual query)
        // Typically this would be a separate table for stocks the user follows but doesn't own
        const { data: followedStocksData, error: followedStocksError } = await supabase
          .from('followed_stocks') // Replace with your actual table name
          .select(`
            stocks:stock_id (symbol, name, current_price)
          `)
          .eq('user_id', user.id);
          
        if (!followedStocksError && followedStocksData?.length > 0) {
          // Format the data appropriately
          setFollowedStocks(followedStocksData.map(item => item.stocks));
          hasRealData = true;
        }
        
        // If no real data was found, use dummy data for demonstration
        if (!hasRealData) {
          console.log("No real data found, using dummy data for UI demonstration");
          setUseDummyData(true);
          
          // Only set dummy data if real data wasn't found
          if (!userStocks || userStocks.length === 0) {
            setInvestedStocks(DUMMY_INVESTED_STOCKS);
          }
          
          if (!followedStocksData || followedStocksData.length === 0) {
            setFollowedStocks(DUMMY_FOLLOWED_STOCKS);
          }
          
          setTradeHistory(DUMMY_TRADE_HISTORY);
        }
        
      } catch (error) {
        console.error('Error in fetch user data:', error);
        setUseDummyData(true);
        setInvestedStocks(DUMMY_INVESTED_STOCKS);
        setFollowedStocks(DUMMY_FOLLOWED_STOCKS);
        setTradeHistory(DUMMY_TRADE_HISTORY);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleTabChange = (tab) => {
    console.log("Changing tab to:", tab);
    setActiveTab(tab);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-bold text-red-500">Profile not found</h2>
        <p className="mt-2">Please sign in to view your profile</p>
        <Button className="mt-4" onClick={() => window.location.href = '/login'}>
          Sign In
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Profile Header */}
      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
        <div className="w-32 h-32 bg-gray-300 rounded-full flex items-center justify-center text-4xl font-bold text-white">
          {profile.user_name?.charAt(0)?.toUpperCase() || '?'}
        </div>
        
        <div className="flex-1 text-center sm:text-left">
          <h1 className="text-3xl font-bold">{profile.user_name || 'User'}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Member since {new Date(profile.created_at || Date.now()).toLocaleDateString()}</p>
          
          <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-4">
            <div className="text-center">
              <p className="font-semibold text-xl">${Number(profile.wallet_amt)?.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2}) || '0.00'}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Balance</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-xl">{followersCount}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Followers</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-xl">{followingCount}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Following</p>
            </div>
            <div className="text-center">
              <p className="font-semibold text-xl">{investedStocks.length + followedStocks.length}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Stocks</p>
            </div>
          </div>
        </div>
      </div>

      {useDummyData && (
        <div className="mb-4 p-3 bg-yellow-100 text-yellow-800 rounded-md">
          <p className="text-sm font-medium">
            <span className="font-bold">Note:</span> Using demo data for display purposes. Connect to a real database to see your actual data.
          </p>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex border-b mb-6">
        <button 
          onClick={() => handleTabChange('stocks')}
          className={`py-2 px-6 font-semibold text-base ${activeTab === 'stocks' 
            ? 'text-blue-600 border-b-2 border-blue-600' 
            : 'text-gray-500 hover:text-gray-700'}`}
        >
          Stocks Portfolio
        </button>
        <button 
          onClick={() => handleTabChange('trades')}
          className={`py-2 px-6 font-semibold text-base ${activeTab === 'trades' 
            ? 'text-blue-600 border-b-2 border-blue-600' 
            : 'text-gray-500 hover:text-gray-700'}`}
        >
          Trade History
        </button>
        <button 
          onClick={() => handleTabChange('posts')}
          className={`py-2 px-6 font-semibold text-base ${activeTab === 'posts' 
            ? 'text-blue-600 border-b-2 border-blue-600' 
            : 'text-gray-500 hover:text-gray-700'}`}
        >
          Posts
        </button>
      </div>

      {/* Stock Portfolio Tab */}
      {activeTab === 'stocks' && (
        <div>
          {/* Invested Stocks Section */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Invested Stocks</h2>
            {investedStocks.length === 0 ? (
              <Card className="p-6 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-4">You haven't invested in any stocks yet.</p>
                <Button variant="outline">Start Investing</Button>
              </Card>
            ) : (
              <div className="grid gap-4">
                {investedStocks.map((stock, index) => {
                  const gainLoss = calculateGainLoss(stock.purchase_price, stock.stocks?.current_price);
                  
                  return (
                    <Card key={index} className="p-4 hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-center">
                        <div>
                          <h3 className="font-bold text-lg">{stock.stocks?.symbol}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{stock.stocks?.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">${Number(stock.stocks?.current_price).toFixed(2)}</p>
                          <p className={`text-sm ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {gainLoss >= 0 ? '+' : ''}
                            {gainLoss.toFixed(2)}%
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex justify-between text-sm">
                        <span>Qty: {stock.quantity}</span>
                        <span>Avg. Price: ${Number(stock.purchase_price).toFixed(2)}</span>
                        <span>Total: ${(stock.quantity * stock.stocks?.current_price).toFixed(2)}</span>
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
          
          {/* Followed Stocks Section */}
          <div>
            <h2 className="text-2xl font-bold mb-4">Followed Stocks</h2>
            {followedStocks.length === 0 ? (
              <Card className="p-6 text-center">
                <p className="text-gray-600 dark:text-gray-400 mb-4">You aren't following any stocks yet.</p>
                <Button variant="outline">Explore Stocks</Button>
              </Card>
            ) : (
              <div className="grid gap-4">
                {followedStocks.map((stock, index) => (
                  <Card key={index} className="p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-bold text-lg">{stock.symbol}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{stock.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${Number(stock.current_price).toFixed(2)}</p>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="mt-2 text-xs px-2 py-1"
                        >
                          Invest
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Trade History Tab */}
      {activeTab === 'trades' && (
        <div className="trades-tab">
          <h2 className="text-2xl font-bold mb-4">Trade History</h2>
          {tradeHistory.length === 0 ? (
            <Card className="p-6 text-center">
              <p className="text-gray-600 dark:text-gray-400">You haven't made any trades yet.</p>
            </Card>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Symbol</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Quantity</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                  {tradeHistory.map((trade) => (
                    <tr key={trade.id}>
                      <td className="px-4 py-3 whitespace-nowrap">{trade.date}</td>
                      <td className="px-4 py-3 whitespace-nowrap font-medium">{trade.symbol}</td>
                      <td className={`px-4 py-3 whitespace-nowrap capitalize ${trade.type === 'buy' ? 'text-green-600' : 'text-red-600'}`}>
                        {trade.type}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">{trade.quantity}</td>
                      <td className="px-4 py-3 whitespace-nowrap">${Number(trade.price).toFixed(2)}</td>
                      <td className="px-4 py-3 whitespace-nowrap">${(trade.quantity * trade.price).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Posts Tab */}
      {activeTab === 'posts' && (
        <div>
          <h2 className="text-2xl font-bold mb-4">Your Posts</h2>
          <Posts />
        </div>
      )}
    </div>
  );
};

// Helper function to calculate gain/loss percentage
function calculateGainLoss(purchasePrice, currentPrice) {
  if (!purchasePrice || !currentPrice) return 0;
  return ((currentPrice - purchasePrice) / purchasePrice) * 100;
}

export default Profile;