# CU Roadmap Engine

Backend and frontend for university course planning, major identification, and prerequisite visualization.

## Structure
```
src/
    api/v1/          FastAPI route modules by domain
    core/            database configuration and core logic
    domain/models/   SQLAlchemy database models
    services/        business logic and planning engines
    scripts/         operational utilities (e.g. mock data)
frontend/
    src/             React application source
    public/          static assets
docker-compose.yml   local development stack
ARCHITECTURE.md      detailed architectural overview
```

## Configuration
Copy example.env to .env and fill in the real values if needed.

```
.env
```

The application reads configuration from environment variables. Default values are provided for local development.

## Local Development

Install the repo Git hooks once after cloning:

```bash
./scripts/install-git-hooks.sh
```

The pre-commit hook refreshes `backend/uv.lock` and `frontend/pnpm-lock.yaml`, runs backend Ruff formatting and fixes, runs frontend Prettier formatting, and stages those changes automatically.

### Backend
Install dependencies:

```bash
cd backend
uv venv .venv -p 3.14
uv sync
```

Populate database from mock data:

```bash
// Задайте URL подключения к базе данных
export DATABASE_URL=postgresql+asyncpg://roadmap_user:roadmap_password@db:5432/roadmap_db
// По умолчанию скрипт использует URL указанный выше
python -m src.scripts.mock_data
```

Run the API:

```bash
uvicorn src.main:app --reload --port 8000
```

### Frontend
Install dependencies:

```bash
cd frontend
pnpm install
```

Run the development server:

```bash
pnpm dev
```

The application will be available at http://localhost:5173.

## Docker Compose

Start the local development stack:

```bash
docker-compose up --build
```

Services:
- web: FastAPI application
- db: Database service (if using Postgres)

## Deployment

To deploy using Docker Compose:

```bash
docker-compose down || true
docker-compose up -d --build
docker-compose exec -T backend uv run src/scripts/ingest_csv.py
docker-compose exec -T backend uv run src/scripts/mock_data.py
```

This will:
1. Stop any existing containers
2. Build and start all services (nginx, db, backend, frontend)
3. Run database migration scripts (ingest_csv.py)
4. Populate the database with mock data (mock_data.py)

## Features
- Interactive Roadmap Planner: Automatic generation based on Major requirements.
- Course Catalog: Visual list of all disciplines with search and categories.
- Prerequisite Graph: Visualization of dependencies between courses using vis-network.
- Major Identifier: Calculation of Jaccard index between passed courses and major requirements.
