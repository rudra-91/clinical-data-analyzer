import os
import sys
from pathlib import Path

from dotenv import load_dotenv

PROJECT_ROOT = str(Path(__file__).resolve().parent.parent.parent)
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

load_dotenv()

PROJECT_NAME: str = os.getenv("PROJECT_NAME", "Clinical Data Analyzer API")
PROJECT_DESCRIPTION: str = os.getenv(
    "PROJECT_DESCRIPTION",
    "A FastAPI backend for the Clinical Data Analyzer. "
    "Processes clinical lab reports using a RAG-based AI pipeline.",
)
PROJECT_VERSION: str = os.getenv("PROJECT_VERSION", "0.1.0")
ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
API_V1_STR: str = os.getenv("API_V1_STR", "/api/v1")
FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:5173")
