// Supabase configuration
const SUPABASE_URL = "https://ijrzuqdfpzztufeeqrjs.supabase.co";
const SUPABASE_KEY = "sb_publishable_gS2Gch12fKV5N4M8qF5eCw_lCdai5xq";

// Create client using Supabase v2 CDN
window.supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);



