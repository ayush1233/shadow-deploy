
import psycopg2
conn = psycopg2.connect(
    host='aws-1-ap-southeast-1.pooler.supabase.com',
    port=5432,
    dbname='postgres',
    user='postgres.likjiuylgndoedpkzxhb',
    password='AyushSanjaySonone',
    sslmode='require'
)
cur = conn.cursor()
cur.execute('ALTER TABLE comparisons ADD COLUMN IF NOT EXISTS explanation_summary TEXT;')
cur.execute('ALTER TABLE comparisons ADD COLUMN IF NOT EXISTS explanation_details TEXT;')
cur.execute('ALTER TABLE comparisons ADD COLUMN IF NOT EXISTS explanation_impact TEXT;')
cur.execute('ALTER TABLE comparisons ADD COLUMN IF NOT EXISTS explanation_confidence NUMERIC;')
conn.commit()
cur.close()
conn.close()
print('Migration complete!')

