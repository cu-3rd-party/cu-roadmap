import asyncio
import os
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from src.domain.models.course import Course
from src.settings import get_settings

DATABASE_URL = get_settings().db_url
engine = create_async_engine(DATABASE_URL)
async_session = sessionmaker(engine, class_=AsyncSession)

async def check():
    async with async_session() as session:
        res = await session.execute(
            select(Course.title)
            .where(Course.title.ilike('%Алгоритмы%'))
        )
        rows = res.all()
        print(f"Courses matching 'Алгоритмы':")
        for row in rows:
            title = row[0]
            print(f"  - '{title}' (Length: {len(title)})")
            # Print hex codes to see hidden characters
            print(f"    Hex: {' '.join(hex(ord(c)) for c in title)}")

if __name__ == "__main__":
    asyncio.run(check())
