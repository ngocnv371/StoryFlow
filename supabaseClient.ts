
import { createClient } from '@supabase/supabase-js';

// Replace with your actual Supabase URL and Anon Key
// In a real app, these would come from environment variables
const supabaseUrl = 'https://tvbrmblrxagmmdsvjoip.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR2YnJtYmxyeGFnbW1kc3Zqb2lwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAzNzg3MzUsImV4cCI6MjA4NTk1NDczNX0.u2QNGIoMhjV-0SLCvzh0OtXdfgdL6YMK72tI0U1kxXs';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
