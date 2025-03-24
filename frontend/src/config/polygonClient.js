import { restClient } from '@polygon.io/client-js';

export const rest = restClient(process.env.POLY_API_KEY);  
