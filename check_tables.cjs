
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase URL or Key in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTable(tableName) {
    console.log(`--- Checking Table: ${tableName} ---`);
    const { data, error, status } = await supabase
        .from(tableName)
        .select('*')
        .limit(1);
        
    if (error) {
        console.log(`Status ${status}: ${error.code} - ${error.message}`);
        return;
    }

    console.log(`FOUND ${tableName}. Status 200.`);
    
    // Attempt to get column names by selecting a non-existent column to see the error message?
    // Or better, use a query that we know will fail if the table is not as expected.
    // Actually, if we can do a 'select' on it, it exists in the cache.
}

async function run() {
  await checkTable('post_media');
  await checkTable('publication_jobs');
  await checkTable('publication_attempts');
  await checkTable('social_accounts');
}

run();
