from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from src.api.v1.graph import router as graph_router
from src.api.v1.majors import router as majors_router
from src.api.v1.courses import router as courses_router
from src.api.v1.planner import router as planner_router
import os

app = FastAPI(title="CU Roadmap API")

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

# Ensure static directory exists before mounting
os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def read_root():
    return RedirectResponse(url="/static/index.html")
