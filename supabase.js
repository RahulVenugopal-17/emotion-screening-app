// Import Supabase client from CDN (already loaded in index.html)

const SUPABASE_URL = "https://ijrzuqdfpzztufeeqrjs.supabase.co";
const SUPABASE_KEY = "sb_publishable_gS2Gch12fKV5N4M8qF5eCw_lCdai5xq";

// Create Supabase client
const supabase = supabaseJs.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

// Optional: test connection (you can remove later)
console.log("Supabase connected:", supabase);

