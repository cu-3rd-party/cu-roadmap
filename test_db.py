import asyncio
from sqlalchemy import select
from src.core.database import async_session
from src.domain.models import Course, Major


async def test():
    try:
        async with async_session() as session:
            res1 = await session.execute(select(Course))
            courses = res1.scalars().all()
            print(f"Found {len(courses)} courses.")
            res2 = await session.execute(select(Major))
            majors = res2.scalars().all()
            print(f"Found {len(majors)} majors.")
    except Exception as e:
        print(f"Error: {e}")


if __name__ == "__main__":
    asyncio.run(test())
