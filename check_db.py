
import psycopg2
import os

db_url = 'jdbc:postgresql://aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require'
db_url = db_url.replace('jdbc:postgresql://', '')
db_url = db_url.split('?')[0]
host = db_url.split(':')[0]
port = db_url.split(':')[1].split('/')[0]
dbname = db_url.split('/')[1]

password = os.environ.get('SUPABASE_DB_PASSWORD', 'AyushSanjaySonone')

try:
    print(f'Connecting to {host}:{port} as postgres.likjiuylgndoedpkzxio...')
    conn = psycopg2.connect(
        host=host,
        port=port,
        dbname=dbname,
        user='postgres.likjiuylgndoedpkzxio',
        password=password,
        sslmode='require'
    )
    print('? Successfully connected to Supabase PostgreSQL!')
    conn.close()
except Exception as e:
    print('? Failed to connect to Supabase PostgreSQL:')
    print(e)

