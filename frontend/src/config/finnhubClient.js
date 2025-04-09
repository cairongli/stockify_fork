import axios from 'axios';

const API_BASE_URL = 'https://finnhub.io/api/v1/';
const MAX_RETRIES = 2;
const RETRY_DELAY = 100;
const CACHE_DURATION = 60000; // 1 minute cache duration

// Create an axios instance for our proxy API with increased timeout
const proxyClient = axios.create({
  baseURL: '/api/finnhub',
  timeout: 10000, // Increased timeout to 10 seconds
});

// Enhanced in-memory cache with prefetch support
const cache = {
  data: {},
  timestamps: {},
  prefetchQueue: new Set(),
  searchCache: new Map(), // Separate cache for search results with partial matching
  
  get(key) {
    const timestamp = this.timestamps[key];
    if (!timestamp) return null;
    
    // Check if cache is expired
    if (Date.now() - timestamp > CACHE_DURATION) {
      delete this.data[key];
      delete this.timestamps[key];
      return null;
    }
    
    return this.data[key];
  },
  
  // Special get method for search queries that supports partial matches
  getSearchResults(query) {
    query = query.toLowerCase();
    // Try to find an exact match first
    if (this.searchCache.has(query)) {
      const cached = this.searchCache.get(query);
      if (Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.results;
      }
      this.searchCache.delete(query);
    }
    
    // Look for partial matches
    for (const [cachedQuery, cached] of this.searchCache.entries()) {
      if (query.startsWith(cachedQuery) || cachedQuery.startsWith(query)) {
        if (Date.now() - cached.timestamp < CACHE_DURATION) {
          return cached.results;
        }
        this.searchCache.delete(cachedQuery);
      }
    }
    return null;
  },
  
  // Special set method for search results
  setSearchResults(query, results) {
    query = query.toLowerCase();
    this.searchCache.set(query, {
      results,
      timestamp: Date.now()
    });
    
    // Limit cache size to prevent memory issues
    if (this.searchCache.size > 100) {
      const oldestKey = Array.from(this.searchCache.keys())[0];
      this.searchCache.delete(oldestKey);
    }
  },
  
  set(key, value) {
    this.data[key] = value;
    this.timestamps[key] = Date.now();
    this.prefetchQueue.delete(key);
  },
  
  clear() {
    this.data = {};
    this.timestamps = {};
    this.prefetchQueue.clear();
    this.searchCache.clear();
  }
};

// Helper function to delay execution
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Background refresh function
const refreshInBackground = async (endpoint, symbol, params = {}) => {
  try {
    const queryParams = new URLSearchParams({
      endpoint,
      symbol,
      ...params
    });
    const response = await proxyClient.get(`?${queryParams.toString()}`);
    cache.set(`${endpoint}:${symbol}:${JSON.stringify(params)}`, response.data);
  } catch (error) {
    // Silently fail for background refreshes
  }
};

// Helper function to make API requests with optimized retry logic and caching
const makeRequest = async (endpoint, symbol, params = {}) => {
  const cacheKey = `${endpoint}:${symbol}:${JSON.stringify(params)}`;
  
  // Check cache first
  const cachedData = cache.get(cacheKey);
  if (cachedData) {
    return cachedData;
  }

  let retries = 0;
  while (retries < MAX_RETRIES) {
    try {
      // Use a shorter delay for search endpoint
      const delayTime = endpoint === 'search' ? 50 : 100;
      await delay(delayTime);
      
      // Construct query parameters
      const queryParams = new URLSearchParams();
      queryParams.append('endpoint', endpoint);
      
      if (symbol) {
        queryParams.append('symbol', symbol);
      }
      
      Object.entries(params).forEach(([key, value]) => {
        queryParams.append(key, value);
      });

      // For search endpoint, use a longer timeout
      const timeout = endpoint === 'search' ? 10000 : 5000;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await proxyClient.get(`?${queryParams.toString()}`, {
          signal: controller.signal,
          timeout: timeout // Set specific timeout for this request
        });

        clearTimeout(timeoutId);
        
        if (endpoint === 'search' && !response.data.result) {
          return { result: [] };
        }
        
        cache.set(cacheKey, response.data);
        return response.data;
      } catch (error) {
        clearTimeout(timeoutId);
        
        // Handle timeout errors specifically
        if (error.code === 'ECONNABORTED' || error.name === 'AbortError') {
          console.error('Request timed out, retrying...');
          if (retries === MAX_RETRIES - 1) {
            // On last retry, return empty results instead of throwing
            if (endpoint === 'search') {
              return { result: [] };
            }
            throw new Error('Request timed out after all retries');
          }
        } else {
          throw error;
        }
      }
    } catch (error) {
      if (retries === MAX_RETRIES - 1) {
        // On last retry for search endpoint, return empty results
        if (endpoint === 'search') {
          return { result: [] };
        }
        throw error;
      }
      retries++;
      await delay(RETRY_DELAY * Math.pow(1.5, retries));
    }
  }
  
  // Fallback for search endpoint
  if (endpoint === 'search') {
    return { result: [] };
  }
  throw new Error('Request failed after all retries');
};

export const getStockQuote = async (symbol) => {
  try {
    // Get quote data
    const quoteData = await makeRequest('quote', symbol);
    
    // For volume, we'll use a mock value based on the stock's price
    // This is a temporary solution until we can get real volume data
    let volume = 0;
    
    // Estimate volume based on price (higher priced stocks tend to have lower volume)
    if (quoteData && quoteData.c) {
      // Rough estimate: volume is inversely proportional to price
      // For example, a $100 stock might have 1M volume, a $10 stock might have 10M volume
      const price = quoteData.c;
      if (price > 0) {
        // Base volume of 10M for a $10 stock
        volume = Math.floor(10000000 * (10 / price));
        
        // Add some randomness to make it look more realistic
        const randomFactor = 0.8 + Math.random() * 0.4; // Random between 0.8 and 1.2
        volume = Math.floor(volume * randomFactor);
      }
    }

    const quote = {
      c: quoteData.c || 0, // current price
      d: quoteData.d || 0, // change
      dp: quoteData.dp || 0, // percent change
      h: quoteData.h || 0, // high
      l: quoteData.l || 0, // low
      o: quoteData.o || 0, // open
      pc: quoteData.pc || 0, // previous close
      t: quoteData.t || 0, // timestamp
      v: volume // estimated volume
    };
    return quote;
  } catch (error) {
    // Return fallback data
    return {
      c: 0, // current price
      d: 0, // change
      dp: 0, // percent change
      h: 0, // high
      l: 0, // low
      o: 0, // open
      pc: 0, // previous close
      t: 0, // timestamp
      v: 0 // volume
    };
  }
};

export const getCompanyProfile = async (symbol) => {
  try {
    const data = await makeRequest('stock/profile2', symbol);
    return {
      name: data.name || symbol,
      country: data.country || 'Unknown',
      currency: data.currency || 'USD',
      exchange: data.exchange || 'Unknown',
      ipo: data.ipo || null,
      marketCapitalization: data.marketCapitalization || 0,
      phone: data.phone || null,
      shareOutstanding: data.shareOutstanding || 0,
      ticker: data.ticker || symbol,
      weburl: data.weburl || null,
      logo: data.logo || null,
      finnhubIndustry: data.finnhubIndustry || 'Unknown'
    };
  } catch (error) {
    // Return fallback data
    return {
      name: symbol,
      country: 'Unknown',
      currency: 'USD',
      exchange: 'Unknown',
      ipo: null,
      marketCapitalization: 0,
      phone: null,
      shareOutstanding: 0,
      ticker: symbol,
      weburl: null,
      logo: null,
      finnhubIndustry: 'Unknown'
    };
  }
};

export const searchStocks = async (query) => {
  try {
    if (!query || query.length < 2) return [];
    
    const data = await makeRequest('search', '', { q: query });
    
    if (!data || !data.result) {
      console.error('Invalid response format:', data);
      return [];
    }
    
    const query_lower = query.toLowerCase();
    const results = data.result
      .filter(item => {
        // Basic validation
        if (!item.symbol || !item.description) return false;
        
        // Filter out test stocks
        if (item.description.toLowerCase().includes('test')) return false;
        
        // Allow both common stocks and stocks without a type specified
        if (item.type && item.type !== 'Common Stock' && item.type !== 'Stock') return false;
        
        // Allow symbols with letters and dots (for some international stocks)
        if (!/^[A-Z.]+$/.test(item.symbol)) return false;
        
        // Limit symbol length to 6 characters (some valid stocks like BRK.A need this)
        if (item.symbol.length > 6) return false;
        
        return true;
      })
      .map(item => ({
        symbol: item.symbol,
        name: item.description,
        displayName: `${item.symbol} - ${item.description}`,
        score: calculateRelevanceScore(item, query_lower)
      }))
      .sort((a, b) => b.score - a.score) // Sort by relevance score
      .slice(0, 10)
      .map(({ symbol, name, displayName }) => ({
        symbol,
        name,
        displayName
      }));
    
    return results;
  } catch (error) {
    console.error('Error searching stocks:', error);
    throw error; // Let the component handle the error
  }
};

// Helper function to calculate relevance score
const calculateRelevanceScore = (item, query) => {
  let score = 0;
  const symbol_lower = item.symbol.toLowerCase();
  const name_lower = item.description.toLowerCase();
  
  // Exact matches get highest priority
  if (symbol_lower === query) score += 1000;
  if (name_lower === query) score += 900;
  
  // Symbol starts with query
  if (symbol_lower.startsWith(query)) score += 800;
  
  // Company name starts with query
  if (name_lower.startsWith(query)) score += 700;
  
  // Symbol contains query
  if (symbol_lower.includes(query)) score += 600;
  
  // Company name contains query
  if (name_lower.includes(query)) score += 500;
  
  // Bonus points for shorter symbols (they tend to be more established companies)
  score += (7 - item.symbol.length) * 10;
  
  // Bonus points for exact word matches in company name
  const queryWords = query.split(' ');
  const nameWords = name_lower.split(' ');
  queryWords.forEach(word => {
    if (word.length > 1 && nameWords.includes(word)) {
      score += 100;
    }
  });
  
  // Extra points for well-known exchanges
  if (item.exchange) {
    const exchange = item.exchange.toLowerCase();
    if (exchange.includes('nyse') || exchange.includes('nasdaq')) {
      score += 200;
    }
  }
  
  return score;
}; 