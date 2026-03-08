import psycopg2
import os

try:
    conn = psycopg2.connect(
        host='aws-1-ap-southeast-1.pooler.supabase.com',
        port='5432',
        dbname='postgres',
        user='postgres.likjiuylgndoedpkzxhb',
        password=os.environ.get('SUPABASE_DB_PASSWORD', ''),
        sslmode='require'
    )
    cur = conn.cursor()
    # Check if table exists
    cur.execute("SELECT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'comparisons');")
    exists = cur.fetchone()[0]
    print(f'Table exists: {exists}')
    
    if exists:
        cur.execute("SELECT COUNT(*) FROM comparisons")
        count = cur.fetchone()[0]
        print(f'Total comparisons in DB: {count}')
        
        cur.execute("SELECT request_id, endpoint, created_at FROM comparisons ORDER BY created_at DESC LIMIT 5")
        rows = cur.fetchall()
        print('Latest 5 comparisons:')
        for row in rows:
            print(row)
            
        cur.execute("INSERT INTO comparisons (request_id, endpoint, method, severity) VALUES ('req-py-test-999', '/api/test', 'GET', 'low') ON CONFLICT (request_id) DO NOTHING")
        conn.commit()
        print('Inserted a test row directly via psycopg2')
        
        cur.execute("SELECT COUNT(*) FROM comparisons")
        count2 = cur.fetchone()[0]
        print(f'Total comparisons in DB after insert: {count2}')
    
    conn.close()
except Exception as e:
    print('Error:', e)
