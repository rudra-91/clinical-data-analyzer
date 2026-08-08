# Clinical Data Analyzer — Backend

A FastAPI backend for the Clinical Data Analyzer project.

## Project Structure

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py          # FastAPI application entry point
│   ├── config.py        # Environment-based configuration
│   ├── routes/          # API route modules (APIRouter)
│   ├── services/        # Business logic services
│   ├── models/          # Pydantic models / schemas
│   └── utils/           # Utility helpers
├── requirements.txt
├── .env.example
└── README.md
```

## Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Linux/macOS
# .venv\Scripts\activate   # Windows

pip install -r requirements.txt
```

## Configuration

Copy the example environment file and adjust as needed:

```bash
cp .env.example .env
```

## Running the Server

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

- API docs: http://127.0.0.1:8000/docs
- Health check: http://127.0.0.1:8000/health

## Notes

- The `ai/` package at the project root is treated as an external library and is **not** imported by this backend.
- File upload and report analysis endpoints will be added in a later phase.
