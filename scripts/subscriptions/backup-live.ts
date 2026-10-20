/**
 * READ-ONLY safety copy of every table of the database in DATABASE_URI, taken before a migration.
 *
 *   npx tsx scripts/subscriptions/backup-live.ts
 *
 * - runs inside one READ ONLY transaction, so it can never change anything and all tables are consistent
 * - writes one .jsonl file per table + _schema.json (columns, indexes, constraints) + _manifest.json
 *   (row counts and checksums) into .local-test/backups/<timestamp>/  (git-ignored)
 * - re-reads every file afterwards and checks that the line counts match the database counts
 *
 * The folder contains customer data. Keep it private and delete it when you no longer need it.
 */
import 'dotenv/config'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { Client } from 'pg'

async function main() {
  const uri = process.env.DATABASE_URI || process.env.DATABASE_URL
  if (!uri) throw new Error('DATABASE_URI is not set')
  const url = new URL(uri)
  const isLocal = ['127.0.0.1', 'localhost'].includes(url.hostname)

  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const dir = path.join(process.cwd(), '.local-test', 'backups', stamp)
  fs.mkdirSync(dir, { recursive: true })

  const client = new Client({ connectionString: uri, ssl: isLocal ? false : { rejectUnauthorized: false } })
  await client.connect()
  console.log('Backing up', url.hostname, url.pathname.slice(1), '->', dir)

  await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY')
  try {
    const tables: string[] = (
      await client.query(`select table_name from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE' order by table_name`)
    ).rows.map((r) => r.table_name)

    const manifest: Record<string, { rows: number; sha256: string }> = {}
    for (const t of tables) {
      const q = `select row_to_json(x)::text as j from "${t}" x`
      const res = await client.query(q)
      const body = res.rows.map((r) => r.j).join('\n') + (res.rows.length ? '\n' : '')
      const file = path.join(dir, `${t}.jsonl`)
      fs.writeFileSync(file, body)
      manifest[t] = { rows: res.rows.length, sha256: crypto.createHash('sha256').update(body).digest('hex') }
    }

    const columns = (await client.query(`select table_name, column_name, data_type, is_nullable, column_default from information_schema.columns where table_schema = 'public' order by table_name, ordinal_position`)).rows
    const indexes = (await client.query(`select tablename, indexname, indexdef from pg_indexes where schemaname = 'public' order by tablename, indexname`)).rows
    const constraints = (await client.query(`select conrelid::regclass::text as tbl, conname, pg_get_constraintdef(oid) as def from pg_constraint where connamespace = 'public'::regnamespace order by 1, 2`)).rows
    fs.writeFileSync(path.join(dir, '_schema.json'), JSON.stringify({ columns, indexes, constraints }, null, 1))

    // the counts must still be the same inside the same snapshot
    for (const t of tables) {
      const n = Number((await client.query(`select count(*)::int as n from "${t}"`)).rows[0].n)
      if (n !== manifest[t].rows) throw new Error(`Row count mismatch for ${t}: wrote ${manifest[t].rows}, database says ${n}`)
    }
    fs.writeFileSync(path.join(dir, '_manifest.json'), JSON.stringify({ takenAt: new Date().toISOString(), host: url.hostname, database: url.pathname.slice(1), tables: manifest }, null, 1))
  } finally {
    await client.query('ROLLBACK') // read-only: nothing to commit
    await client.end()
  }

  // verify the files on disk
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, '_manifest.json'), 'utf8')).tables as Record<string, { rows: number; sha256: string }>
  let totalRows = 0
  for (const [t, info] of Object.entries(manifest)) {
    const text = fs.readFileSync(path.join(dir, `${t}.jsonl`), 'utf8')
    const lines = text ? text.trimEnd().split('\n').length : 0
    if (text && lines !== info.rows) throw new Error(`File check failed for ${t}: ${lines} lines, expected ${info.rows}`)
    if (crypto.createHash('sha256').update(text).digest('hex') !== info.sha256) throw new Error(`Checksum failed for ${t}`)
    // every line must be valid JSON
    if (text) for (const l of text.trimEnd().split('\n')) JSON.parse(l)
    totalRows += info.rows
  }
  console.log(`OK: ${Object.keys(manifest).length} tables, ${totalRows} rows saved and re-verified.`)
  console.log('Key tables:', JSON.stringify(Object.fromEntries(['orders', 'orders_items', 'users', 'products', 'carts', 'affiliates', 'coupons'].map((k) => [k, manifest[k]?.rows]))))
  console.log('Folder:', dir)
}

main().catch((e) => {
  console.error('BACKUP FAILED:', e.message)
  process.exit(1)
})
