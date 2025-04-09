// Mock data for testing
export const mockProfiles = [
  {
    user_id: 'test-user-1',
    user_name: 'Test User 1',
    wallet_amt: 10000.0
  },
  {
    user_id: 'test-user-2',
    user_name: 'Test User 2',
    wallet_amt: 15000.0
  }
];

export const mockPosts = [
  {
    id: 1,
    user_id: 'test-user-1',
    title: 'Test Post 1',
    content: 'Test Content 1',
    created_at: '2024-01-01T00:00:00Z'
  },
  {
    id: 2,
    user_id: 'test-user-2',
    title: 'Test Post 2',
    content: 'Test Content 2',
    created_at: '2024-01-02T00:00:00Z'
  }
];

export const mockStocks = [
  {
    id: 1,
    symbol: 'AAPL',
    name: 'Apple Inc.',
    current_price: 150.0
  },
  {
    id: 2,
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    current_price: 2800.0
  }
];

export const mockUserStocks = [
  {
    id: 1,
    user_id: 'test-user-1',
    stock_id: 1,
    quantity: 10,
    purchase_price: 145.0
  },
  {
    id: 2,
    user_id: 'test-user-1',
    stock_id: 2,
    quantity: 5,
    purchase_price: 2750.0
  }
];

// Mock response helpers
export const mockSuccessfulResponse = (data) => ({
  data,
  error: null
});

export const mockErrorResponse = (message) => ({
  data: null,
  error: { message }
});

// Query tracking for mocking
class QueryTracker {
  constructor() {
    this.currentTable = null;
    this.currentOperation = null;
    this.currentParams = {};
    this.response = null;
    this.conditions = [];
    this.orderBy = null;
    this.limit = null;
    this.offset = null;
  }

  setTable(table) {
    this.currentTable = table;
    return this;
  }

  setOperation(operation, params = {}) {
    this.currentOperation = operation;
    this.currentParams = { ...this.currentParams, ...params };
    return this;
  }

  addCondition(column, operator, value) {
    this.conditions.push({ column, operator, value });
    return this;
  }

  setOrderBy(column, ascending = true) {
    this.orderBy = { column, ascending };
    return this;
  }

  setLimit(limit) {
    this.limit = limit;
    return this;
  }

  setOffset(offset) {
    this.offset = offset;
    return this;
  }

  setResponse(response) {
    this.response = response;
    return this;
  }

  getResponse() {
    return this.response || { data: null, error: null };
  }

  reset() {
    this.currentTable = null;
    this.currentOperation = null;
    this.currentParams = {};
    this.response = null;
    this.conditions = [];
    this.orderBy = null;
    this.limit = null;
    this.offset = null;
  }
}

// Mock Supabase database client
export const mockSupabaseDb = {
  _queryTracker: new QueryTracker(),
  
  from(table) {
    this._queryTracker.setTable(table);
    return this;
  },
  
  select(columns = '*') {
    this._queryTracker.setOperation('select', { columns });
    return this;
  },
  
  insert(data) {
    this._queryTracker.setOperation('insert', { data });
    return this;
  },
  
  update(data) {
    this._queryTracker.setOperation('update', { data });
    return this;
  },
  
  delete() {
    this._queryTracker.setOperation('delete');
    return this;
  },
  
  eq(column, value) {
    this._queryTracker.addCondition(column, 'eq', value);
    return this;
  },
  
  neq(column, value) {
    this._queryTracker.addCondition(column, 'neq', value);
    return this;
  },
  
  gt(column, value) {
    this._queryTracker.addCondition(column, 'gt', value);
    return this;
  },
  
  gte(column, value) {
    this._queryTracker.addCondition(column, 'gte', value);
    return this;
  },
  
  lt(column, value) {
    this._queryTracker.addCondition(column, 'lt', value);
    return this;
  },
  
  lte(column, value) {
    this._queryTracker.addCondition(column, 'lte', value);
    return this;
  },
  
  like(column, value) {
    this._queryTracker.addCondition(column, 'like', value);
    return this;
  },
  
  ilike(column, value) {
    this._queryTracker.addCondition(column, 'ilike', value);
    return this;
  },
  
  in(column, values) {
    this._queryTracker.addCondition(column, 'in', values);
    return this;
  },
  
  order(column, { ascending = true } = {}) {
    this._queryTracker.setOrderBy(column, ascending);
    return this;
  },
  
  limit(count) {
    this._queryTracker.setLimit(count);
    return this;
  },
  
  range(start, end) {
    this._queryTracker.setOffset(start);
    this._queryTracker.setLimit(end - start + 1);
    return this;
  },
  
  single() {
    return this._queryTracker.getResponse();
  },
  
  // Helper method to set mock responses
  setMockResponse(response) {
    this._queryTracker.setResponse(response);
    return this;
  }
};

// Reset all mocks
export const resetMockSupabaseDb = () => {
  mockSupabaseDb._queryTracker.reset();
};

// Test utility functions
export const setupMockSupabaseDb = () => {
  jest.mock('@/config/supabaseClient', () => ({
    supabase: mockSupabaseDb
  }));
}; 