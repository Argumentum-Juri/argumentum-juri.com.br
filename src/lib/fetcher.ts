
const API_BASE = 'https://mefgswdpeellvaggvttc.supabase.co/rest/v1';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1lZmdzd2RwZWVsbHZhZ2d2dHRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDU3NDQ1NTAsImV4cCI6MjA2MTMyMDU1MH0.9-PrOlsvyrYr8ZUq5C72B_W9L74stkpyqwBkc5xsq8Q';

export async function fetcher<T = any>(path: string): Promise<T> {
  console.log(`[fetcher] → ${API_BASE}/${path}`);
  
  const res = await fetch(`${API_BASE}/${path}`, {
    headers: {
      'apikey': API_KEY,
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
  });
  
  const responseText = await res.clone().text();
  console.log(`[fetcher] ← ${res.status}`, responseText);
  
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${responseText}`);
  }
  
  return res.json();
}
