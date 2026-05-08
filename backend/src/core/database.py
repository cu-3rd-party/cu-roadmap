import os
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

# Use environment variable for database URL, defaulting to the docker-compose service name 'db'
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+asyncpg://roadmap_user:roadmap_password@db:5432/roadmap_db",
)

engine = create_async_engine(DATABASE_URL, echo=False)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def get_db():
    async with async_session() as session:
        yield session
