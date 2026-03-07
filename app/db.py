import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URI = os.getenv("DB_URI")

def get_conn():
    return psycopg2.connect(DATABASE_URI)
