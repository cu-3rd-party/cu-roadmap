import pytest


@pytest.mark.asyncio
async def test_root_redirects_to_static(integration_client):
    response = await integration_client.get("/", follow_redirects=False)

    assert response.status_code == 307
    assert response.headers["location"] == "/static/index.html"


@pytest.mark.asyncio
async def test_health_endpoint(integration_client):
    response = await integration_client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}


@pytest.mark.asyncio
async def test_get_courses_endpoint(integration_client):
    response = await integration_client.get("/api/v1/courses/")

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 4
    assert {course["title"] for course in data} == {
        "Разработка на Python. Основной",
        "Разработка на Python. Углублённый",
        "Основы промышленной разработки",
        "Введение в экономику",
    }


@pytest.mark.asyncio
async def test_get_graph_data_endpoint(integration_client):
    response = await integration_client.get("/api/v1/graph/data")

    assert response.status_code == 200
    data = response.json()
    assert len(data["nodes"]) == 4
    assert len(data["edges"]) == 1
    assert data["edges"][0]["label"] == "prerequisite"


@pytest.mark.asyncio
async def test_get_majors_endpoint(integration_client):
    response = await integration_client.get("/api/v1/majors/")

    assert response.status_code == 200
    data = response.json()
    assert {major["title"] for major in data} == {"Software Engineering", "Business"}
    software_engineering = next(
        major for major in data if major["title"] == "Software Engineering"
    )
    assert len(software_engineering["requirements"]) == 3


@pytest.mark.asyncio
async def test_identify_major_endpoint(integration_client):
    majors_response = await integration_client.get("/api/v1/majors/")
    majors = majors_response.json()
    software_engineering = next(
        major for major in majors if major["title"] == "Software Engineering"
    )
    first_requirement = software_engineering["requirements"][0]["course_id"]

    response = await integration_client.post(
        "/api/v1/majors/identify",
        json=[first_requirement],
    )

    assert response.status_code == 200
    data = response.json()
    assert data[0]["title"] == "Software Engineering"
    assert data[0]["covered_count"] == 1


@pytest.mark.asyncio
async def test_generate_roadmap_endpoint(integration_client):
    majors_response = await integration_client.get("/api/v1/majors/")
    major_id = next(
        major["id"]
        for major in majors_response.json()
        if major["title"] == "Software Engineering"
    )

    response = await integration_client.post(
        "/api/v1/planner/generate",
        json={
            "passed_course_ids": [],
            "major_id": major_id,
            "current_semester": 1,
            "max_load": 12.0,
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["major_id"] == major_id
    assert isinstance(data["roadmap"], list)
    assert data["roadmap"]


@pytest.mark.asyncio
async def test_validate_semester_endpoint(integration_client):
    courses_response = await integration_client.get("/api/v1/courses/")
    course_id = next(
        course["id"]
        for course in courses_response.json()
        if course["title"] == "Разработка на Python. Основной"
    )

    response = await integration_client.post(
        "/api/v1/planner/validate-semester/",
        json={
            "current_semester": 1,
            "course_ids": [course_id],
            "passed_course_ids": [],
            "max_load": 12.0,
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert data["is_valid"] is True
    assert isinstance(data["messages"], list)


@pytest.mark.asyncio
async def test_validate_semester_missing_prereq(integration_client):
    courses_response = await integration_client.get("/api/v1/courses/")
    advanced_course_id = next(
        course["id"]
        for course in courses_response.json()
        if course["title"] == "Разработка на Python. Углублённый"
    )

    response = await integration_client.post(
        "/api/v1/planner/validate-semester/",
        json={
            "current_semester": 1,
            "course_ids": [advanced_course_id],
            "passed_course_ids": [],
            "max_load": 12.0,
        },
    )

    assert response.status_code == 200
    assert response.json()["is_valid"] is False


@pytest.mark.asyncio
async def test_validate_roadmap_endpoint(integration_client):
    courses_response = await integration_client.get("/api/v1/courses/")
    courses = {course["title"]: course["id"] for course in courses_response.json()}

    response = await integration_client.post(
        "/api/v1/planner/validate-roadmap/",
        json={
            "passed_course_ids": [],
            "roadmap": [
                {
                    "semester": 1,
                    "course_ids": [courses["Разработка на Python. Основной"]],
                },
                {
                    "semester": 3,
                    "course_ids": [courses["Разработка на Python. Углублённый"]],
                },
            ],
            "max_load": 12.0,
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert len(data["validation_results"]) == 2


@pytest.mark.asyncio
async def test_goal_path_endpoint(integration_client):
    courses_response = await integration_client.get("/api/v1/courses/")
    advanced_course_id = next(
        course["id"]
        for course in courses_response.json()
        if course["title"] == "Разработка на Python. Углублённый"
    )

    response = await integration_client.post(
        "/api/v1/planner/goal-path/",
        json={
            "target_course_id": advanced_course_id,
            "passed_course_ids": [],
            "current_semester": 1,
            "max_load": 12.0,
        },
    )

    assert response.status_code == 200
    data = response.json()
    assert isinstance(data["roadmap"], list)
    assert data["roadmap"][0]["semester"] == 1


@pytest.mark.asyncio
async def test_test_engine2_endpoint(integration_client):
    response = await integration_client.get("/api/v1/planner/test-engine2")

    assert response.status_code == 200
    data = response.json()
    assert data == {"error": "No mock students found. Please run mock_data.py"}
