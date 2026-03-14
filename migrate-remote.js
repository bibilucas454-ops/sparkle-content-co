const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config({ path: '.env' });

async function run() {
  const dbUrl = process.env.SUPABASE_DB_URL;
  if (!dbUrl) {
    console.error("SUPABASE_DB_URL not found in .env");
    process.exit(1);
  }

  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log("Connected to DB.");

    const sql1 = fs.readFileSync('supabase/migrations/20260313063000_fix_security_warnings.sql', 'utf8');
    const sql2 = fs.readFileSync('supabase/migrations/20260314152429_secure_oauth_and_storage.sql', 'utf8');

    console.log("Applying fix_security_warnings.sql ...");
    await client.query(sql1);
    
    console.log("Applying secure_oauth_and_storage.sql ...");
    await client.query(sql2);

    console.log("Migrations applied successfully!");
    
    // Now trigger the encrypt-migrator
    console.log("Triggering encrypt-migrator edge function...");
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    const res = await fetch(`${url}/functions/v1/oauth-connect/encrypt-migrator`, {
       method: "POST",
       headers: { "Authorization": `Bearer ${key}` }
    });
    
    const text = await res.text();
    console.log(`Encrypt-Migrator result: [${res.status}] ${text}`);

  } catch (err) {
    console.error("Migration Error:", err);
  } finally {
    await client.end();
  }
}

run();
