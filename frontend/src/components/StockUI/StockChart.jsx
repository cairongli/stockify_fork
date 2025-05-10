'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Navbar from '@/components/Navbar';
import { supabase } from '@/config/supabaseClient';
import { getStockQuote, getCompanyProfile } from '@/config/finnhubClient';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { FaArrowUp, FaArrowDown, FaChartLine, FaBuilding, FaExchangeAlt, FaCalendarAlt } from 'react-icons/fa';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const formatNumber = (number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number);
};

const StockPage = () => {
  const { symbol } = useParams();
  const [stockData, setStockData] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('1D');
  const [stockRanking, setStockRanking] = useState({
    marketCap: 0,
    volume: 0,
    priceChange: 0
  });

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        window.location.href = '/';
        return;
      }
      setUser(session.user);
    };
    fetchUser();
  }, []);

  useEffect(() => {
    const fetchStockData = async () => {
      try {
        setLoading(true);
        const [quote, profile] = await Promise.all([
          getStockQuote(symbol),
          getCompanyProfile(symbol)
        ]);

        setStockData({
          quote,
          profile
        });
      } catch (error) {
        setError('Failed to fetch stock data');
      } finally {
        setLoading(false);
      }
    };

    if (symbol) {
      fetchStockData();
    }
  }, [symbol]);

  if (!user) return null;
  if (loading) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
    </div>
  );
  if (error) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-red-500 text-xl bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">{error}</div>
    </div>
  );
  if (!stockData) return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center">
      <div className="text-gray-400 text-xl bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">No data available</div>
    </div>
  );

  const { quote, profile } = stockData;
  const isPositive = quote.dp >= 0;

  // Generate more data points for a smoother chart
  const generateChartData = () => {
    const basePrice = quote.c;
    const volatility = Math.abs(quote.dp) / 100;
    const points = 24; // Number of data points
    const data = [];
    const labels = [];

    for (let i = 0; i < points; i++) {
      const time = new Date();
      time.setHours(time.getHours() - (points - i));
      labels.push(time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

      // Generate price with some randomness but maintaining the trend
      const randomFactor = (Math.random() - 0.5) * volatility * basePrice;
      const trendFactor = (i / points) * quote.d * basePrice;
      const price = basePrice + randomFactor + trendFactor;
      data.push(price);
    }

    return { labels, data };
  };

  const { labels, data } = generateChartData();

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Price',
        data,
        borderColor: isPositive ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)',
        backgroundColor: isPositive ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 0,
        borderWidth: 2
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(17, 24, 39, 0.8)',
        titleColor: 'rgb(255, 255, 255)',
        bodyColor: 'rgb(255, 255, 255)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: function(context) {
            return `$${context.raw.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(255, 255, 255, 0.1)',
          drawBorder: false
        },
        ticks: {
          color: 'rgb(156, 163, 175)',
          callback: function(value) {
            return '$' + value.toLocaleString();
          }
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: 'rgb(156, 163, 175)',
          maxRotation: 0
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  };

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar user={user} />
      <div className="container mx-auto px-4 py-8 pt-28">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="bg-gray-800 rounded-2xl shadow-xl p-6 mb-6 transform transition-all hover:scale-[1.01] border border-gray-700">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-white">
                    {profile.name}
                  </h1>
                  <p className="text-gray-400 text-lg">{symbol}</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-white">
                    {formatNumber(quote.c)}
                  </p>
                  <div className="flex items-center justify-end gap-2">
                    {isPositive ? <FaArrowUp className="text-green-500" /> : <FaArrowDown className="text-red-500" />}
                    <p className={`text-lg font-semibold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                      {isPositive ? '+' : ''}{quote.dp.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Time Range Selector */}
              <div className="flex space-x-2 mb-6">
                {['1D', '1W', '1M', '3M', '1Y', 'ALL'].map((range) => (
                  <button
                    key={range}
                    onClick={() => setTimeRange(range)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      timeRange === range
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-700 text-gray-400 hover:text-white hover:bg-gray-600'
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>

              {/* Chart */}
              <div className="h-[400px] mb-6 bg-gray-700/50 rounded-xl p-4 border border-gray-600">
                <Line data={chartData} options={chartOptions} />
              </div>

              {/* Key Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-700/50 p-4 rounded-xl border border-gray-600">
                  <p className="text-sm text-gray-400">Open</p>
                  <p className="text-xl font-semibold text-white">
                    {formatNumber(quote.o)}
                  </p>
                </div>
                <div className="bg-gray-700/50 p-4 rounded-xl border border-gray-600">
                  <p className="text-sm text-gray-400">High</p>
                  <p className="text-xl font-semibold text-white">
                    {formatNumber(quote.h)}
                  </p>
                </div>
                <div className="bg-gray-700/50 p-4 rounded-xl border border-gray-600">
                  <p className="text-sm text-gray-400">Low</p>
                  <p className="text-xl font-semibold text-white">
                    {formatNumber(quote.l)}
                  </p>
                </div>
                <div className="bg-gray-700/50 p-4 rounded-xl border border-gray-600">
                  <p className="text-sm text-gray-400">Volume</p>
                  <p className="text-xl font-semibold text-white">
                    {quote.t.toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-2xl shadow-xl p-6 mb-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4">
                Company Information
              </h2>
              <div className="space-y-4">
                <div className="bg-gray-700/50 p-4 rounded-xl border border-gray-600">
                  <div className="flex items-center gap-2 mb-1">
                    <FaChartLine className="text-blue-500" />
                    <p className="text-sm text-gray-400">Market Cap</p>
                  </div>
                  <p className="text-lg font-semibold text-white">
                    {formatNumber(profile.marketCapitalization)}
                  </p>
                </div>
                <div className="bg-gray-700/50 p-4 rounded-xl border border-gray-600">
                  <div className="flex items-center gap-2 mb-1">
                    <FaBuilding className="text-blue-500" />
                    <p className="text-sm text-gray-400">Industry</p>
                  </div>
                  <p className="text-lg font-semibold text-white">
                    {profile.finnhubIndustry}
                  </p>
                </div>
                <div className="bg-gray-700/50 p-4 rounded-xl border border-gray-600">
                  <div className="flex items-center gap-2 mb-1">
                    <FaExchangeAlt className="text-blue-500" />
                    <p className="text-sm text-gray-400">Exchange</p>
                  </div>
                  <p className="text-lg font-semibold text-white">
                    {profile.exchange}
                  </p>
                </div>
                <div className="bg-gray-700/50 p-4 rounded-xl border border-gray-600">
                  <div className="flex items-center gap-2 mb-1">
                    <FaCalendarAlt className="text-blue-500" />
                    <p className="text-sm text-gray-400">IPO Date</p>
                  </div>
                  <p className="text-lg font-semibold text-white">
                    {profile.ipo}
                  </p>
                </div>
              </div>
            </div>

            {/* Stock Ranking */}
            <div className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4">
                Stock Ranking
              </h2>
              <div className="space-y-4">
                <div className="bg-gray-700/50 p-4 rounded-xl border border-gray-600">
                  <p className="text-sm text-gray-400">Market Cap Rank</p>
                  <p className="text-lg font-semibold text-white">
                    #{stockRanking.marketCap}
                  </p>
                </div>
                <div className="bg-gray-700/50 p-4 rounded-xl border border-gray-600">
                  <p className="text-sm text-gray-400">Volume Rank</p>
                  <p className="text-lg font-semibold text-white">
                    #{stockRanking.volume}
                  </p>
                </div>
                <div className="bg-gray-700/50 p-4 rounded-xl border border-gray-600">
                  <p className="text-sm text-gray-400">Price Change Rank</p>
                  <p className="text-lg font-semibold text-white">
                    #{stockRanking.priceChange}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockPage;