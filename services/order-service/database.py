import psycopg2
from contextlib import contextmanager
from config import settings


@contextmanager
def get_db_connection():
    conn = psycopg2.connect(settings.database_url)
    try:
        yield conn
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e
    finally:
        conn.close()


def init_db():
    """Initialize database schema"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            with open("schema.sql", "r") as f:
                cur.execute(f.read())
