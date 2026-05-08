import pytest
from uuid import uuid4
from unittest.mock import patch


@pytest.mark.asyncio
async def test_get_courses_endpoint(store_with_courses):
    from httpx import AsyncClient, ASGITransport
    from src.main import app

    store, course1, course2, course3, _ = store_with_courses

    async def mock_get_store():
        return store

    with patch("src.api.v1.courses.get_store", mock_get_store):
        with patch("src.api.v1.planner.get_store", mock_get_store):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as ac:
                response = await ac.get("/api/v1/courses/")
                assert response.status_code == 200
                data = response.json()
                assert isinstance(data, list)
                assert len(data) == 3


@pytest.mark.asyncio
async def test_validate_semester_endpoint(store_with_courses):
    from httpx import AsyncClient, ASGITransport
    from src.main import app

    store, course1, course2, course3, _ = store_with_courses

    async def mock_get_store():
        return store

    with patch("src.api.v1.courses.get_store", mock_get_store):
        with patch("src.api.v1.planner.get_store", mock_get_store):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as ac:
                response = await ac.post(
                    "/api/v1/planner/validate-semester/",
                    json={
                        "current_semester": 1,
                        "course_ids": [str(course1.id)],
                        "passed_course_ids": [],
                        "max_load": 12.0,
                    },
                )

                assert response.status_code == 200
                data = response.json()
                assert "is_valid" in data
                assert "messages" in data


@pytest.mark.asyncio
async def test_validate_semester_missing_prereq(store_with_courses):
    from httpx import AsyncClient, ASGITransport
    from src.main import app

    store, course1, course2, course3, _ = store_with_courses

    async def mock_get_store():
        return store

    with patch("src.api.v1.courses.get_store", mock_get_store):
        with patch("src.api.v1.planner.get_store", mock_get_store):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as ac:
                response = await ac.post(
                    "/api/v1/planner/validate-semester/",
                    json={
                        "current_semester": 1,
                        "course_ids": [str(course2.id)],
                        "passed_course_ids": [],
                        "max_load": 12.0,
                    },
                )

                assert response.status_code == 200
                data = response.json()
                assert data["is_valid"] is False


@pytest.mark.asyncio
async def test_validate_roadmap_endpoint(store_with_full_data):
    from httpx import AsyncClient, ASGITransport
    from src.main import app

    store, major, course1, course2, course3 = store_with_full_data

    async def mock_get_store():
        return store

    with patch("src.api.v1.courses.get_store", mock_get_store):
        with patch("src.api.v1.planner.get_store", mock_get_store):
            transport = ASGITransport(app=app)
            async with AsyncClient(transport=transport, base_url="http://test") as ac:
                response = await ac.post(
                    "/api/v1/planner/validate-roadmap/",
                    json={
                        "passed_course_ids": [],
                        "roadmap": [
                            {"semester": 1, "course_ids": [str(course1.id)]},
                            {"semester": 3, "course_ids": [str(course2.id)]},
                        ],
                        "max_load": 12.0,
                    },
                )

                assert response.status_code == 200
                data = response.json()
                assert "validation_results" in data
                assert len(data["validation_results"]) == 2


@pytest.mark.asyncio
async def test_generate_roadmap_endpoint(store_with_full_data):
    from httpx import AsyncClient, ASGITransport
    from src.main import app

    store, major, course1, course2, course3 = store_with_full_data

    async def mock_get_store():
        return store

    with patch("src.api.v1.planner.get_store", mock_get_store):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            response = await ac.post(
                "/api/v1/planner/generate",
                json={
                    "passed_course_ids": [],
                    "major_id": str(major.id),
                    "current_semester": 1,
                    "max_load": 12.0,
                },
            )

            assert response.status_code == 200
            data = response.json()
            assert "roadmap" in data
            assert isinstance(data["roadmap"], list)


@pytest.mark.asyncio
async def test_generate_roadmap_with_invalid_major(store_with_courses):
    from httpx import AsyncClient, ASGITransport
    from src.main import app

    store, _, _, _, _ = store_with_courses

    async def mock_get_store():
        return store

    with patch("src.api.v1.planner.get_store", mock_get_store):
        transport = ASGITransport(app=app)
        async with AsyncClient(transport=transport, base_url="http://test") as ac:
            response = await ac.post(
                "/api/v1/planner/generate",
                json={
                    "passed_course_ids": [],
                    "major_id": str(uuid4()),
                    "current_semester": 1,
                    "max_load": 12.0,
                },
            )

            assert response.status_code == 200
            data = response.json()
            assert "roadmap" in data
