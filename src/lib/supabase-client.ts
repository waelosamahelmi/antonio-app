import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file');
}

// Create Supabase client with real-time features enabled
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Export types for TypeScript
export type { User, Session } from '@supabase/supabase-js';

// Helper function to handle Supabase errors
export const handleSupabaseError = (error: any) => {
  console.error('Supabase error:', error);
  if (error?.message) {
    throw new Error(error.message);
  }
  throw new Error('An unexpected error occurred');
};

// Helper function to format Supabase data for frontend
export const formatSupabaseResponse = (data: any) => {
  if (!data) return null;
  
  // Convert snake_case to camelCase for consistency with existing frontend
  const camelCaseData = Array.isArray(data) 
    ? data.map(item => convertSnakeToCamel(item))
    : convertSnakeToCamel(data);
    
  return camelCaseData;
};

const convertSnakeToCamel = (obj: any): any => {
  if (obj === null || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) {
    return obj.map(convertSnakeToCamel);
  }
  
  const camelObj: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    camelObj[camelKey] = convertSnakeToCamel(value);
  }
  
  return camelObj;
};
