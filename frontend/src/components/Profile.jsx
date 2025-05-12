'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/config/supabaseClient';
import { Card } from '@/components/ui/card';
import Button from './ui/Button';
import PostCard from './PostCard';
import { getStockQuote, getCompanyProfile, searchStocks } from '@/config/finnhubClient';
import { motion } from 'framer-motion';
import Watchlist from './StockUI/Watchlist';

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
  const [userPosts, setUserPosts] = useState([]);
  const [activeTab, setActiveTab] = useState('stocks');
  const [useDummyData, setUseDummyData] = useState(false);
  // Chatbot state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  // Fetch actual user data
  useEffect(() => {
    const updatedStocks = [];
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

        // // In a real implementation, you would fetch both invested and followed stocks
        // // This is just placeholder code - update with your actual database queries
        
         // Example: Fetch invested stocks

          const { data: userStocks, error: stocksError } = await supabase
          .from('userstock')
          .select(`
            amt_bought,
            total_spent,
            stock (tick, name, num_investors)
          `)
          .eq('user_id', user.id);
          //setInvestedStocks(userStocks);
          
         if (stocksError) {
           console.error('Error fetching stocks:', stocksError);
         } else if (userStocks && userStocks.length > 0) {
           //setInvestedStocks(userStocks);

           await Promise.all(userStocks.map(async (userStock) => {
            const symbol = userStock.stock.tick;

            try {
              const [quote, profile] = await Promise.all([
                getStockQuote(symbol),
                getCompanyProfile(symbol),
              ]);
          
              updatedStocks.push({
                symbol,
                quote,
                profile,
                amt_bought: userStock.amt_bought,
                total_spent: userStock.total_spent,
                stock_info: userStock.stock,
              });
            } catch (err) {
              console.error(`Failed to fetch data for ${symbol}:`, err);
            }
           }));
           hasRealData = true;
         }
         console.log(updatedStocks);
         setInvestedStocks(updatedStocks);
         
         const {data: transactionHistory, error: transactionError} = await supabase
         .from('transactionhistory')
          .select(`
            stock (tick, name),
            type,
            quantity,
            price_per_share,
            total_amount,
            created_at
          `)
          .eq('user_id', user.id);

          if (transactionError) {
            console.error('Error fetching trade history:', transactionError);
          } 
          console.log("TRANSACTION: ", transactionHistory);
          setTradeHistory(transactionHistory);

          const {data: posts, error: postsError} = await supabase
          .from('posts')
           .select(`
             author,
             created_at,
             body,
             id
           `)
           .eq('author', user.id);

           if (postsError) {
            console.error('Error fetching user posts:', postsError);
          } 
          setUserPosts(posts);

          
        
        // // Example: Fetch followed stocks (replace with your actual query)
        // // Typically this would be a separate table for stocks the user follows but doesn't own
        // const { data: followedStocksData, error: followedStocksError } = await supabase
        //   .from('followed_stocks') // Replace with your actual table name
        //   .select(`
        //     stocks:stock_id (symbol, name, current_price)
        //   `)
        //   .eq('user_id', user.id);
          
        // if (!followedStocksError && followedStocksData?.length > 0) {
        //   // Format the data appropriately
        //   setFollowedStocks(followedStocksData.map(item => item.stocks));
        //   hasRealData = true;
        // }
        
        // // If no real data was found, use dummy data for demonstration
        // if (!hasRealData) {
        //   console.log("No real data found, using dummy data for UI demonstration");
        //   setUseDummyData(true);
          
        //   // Only set dummy data if real data wasn't found
        //   if (!userStocks || userStocks.length === 0) {
        //     setInvestedStocks(DUMMY_INVESTED_STOCKS);
        //   }
          
        //   if (!followedStocksData || followedStocksData.length === 0) {
        //     setFollowedStocks(DUMMY_FOLLOWED_STOCKS);
        //   }
          
        //   setTradeHistory(DUMMY_TRADE_HISTORY);
        // }
        
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

  // Scroll to bottom of chat on new message
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory, chatOpen]);

  const handleTabChange = (tab) => {
    console.log("Changing tab to:", tab);
    setActiveTab(tab);
  };

  const fetchUserPosts = async (userId) => {
    const { data: posts, error } = await supabase
      .from('posts')
      .select('author, created_at, body, id')
      .eq('author', userId);
  
    if (error) {
      console.error('Error fetching user posts:', error);
    } else {
      setUserPosts(posts);
    }
  };

  
  const handleDeletePost = async (postId) => {
    const { error } = await supabase.from('posts').delete().eq('id', postId);
    if (error) {
      console.error('Error deleting post:', error);
    } else {
       const { data: { user } } = await supabase.auth.getUser();
       if (user) {
         await fetchUserPosts(user.id);
       }
    }
  };
  
  const handleChatSend = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const userMessage = chatInput.trim();
    setChatHistory((prev) => [...prev, { role: 'user', content: userMessage }]);
    setChatInput('');
    setChatLoading(true);
    try {
      const res = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });
      const data = await res.json();
      if (data.reply) {
        setChatHistory((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      } else {
        setChatHistory((prev) => [...prev, { role: 'assistant', content: 'Sorry, I could not generate a response.' }]);
      }
    } catch (err) {
      setChatHistory((prev) => [...prev, { role: 'assistant', content: 'Error contacting chatbot.' }]);
    } finally {
      setChatLoading(false);
    }
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
  console.log(investedStocks);
  return (
    <>
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
            onClick={() => handleTabChange('watchlist')}
            className={`py-2 px-6 font-semibold text-base ${activeTab === 'watchlist' 
              ? 'text-blue-600 border-b-2 border-blue-600' 
              : 'text-gray-500 hover:text-gray-700'}`}
          >
            Watchlist
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
                    const gainLoss = calculateGainLoss(stock.total_spent/stock.amt_bought, stock.quote.c);
                    const profit = ((stock.quote.c * stock.amt_bought) - stock.total_spent).toFixed(2);
                    return (
                      <Card key={index} className="p-4 hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-center">
                          <div>
                            <h3 className="font-bold text-lg">{stock.symbol}</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{stock.stock_info.name}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">${Number(stock.quote.c).toFixed(2)}</p>
                            <p className={`text-sm ${gainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {gainLoss >= 0 ? '+' : ''}
                              {gainLoss.toFixed(2)}%
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 flex justify-between text-sm">
                          <span>Qty: {stock.amt_bought}</span>
                          <span>Total Spent: ${Number(stock.total_spent).toFixed(2)}</span>
                          <span className={`text-sm ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              Your Profit: ${profit}
                            </span>
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

        {/* Watchlist Tab */}
        {activeTab === 'watchlist' && (
          <div>
            <Watchlist isProfileView={true} />
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
                        <td className="px-4 py-3 whitespace-nowrap">{formatTime(trade.created_at)}</td>
                        <td className="px-4 py-3 whitespace-nowrap font-medium">{trade.stock.tick}</td>
                        <td className={`px-4 py-3 whitespace-nowrap capitalize ${trade.type === 'buy' ? 'text-green-600' : 'text-red-600'}`}>
                          {trade.type}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">{trade.quantity}</td>
                        <td className="px-4 py-3 whitespace-nowrap">${Number(trade.price_per_share).toFixed(2)}</td>
                        <td className="px-4 py-3 whitespace-nowrap">${(trade.total_amount).toFixed(2)}</td>
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
            {
              userPosts.map((posts) => (
                <>
                 <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-4 border border-gray-100 dark:border-gray-700 hover:shadow-lg transition-all duration-200"
                    >
              <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold text-lg shadow-md">
                  {profile.user_name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <span className="font-semibold text-gray-800 dark:text-gray-200 text-lg">{profile.user_name}</span>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {formatTime(posts.created_at)}
                  </p>
                </div>
              </div>
            </div>
            <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap text-lg leading-relaxed pl-13">
              {posts.body}
            </div>
            <button
            onClick={() => handleDeletePost(posts.id)}
            className="text-red-600 hover:underline"
          >
            Delete
          </button>
            </motion.div>
            </>
            ))
          }
          </div>
        )}
      </div>
      {/* Chatbot Floating Widget */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 50 }}>
        {chatOpen ? (
          <div className="w-80 bg-white dark:bg-gray-900 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col h-96">
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 rounded-t-lg">
              <span className="font-semibold text-gray-900 dark:text-white">Stockify AI Chatbot</span>
              <button onClick={() => setChatOpen(false)} className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
              {chatHistory.length === 0 && (
                <div className="text-gray-400 text-sm">Ask me about the best stock options!</div>
              )}
              {chatHistory.map((msg, idx) => (
                <div key={idx} className={`text-sm ${msg.role === 'user' ? 'text-right' : 'text-left'}`}> 
                  <span className={`inline-block px-3 py-2 rounded-lg ${msg.role === 'user' ? 'bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100' : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100'}`}>{msg.content}</span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleChatSend} className="p-2 border-t border-gray-100 dark:border-gray-800 flex gap-2">
              <input
                type="text"
                className="flex-1 rounded-md border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm bg-white dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ask about stocks..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                disabled={chatLoading}
                autoFocus
              />
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                disabled={chatLoading || !chatInput.trim()}
              >
                {chatLoading ? '...' : 'Send'}
              </button>
            </form>
          </div>
        ) : (
          <button
            onClick={() => setChatOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-full shadow-lg text-sm font-semibold"
            title="Chat with Stockify AI"
          >
            💬 Chat with AI
          </button>
        )}
      </div>
    </>
  );
};

// Helper function to calculate gain/loss percentage
function calculateGainLoss(purchasePrice, currentPrice) {
  if (!purchasePrice || !currentPrice) return 0;
  return ((currentPrice - purchasePrice) / purchasePrice) * 100;
}

const formatTime = (dateString) => {
  const date = new Date(dateString);
  // Convert UTC to local time
  const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
  return localDate.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    hour12: true
  });
};

export default Profile;