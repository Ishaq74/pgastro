import type { APIRoute } from 'astro';
import { testConnection } from '../../db';

export const GET: APIRoute = async () => {
  try {
    const result = await testConnection();
    
    return new Response(JSON.stringify({
      success: result.success,
      message: result.success ? 'Connected' : 'Connection failed'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      success: false,
      message: 'Connection failed'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }
};
