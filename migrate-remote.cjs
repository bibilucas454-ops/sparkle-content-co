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

    const sql1 = fs.readFileSync('supabase/migrations/20260314060905_advanced_scheduling_engine.sql', 'utf8');

    console.log("Applying 20260314060905_advanced_scheduling_engine.sql ...");
    await client.query(sql1);

    console.log("Scheduling Engine Migration applied successfully!");

  } catch (err) {
    console.error("Migration Error:", err);
  } finally {
    await client.end();
  }
}

run();
