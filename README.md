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

### Backend
Install dependencies:

```bash
pip install -r backend/requirements.txt
```

Populate database from mock data:

```bash
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
npm install
```

Run the development server:

```bash
npm run dev
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

## Features
- Interactive Roadmap Planner: Automatic generation based on Major requirements.
- Course Catalog: Visual list of all disciplines with search and categories.
- Prerequisite Graph: Visualization of dependencies between courses using vis-network.
- Major Identifier: Calculation of Jaccard index between passed courses and major requirements.
