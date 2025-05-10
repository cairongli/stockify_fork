const API_BASE_URL = "https://finnhub.io/api/v1/";
const API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;
const MAX_RETRIES = 2;
const RETRY_DELAY = 100;
const CACHE_DURATION = 60000; // 1 minute cache duration

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

  setSearchResults(query, results) {
    this.searchCache.set(query.toLowerCase(), {
      results,
      timestamp: Date.now(),
    });
  },

  set(key, value) {
    this.data[key] = value;
    this.timestamps[key] = Date.now();
  },

  clear() {
    this.data = {};
    this.timestamps = {};
    this.searchCache.clear();
  },
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const refreshInBackground = async (endpoint, symbol, params = {}) => {
  try {
    const url = new URL(`${API_BASE_URL}${endpoint}`);
    url.searchParams.append("symbol", symbol);
    url.searchParams.append("token", API_KEY);
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();
    cache.set(`${endpoint}-${symbol}`, data);
  } catch (error) {
    console.error(`Error refreshing ${endpoint} for ${symbol}:`, error);
  }
};

const makeRequest = async (endpoint, symbol, params = {}) => {
  let retries = 0;
  while (retries <= MAX_RETRIES) {
    try {
      const url = new URL(`${API_BASE_URL}${endpoint}`);
      url.searchParams.append("symbol", symbol);
      url.searchParams.append("token", API_KEY);
      Object.entries(params).forEach(([key, value]) => {
        url.searchParams.append(key, value);
      });

      const response = await fetch(url.toString());
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();

      // Cache the successful response
      cache.set(`${endpoint}-${symbol}`, data);

      // Start background refresh if cache is about to expire
      if (
        Date.now() - cache.timestamps[`${endpoint}-${symbol}`] >
        CACHE_DURATION * 0.8
      ) {
        refreshInBackground(endpoint, symbol, params);
      }

      return data;
    } catch (error) {
      console.error(`Error fetching ${endpoint} for ${symbol}:`, error);
      if (retries === MAX_RETRIES) throw error;
      retries++;
      await delay(RETRY_DELAY * retries);
    }
  }
};

export const getStockQuote = async (symbol) => {
  return makeRequest("quote", symbol);
};

export const getCompanyProfile = async (symbol) => {
  return makeRequest("stock/profile2", symbol);
};

export const getCompanyNews = async (symbol) => {
  return makeRequest("company-news", symbol, {
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    to: new Date().toISOString().split("T")[0],
  });
};

export const searchStocks = async (query) => {
  const cachedResults = cache.getSearchResults(query);
  if (cachedResults) return cachedResults;

  try {
    const url = new URL(`${API_BASE_URL}search`);
    url.searchParams.append("q", query);
    url.searchParams.append("token", API_KEY);

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();

    // Process the API response to extract the actual results array
    if (data && data.result && Array.isArray(data.result)) {
      const processedResults = data.result.map((item) => ({
        symbol: item.symbol,
        description: item.description,
        displaySymbol: item.displaySymbol,
        type: item.type,
      }));

      // Cache the processed results
      cache.setSearchResults(query, processedResults);
      return processedResults;
    } else if (data && Array.isArray(data)) {
      // Cache the results as-is
      cache.setSearchResults(query, data);
      return data;
    } else {
      // Return empty array if we got unexpected response format
      return [];
    }
  } catch (error) {
    console.error("Error searching stocks:", error);
    throw error;
  }
};

const calculateRelevanceScore = (item, query) => {
  const queryLower = query.toLowerCase();
  const symbolLower = item.symbol.toLowerCase();
  const nameLower = item.description.toLowerCase();

  let score = 0;

  // Exact symbol match
  if (symbolLower === queryLower) {
    score += 100;
  }
  // Symbol starts with query
  else if (symbolLower.startsWith(queryLower)) {
    score += 50;
  }
  // Symbol contains query
  else if (symbolLower.includes(queryLower)) {
    score += 30;
  }

  // Name contains query
  if (nameLower.includes(queryLower)) {
    score += 20;
  }

  return score;
};