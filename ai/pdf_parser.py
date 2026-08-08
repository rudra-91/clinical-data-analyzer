import fitz  # PyMuPDF
from typing import Optional


class PDFReadError(ValueError):
    def __init__(self, message: str, status_code: int = 422):
        super().__init__(message)
        self.status_code = status_code


def extract_text_from_pdf(file_path: str) -> str:
    doc: Optional[fitz.Document] = None
    try:
        doc = fitz.open(file_path)
        if doc.is_encrypted:
            raise PDFReadError("Password-protected PDF is not supported", status_code=401)

        if len(doc) == 0:
            raise PDFReadError("PDF contains no pages", status_code=422)

        pages_text = []
        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text()
            if text and text.strip():
                pages_text.append(text.strip())

        if not pages_text:
            raise PDFReadError("No readable text found in PDF", status_code=422)

        full_text = "\n\n".join(pages_text)
        lines = [line.strip() for line in full_text.splitlines() if line.strip()]
        cleaned = "\n".join(lines)
        return cleaned

    except PDFReadError:
        raise
    except Exception as exc:
        raise PDFReadError(f"Failed to read PDF: {exc}", status_code=422)
    finally:
        if doc:
            doc.close()
