import os
import psycopg2
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    # Render provides environment variables directly.
    pass

DATABASE_URI = os.getenv("DB_URI")

def get_conn():
    return psycopg2.connect(DATABASE_URI)
