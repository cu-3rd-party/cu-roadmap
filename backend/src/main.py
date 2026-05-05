import uvicorn
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse

from src.logger import setup_logging
from src.api.v1.graph import router as graph_router
from src.api.v1.majors import router as majors_router
from src.api.v1.courses import router as courses_router
from src.api.v1.planner import router as planner_router

# Initialize logging
setup_logging()

app = FastAPI(
    title="CU Roadmap API",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(graph_router, prefix="/api/v1/graph")
app.include_router(majors_router, prefix="/api/v1/majors")
app.include_router(courses_router, prefix="/api/v1/courses")
app.include_router(planner_router, prefix="/api/v1/planner")

# Mount static files
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
