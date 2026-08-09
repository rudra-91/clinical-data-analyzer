import logging
import os
import tempfile

from fastapi import APIRouter, File, HTTPException, UploadFile, status

from ai import analyze_report
from ai.pdf_parser import extract_text_from_pdf

router = APIRouter()

logger = logging.getLogger(__name__)

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
ALLOWED_EXTENSIONS = {".txt", ".pdf"}


@router.post("/analyze")
async def analyze(file: UploadFile = File(...)):
    if not file or not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file provided",
        )

    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '{ext}'. Supported types: .txt, .pdf",
        )

    content = b""
    while True:
        chunk = await file.read(1024 * 1024)
        if not chunk:
            break
        content += chunk
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(
                status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                detail="File too large. Maximum size is 10 MB.",
            )

    if not content or not content.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Empty file",
        )

    if ext == ".txt":
        try:
            report_text = content.decode("utf-8")
        except UnicodeDecodeError:
            report_text = content.decode("utf-8", errors="replace")
    else:
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            tmp.write(content)
            tmp_path = tmp.name
        try:
            report_text = extract_text_from_pdf(tmp_path)
        except Exception as exc:
            logger.error("PDF parsing failed: %s", exc)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to parse PDF file",
            )
        finally:
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)

    try:
        result = analyze_report(report_text)
    except ValueError as exc:
        logger.error("AI analysis rejected input: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(exc),
        )
    except FileNotFoundError as exc:
        logger.error("Required AI resource not found: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI service is not fully configured. Run build_rag.py first.",
        )
    except Exception:
        logger.exception("Unexpected error during AI analysis")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An internal error occurred during analysis",
        )

    return result
