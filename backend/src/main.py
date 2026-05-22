import uvicorn
import os
import asyncio
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse

from src.logger import setup_logging
from src.stores.factory import init_store, close_store
from src.api.v1.graph import router as graph_router
from src.api.v1.majors import router as majors_router
from src.api.v1.courses import router as courses_router
from src.api.v1.planner import router as planner_router

setup_logging()


async def _sync_google_sheets_loop(store) -> None:
    interval_seconds = int(os.getenv("GOOGLE_SHEETS_SYNC_INTERVAL_SECONDS", "3600"))

    while True:
        await asyncio.sleep(interval_seconds)

        try:
            await store.sync_google_sheets_data()
        except Exception as e:
            print(f"Warning: Google Sheets background sync failed: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    force_memory = os.getenv("FORCE_MEMORY_STORE", "false").lower() == "true"
    store = await init_store(force_memory=force_memory)
    sync_task = None

    seed_on_startup = os.getenv("SEED_ON_STARTUP", "true").lower() == "true"
    if seed_on_startup:
        try:
            await store.seed_all_data()
            print("Store seeded with data from CSV files")
        except Exception as e:
            print(f"Warning: Could not seed store on startup: {e}")

    google_sync_enabled = os.getenv("GOOGLE_SHEETS_SYNC_ENABLED", "true").lower() == "true"
    if google_sync_enabled:
        try:
            await store.sync_google_sheets_data()
        except Exception as e:
            print(f"Warning: Initial Google Sheets sync failed: {e}")

        sync_task = asyncio.create_task(_sync_google_sheets_loop(store))

    yield

    if sync_task is not None:
        sync_task.cancel()
        try:
            await sync_task
        except asyncio.CancelledError:
            pass

    await close_store()


app = FastAPI(
    title="CU Roadmap API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(graph_router, prefix="/api/v1/graph")
app.include_router(majors_router, prefix="/api/v1/majors")
app.include_router(courses_router, prefix="/api/v1/courses")
app.include_router(planner_router, prefix="/api/v1/planner")

static_dir = os.path.join(os.path.dirname(__file__), "..", "static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")


@app.get("/")
async def root():
    return RedirectResponse(url="/static/index.html")


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8080)
