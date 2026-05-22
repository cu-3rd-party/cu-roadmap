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
        # Check for exact title duplicates
        res = await session.execute(
            select(Course.title, func.count(Course.id))
            .group_by(Course.title)
            .having(func.count(Course.id) > 1)
        )
        dups = res.all()
        print(f"Duplicates by exact title: {len(dups)}")
        for title, count in dups:
            print(f"  - '{title}' ({count} times)")

        # Check for case-insensitive duplicates
        res_ci = await session.execute(
            select(func.lower(Course.title), func.count(Course.id))
            .group_by(func.lower(Course.title))
            .having(func.count(Course.id) > 1)
        )
        dups_ci = res_ci.all()
        print(f"\nDuplicates by case-insensitive title: {len(dups_ci)}")
        for title, count in dups_ci:
            print(f"  - '{title}' ({count} times)")


if __name__ == "__main__":
    asyncio.run(check())
