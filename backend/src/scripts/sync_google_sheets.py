import asyncio
import os
import sys
import uuid

# Add root project dir to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select
from src.domain.models.major import Major
from src.domain.models import Base
from src.services.sync.course_sync import CourseSyncService
from src.settings import get_settings

DATABASE_URL = get_settings().db_url

engine = create_async_engine(DATABASE_URL, echo=False)
async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def main():
    print("Initializing database tables...")
    async with engine.begin() as conn:
        # This will create tables if they don't exist
        await conn.run_sync(Base.metadata.create_all)

    print("Starting Google Sheets synchronization...")
    async with async_session() as session:
        # Seed Majors
        for m_title in [
            "Software Engineering",
            "AI",
            "Business",
            "Common (All Majors)",
        ]:
            res = await session.execute(select(Major).where(Major.title == m_title))
            if not res.scalar():
                session.add(
                    Major(
                        id=uuid.uuid4(),
                        title=m_title,
                        school="Tech" if "Business" not in m_title else "Business",
                    )
                )
        await session.commit()

        try:
            sync_service = CourseSyncService(session)
            count = await sync_service.sync_all()
            print(f"Successfully synchronized {count} courses from Google Sheets!")
        except Exception as e:
            print(f"Error during synchronization: {e}")
            if "credentials" in str(e).lower():
                print(
                    "\nTIP: Make sure you have placed your Google Service Account JSON file in 'backend/credentials/'"
                )
                print("and updated GOOGLE_SERVICE_ACCOUNT_FILE in your .env file.")


if __name__ == "__main__":
    asyncio.run(main())
