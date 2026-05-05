FROM python:3.14-slim

# Copy uv from the official image
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app

# Enable bytecode compilation
ENV UV_COMPILE_BYTECODE=1
# Copy from the cache instead of linking since it's a container
ENV UV_LINK_MODE=copy

COPY pyproject.toml uv.lock .python-version README.md ./
RUN uv sync --no-dev --no-install-project

COPY src/ src/
COPY static/ static/
COPY *.csv ./

EXPOSE 8080

CMD ["uv", "run", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8080"]