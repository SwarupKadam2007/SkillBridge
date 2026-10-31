import { supabase } from './supabase';

const rawApiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://10.0.2.2:4000';
export const API_URL = rawApiUrl.replace(/\/$/, '');

export async function api(path, options = {}) {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    const url = `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        ...(options.headers || {})
      }
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(body.error || `Request failed with status ${response.status}`);
    }
    return body;
  } catch (error) {
    if (error.message?.includes('Network request failed') || error.name === 'TypeError') {
      throw new Error(`Cannot connect to API server at ${API_URL}. Please ensure the server is running.`);
    }
    throw error;
  }
}
