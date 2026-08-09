const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres.wfqndulqjkqgqxisvbtu:7bqXA+P-9rA8@aws-1-us-east-1.pooler.supabase.com:6543/postgres'
});

async function run() {
  await client.connect();
  const res = await client.query('SELECT id, name FROM categories;');
  console.log(res.rows);
  await client.end();
}

run().catch(console.error);
