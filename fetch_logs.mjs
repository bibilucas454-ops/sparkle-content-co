import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://wjzxntgpuimiubrnqfnz.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqenhudGdwdWltaXVicm5xZm56Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI5OTQwNzQsImV4cCI6MjA4ODU3MDA3NH0.MXkpWtn7gN7v6rfMfUoCOPpO5PPeZc_2tbkV0dNI6i4";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function fetchLogs() {
  const { data, error } = await supabase
    .from('social_accounts')
    .select('*')
    .in('platform', ['debug_instagram_perms', 'debug_instagram_pages'])
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching logs:', error);
    return;
  }

  console.log('----- META API DEBUG LOGS -----');
  data?.forEach(log => {
      console.log(`\n[${log.created_at}] Platform: ${log.platform}`);
      console.log(`Content:\n${log.access_token_encrypted}`);
  });
}

fetchLogs();
