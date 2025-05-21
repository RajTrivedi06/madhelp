#!/usr/bin/env python3
# resume_pdf_parser.py

from __future__ import annotations
import pathlib
from typing import Optional

from PyPDF2 import PdfReader


class ResumePDFParser:
    """
    Parse résumé-style PDFs into plain UTF-8 text.

    Handles two cases automatically:
      • Digital / "born-PDF"  →  embedded text via PyPDF2
      • Scanned / image-only  →  OCR fallback (pdf2image + pytesseract)

    Example
    -------
    >>> parser = ResumePDFParser("my_resume.pdf")
    >>> parser.save()                       # writes my_resume.txt
    >>> text = parser.text                  # raw text in memory
    >>> alt = ResumePDFParser.parse("cv.pdf", "cv_output.txt")
    """

    # -------- public API -------------------------------------------------

    def __init__(self, pdf_path: str | pathlib.Path, output_path: Optional[str | pathlib.Path] = None):
        self.pdf_path = pathlib.Path(pdf_path).expanduser().resolve()
        if not self.pdf_path.is_file():
            raise FileNotFoundError(f"No such PDF: {self.pdf_path}")

        self.output_path: pathlib.Path = (
            pathlib.Path(output_path).expanduser().resolve()
            if output_path
            else self.pdf_path.with_suffix(".txt")
        )
        self._text: Optional[str] = None  # lazily filled

    @property
    def text(self) -> str:
        """Return résumé text (lazy-loads if necessary)."""
        if self._text is None:
            self._text = self._extract_text()
        return self._text

    def save(self) -> pathlib.Path:
        """Write the extracted text to `self.output_path` and return that Path."""
        out = self.output_path
        out.write_text(self.text, encoding="utf-8")
        return out

    # Handy one-liner for pipelines
    @classmethod
    def parse(cls, pdf_path: str | pathlib.Path, output_path: Optional[str | pathlib.Path] = None) -> str:
        """Extract text and (optionally) write output in one call; returns the text."""
        parser = cls(pdf_path, output_path)
        if output_path:
            parser.save()
        return parser.text

    # -------- implementation details ------------------------------------

    # threshold: fewer characters → assume scanned PDF
    _MIN_TEXT_CHARS = 40

    def _extract_text(self) -> str:
        """Try embedded text first, then OCR if needed."""
        text = self._read_embedded_text()

        if len(text) < self._MIN_TEXT_CHARS:
            text = self._ocr_text()

        return text.strip()

    def _read_embedded_text(self) -> str:
        """Extract text directly with PyPDF2."""
        reader = PdfReader(str(self.pdf_path))
        return "\n".join(page.extract_text() or "" for page in reader.pages)

    def _ocr_text(self) -> str:
        """OCR each page using pdf2image + pytesseract (requires extra deps)."""
        try:
            from pdf2image import convert_from_path
            import pytesseract
        except ImportError as err:
            raise RuntimeError(
                "OCR fallback requires the packages pdf2image, pillow, and pytesseract "
                "plus the Tesseract engine itself.\n"
                "Install with: pip install pdf2image pillow pytesseract"
            ) from err

        images = convert_from_path(str(self.pdf_path), dpi=300)
        return "\n".join(pytesseract.image_to_string(img) for img in images)


# -----------------------------------------------------------------------
# If run as a script:
if __name__ == "__main__":
    import argparse

    ap = argparse.ArgumentParser(description="Convert résumé PDF → UTF-8 text.")
    ap.add_argument("pdf", help="C:/Users/anura/OneDrive/Desktop/College/Applications/Resume Anurag Janaswamy.pdf")
    ap.add_argument("-o", "--output", help="Optional output .txt file")
    args = ap.parse_args()

    parser = ResumePDFParser(args.pdf, args.output)
    path_written = parser.save()
    print(f"✅  Wrote {len(parser.text):,} characters ➜ {path_written}")
