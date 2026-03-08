const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgres://postgres.likjiuylgndoedpkzxhb:' + process.env.SUPABASE_DB_PASSWORD + '@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres'
});
client.connect().then(async () => {
  try {
    const res = await client.query('SELECT COUNT(*) FROM comparisons');
    console.log('Total rows superuser sees:', res.rows[0].count);
    const rows = await client.query('SELECT request_id FROM comparisons LIMIT 2');
    console.log('Sample requests:', rows.rows);
    const policies = await client.query(`SELECT polname, cmd FROM pg_policy WHERE tablename = 'comparisons'`);
    console.log('Policies on table:', policies.rows);
  } catch (e) {
    console.error('Error querying DB:', e.message);
  }
  client.end();
}).catch(e => {
  console.error('Connection error:', e.message);
  process.exit(1);
});
