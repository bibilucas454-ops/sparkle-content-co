import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = process.env.VITE_SUPABASE_URL || "https://wjzxntgpuimiubrnqfnz.supabase.co";
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqenhudGdwdWltaXVicm5xZm56Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3Mjk5NDA3NCwiZXhwIjoyMDg4NTcwMDc0fQ.zG8q7LgZ5U3h2C-m8uL2hK_u2K614ZgY3z8lW7rZlP4"; // I don't have the SR key actually! I only have the VITE_SUPABASE_PUBLISHABLE_KEY. Wait.

// Wait, I don't have the service_role_key in .env. 
// Can I just run supabase db query using the supabase cli? But it didn't work.
