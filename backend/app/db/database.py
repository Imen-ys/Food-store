# This code is responsible for connecting your FastAPI application to the database and managing database sessions.

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.core.config import settings

is_sqlite = settings.database_url.startswith("sqlite")

# SQLite needs this option because FastAPI may use several threads.
connect_args = {"check_same_thread": False} if is_sqlite else {}

engine = create_engine(settings.database_url, connect_args=connect_args)

# SQLite ignores foreign keys by default. This turns them ON
# every time a connection is opened, like PostgreSQL does.
if is_sqlite:

    @event.listens_for(engine, "connect")
    def enable_sqlite_foreign_keys(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.close()


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    """All our database table classes will inherit from this."""


def get_db():
    """Give each request its own session and always close it."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()