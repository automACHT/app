// Supabase configuratie
// Vervang deze waarden met je eigen Supabase project details

const SUPABASE_URL = 'https://tcplmqgxuuduxkgfaner.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjcGxtcWd4dXVkdXhrZ2ZhbmVyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4ODUzMDcsImV4cCI6MjA2NzQ2MTMwN30.NXR33Eb04sYjN0-8qw5HxMtf0xOwNAIV-AzUaAfVHt0';

// Supabase client initialiseren
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export configuration
window.SupabaseConfig = {
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY,
  client: supabase
};
