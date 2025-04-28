import { NextResponse } from 'next/server';

const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const FINNHUB_BASE_URL = 'https://finnhub.io/api/v1';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');
    const symbol = searchParams.get('symbol');
    const q = searchParams.get('q');
    
    console.log('API route called with params:', { endpoint, symbol, q });
    console.log('API key status:', FINNHUB_API_KEY ? 'Present' : 'Missing');
    
    if (!endpoint) {
      return NextResponse.json({ 
        error: 'Missing required parameter: endpoint',
        details: { endpoint }
      }, { status: 400 });
    }

    // Only require symbol for endpoints that need it
    const requiresSymbol = !['search'].includes(endpoint);
    if (requiresSymbol && !symbol) {
      return NextResponse.json({ 
        error: 'Missing required parameter: symbol',
        details: { endpoint, symbol }
      }, { status: 400 });
    }

    // For search endpoint, require q parameter
    if (endpoint === 'search' && !q) {
      return NextResponse.json({ 
        error: 'Missing required parameter: q',
        details: { endpoint, q }
      }, { status: 400 });
    }

    if (!FINNHUB_API_KEY) {
      console.error('Finnhub API key is missing or invalid');
      return NextResponse.json({ 
        error: 'API key not configured',
        message: 'The Finnhub API key is missing or invalid'
      }, { status: 500 });
    }

    // Build URL with all query parameters
    const urlParams = new URLSearchParams();
    
    // Only append symbol if it's provided
    if (symbol) {
      urlParams.append('symbol', symbol);
    }
    
    // Add all other parameters from the request
    for (const [key, value] of searchParams.entries()) {
      if (key !== 'endpoint' && key !== 'symbol') {
        urlParams.append(key, value);
      }
    }
    
    const url = `${FINNHUB_BASE_URL}/${endpoint}?${urlParams.toString()}`;
    console.log('Making request to Finnhub API:', url);
    
    try {
      // For search endpoint, use a shorter timeout
      const timeout = endpoint === 'search' ? 10000 : 30000; // Increased timeout to 30 seconds
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      const response = await fetch(url, {
        headers: {
          'X-Finnhub-Token': FINNHUB_API_KEY,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        cache: 'no-store', // Disable caching
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Finnhub API error:', errorText);
        return NextResponse.json(
          { 
            error: 'Finnhub API error',
            status: response.status,
            details: errorText
          }, 
          { status: response.status }
        );
      }
      
      const data = await response.json();
      console.log('Finnhub API response:', JSON.stringify(data));
      
      // For search endpoint, ensure we have a result property
      if (endpoint === 'search' && !data.result) {
        console.error('Search response missing result property:', data);
        return NextResponse.json({ result: [] });
      }
      
      return NextResponse.json(data);
    } catch (fetchError) {
      console.error('Error fetching from Finnhub API:', fetchError);
      if (fetchError.name === 'AbortError') {
        return NextResponse.json(
          { 
            error: 'Request timeout',
            message: 'The request to Finnhub API timed out. Please try again later.'
          }, 
          { status: 504 }
        );
      }
      return NextResponse.json(
        { 
          error: 'Error fetching from Finnhub API',
          message: fetchError.message
        }, 
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in Finnhub API route:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error.message
      }, 
      { status: 500 }
    );
  }
} 