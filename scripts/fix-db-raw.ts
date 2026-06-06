import { Client } from 'pg'
import 'dotenv/config'

async function run() {
  console.log('Connecting to database...')
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  await client.connect()
  
  console.log('Connected! Running update query on media table...')
  const res = await client.query(`
    UPDATE media 
    SET filename = replace(filename, '-1.', '.') 
    WHERE filename LIKE '%-1.%';
  `)
  console.log(`${res.rowCount} rows updated in media (filename)`)

  console.log('Running update query on sizes JSONB...')
  const res2 = await client.query(`
    UPDATE media 
    SET sizes = regexp_replace(sizes::text, '-1\\.', '.', 'g')::jsonb 
    WHERE sizes::text LIKE '%-1.%';
  `)
  console.log(`${res2.rowCount} rows updated in media (sizes)`)

  await client.end()
  console.log('Done!')
}

run().catch(console.error)
