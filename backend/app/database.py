from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv
import os
from .base import Base
import logging

load_dotenv()

SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql://postgres:postgres@shed-tournament-db:5432/competition_app"
)

engine = create_engine(SQLALCHEMY_DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def run_migrations():
    """Run SQL migration scripts in order."""
    migrations_dir = os.path.join(os.path.dirname(__file__), 'migrations')
    if not os.path.exists(migrations_dir):
        logging.warning("Migrations directory not found")
        return

    # Get all .sql files and sort them
    migration_files = sorted([f for f in os.listdir(migrations_dir) if f.endswith('.sql')])
    
    with engine.connect() as connection:
        for migration_file in migration_files:
            try:
                with open(os.path.join(migrations_dir, migration_file), 'r') as f:
                    sql_script = f.read()
                    connection.execute(text(sql_script))
                    connection.commit()
                logging.info(f"Successfully ran migration: {migration_file}")
            except Exception as e:
                logging.error(f"Error running migration {migration_file}: {e}")
                connection.rollback()
                raise

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

# Run migrations
run_migrations()

# Dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close() 