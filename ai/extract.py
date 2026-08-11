"""
Clinical value extraction from OCR/lab-report text.

This module is dictionary-driven (see biomarkers.py).  Extraction is
performed **line-by-line**: for each biomarker, the engine scans lines
top-to-bottom, finds the first line containing a name-pattern match AND a
numeric value on that same line, extracts the first non-range number after
the name, then blanks the name in that line to prevent overlapping matches
(e.g. bare "cholesterol" won't fire on text already consumed by
"HDL Cholesterol").

This design prevents values from bleeding across lines (reference ranges,
patient IDs, dates, phone numbers, barcodes, etc. are never picked up).

Debug output includes:
  1. Raw OCR text (``================ OCR OUTPUT ================``)
  2. Per-biomarker step logging (matched text, value, full line)
  3. Final extracted dictionary
  4. Failure summary (char count, matched count, failed patterns)
"""

from __future__ import annotations

import json
import re
from typing import Any

from .biomarkers import BIOMARKERS, BiomarkerConfig

# Pre-compile a single regex that matches any biomarker name pattern.
_all_patterns = [pat for bm in BIOMARKERS for pat in bm.patterns]
_LINE_MATCHER = re.compile("|".join(f"(?:{p})" for p in _all_patterns), re.IGNORECASE)

# Blanking character — uses null byte so it is never mistaken for whitespace,
# a digit, a dash (range separator), or a letter.
_BLANK = "\x00"


def _build_name_regex(bm: BiomarkerConfig) -> re.Pattern[str]:
    """Compile a case-insensitive alternation of this biomarker's patterns."""
    sorted_patterns = sorted(bm.patterns, key=len, reverse=True)
    combined = "|".join(f"(?:{p})" for p in sorted_patterns)
    return re.compile(combined, re.IGNORECASE)


def _find_value_on_line(line: str, name_end: int, is_bp: bool) -> Any | None:
    """Find the first numeric value in *line* starting at or after *name_end*.

    * For BP: looks for ``systolic / diastolic`` pattern.
    * For others: scans forward for the first number that is NOT part of a
      range (e.g. skips the "0" in "0-200" but keeps "67" in "67 mg/dL 40-60").
    * Numbers preceded by a digit or dot are skipped (avoids matching partial
      decimals or composite tokens).
    """
    search_area = line[name_end:]

    if is_bp:
        match = re.search(r"(\d{2,3})\s*/\s*(\d{2,3})", search_area)
        if match:
            return f"{int(match.group(1))}/{int(match.group(2))}"
        return None

    for match in re.finditer(r"(\d+(?:\.\d+)?)", search_area):
        start = match.start()
        end = match.end()
        raw = match.group(1)

        # Skip if preceded by a digit (part of a larger number)
        if start > 0 and search_area[start - 1].isdigit():
            continue

        # Skip if preceded by a decimal point that itself follows a digit
        # (e.g. the "5" in "12.5" — but NOT the "38" in "Cholesterol.38")
        if start > 1 and search_area[start - 1] == "." and search_area[start - 2].isdigit():
            continue

        # Skip if this number is the left operand of a range like "0-200"
        after = search_area[end:]
        if re.match(r"\s*-\s*\d", after):
            continue

        return float(raw) if "." in raw else int(raw)

    return None


def _get_unrecognized_lines(text: str) -> list[str]:
    """Return non-empty lines that contain no recognised biomarker name."""
    lines = text.splitlines()
    result: list[str] = []
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        if not _LINE_MATCHER.search(stripped):
            result.append(stripped)
    return result


# ---------------------------------------------------------------------------
# Main extraction entry point
# ---------------------------------------------------------------------------


def extract_clinical_values(text: str) -> dict[str, Any]:
    """Extract biomarker values from *text*.

    Returns a dict mapping biomarker keys to values.
    """
    result, _ = extract_with_debug(text)
    return result


def extract_with_debug(text: str) -> tuple[dict[str, Any], dict[str, Any]]:
    """Extract biomarkers and return ``(values, debug_info)``.

    *debug_info* always contains:
      - ``total_chars``: character count of *text*
      - ``matched_count``: number of biomarkers matched
      - ``failed_patterns``: biomarker names whose patterns did not match
      - ``has_text``: whether *text* had any non-whitespace content
      - ``unrecognized_lines``: lines with no recognised biomarker name
    """
    total_chars = len(text) if text else 0
    has_text = bool(text and text.strip())

    # ---------------------------------------------------------------
    # Print raw OCR / report text for debugging
    # ---------------------------------------------------------------
    print("================ OCR OUTPUT ================")
    print(text or "(empty)")
    print("============================================")

    if not has_text:
        debug = {
            "total_chars": total_chars,
            "matched_count": 0,
            "failed_patterns": [bm.name for bm in BIOMARKERS],
            "has_text": False,
            "unrecognized_lines": [],
        }
        print(f"[EXTRACT] No text to parse. Characters: {total_chars}")
        return {}, debug

    values: dict[str, Any] = {}
    failed_biomarkers: list[str] = []

    # Work on a mutable copy of the lines.  When a biomarker name is
    # matched and a value is extracted, the name region is replaced with
    # null bytes so that:
    #   - other biomarkers cannot re-match the same text
    #   - the null-byte padding does not create false "range" patterns
    working_lines = list(text.splitlines())

    for bm in BIOMARKERS:
        name_regex = _build_name_regex(bm)
        found = False

        for line_idx in range(len(working_lines)):
            line = working_lines[line_idx]
            match = name_regex.search(line)

            if match is None:
                continue

            # Only accept this match if a numeric value exists on the
            # SAME line, immediately after the name.
            value = _find_value_on_line(line, match.end(), bm.is_bp)
            if value is None:
                continue

            values[bm.key] = value

            # -----------------------------------------------------------
            # Step logging
            # -----------------------------------------------------------
            print(f"[EXTRACT] Matched biomarker: {bm.name}")
            print(f"  Matched text: {match.group()}")
            print(f"  Extracted value: {value}")
            print(f"  Matched line: {line.strip()}")
            print()

            # Blank out the matched name region with null bytes
            start, end = match.start(), match.end()
            working_lines[line_idx] = (
                line[:start] + _BLANK * (end - start) + line[end:]
            )

            found = True
            break

        if not found:
            failed_biomarkers.append(bm.name)

    matched_count = len(values)

    # ---------------------------------------------------------------
    # Print final extracted dictionary
    # ---------------------------------------------------------------
    print("[EXTRACT] Final extracted dictionary:")
    print(json.dumps(values, indent=2))
    print()

    # ---------------------------------------------------------------
    # Debug: when no biomarkers were extracted but text exists
    # ---------------------------------------------------------------
    if matched_count == 0 and has_text:
        print(f"[EXTRACT] OCR text exists but no biomarkers were extracted.")
        print(f"[EXTRACT] Total OCR characters: {total_chars}")
        print(f"[EXTRACT] Number of extracted biomarkers: {matched_count}")
        print(f"[EXTRACT] Extraction patterns that failed:")
        for bm in BIOMARKERS:
            sample = bm.patterns[0] if bm.patterns else "(none)"
            print(f"  X {bm.name}: first pattern = {sample}")

    unrecognized_lines = _get_unrecognized_lines(text)

    debug = {
        "total_chars": total_chars,
        "matched_count": matched_count,
        "failed_patterns": failed_biomarkers,
        "has_text": has_text,
        "unrecognized_lines": unrecognized_lines,
    }

    return values, debug
