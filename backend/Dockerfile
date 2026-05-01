FROM python:3.14-slim

WORKDIR /app

RUN curl -LsSf https://astral.sh/uv/install.sh | sh

COPY pyproject.toml uv.lock .python-version ./
RUN uv sync --frozen --no-dev

COPY src/ src/

EXPOSE 8080

CMD ["uv", "run", "uvicorn", "src.main:app", "--host", "0.0.0.0", "--port", "8080"]