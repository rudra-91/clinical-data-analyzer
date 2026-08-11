"""Regression test: Thyrocare lipid profile exactly as described in the task.

Ensures Total Cholesterol=186, HDL=67, LDL=113, Triglycerides=42 and
NO extra biomarkers (Blood Sugar, HbA1c, Hemoglobin, BP) are produced.
"""

import os
import sys

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from ai.extract import extract_clinical_values, extract_with_debug
from ai.analyze import analyze

SAMPLE_DIR = os.path.join(os.path.dirname(__file__), "sample_reports")


def _load_sample(name: str) -> str:
    path = os.path.join(SAMPLE_DIR, name)
    with open(path, "r") as f:
        return f.read()


def test_thyrocare_lipid_regression_exact_values():
    text = _load_sample("thyrocare_lipid_regression.txt")
    values = extract_clinical_values(text)

    assert values.get("cholesterol") == 186
    assert values.get("hdl") == 67
    assert values.get("ldl") == 113
    assert values.get("triglycerides") == 42


def test_thyrocare_lipid_no_extra_biomarkers():
    text = _load_sample("thyrocare_lipid_regression.txt")
    values = extract_clinical_values(text)

    # Only the 4 lipid biomarkers should be present — no Blood Sugar,
    # HbA1c, Hemoglobin, or Blood Pressure.
    expected_keys = {"cholesterol", "hdl", "ldl", "triglycerides"}
    assert set(values.keys()) == expected_keys


def test_thyrocare_lipid_ldl_near_optimal():
    """LDL = 113 should be classified as near_optimal, not normal."""
    text = _load_sample("thyrocare_lipid_regression.txt")
    values = extract_clinical_values(text)
    analysis = analyze(values)

    assert analysis["ldl"] == "near_optimal"
    # All other lipid markers should be normal
    assert analysis["cholesterol"] == "normal"
    assert analysis["hdl"] == "normal"
    assert analysis["triglycerides"] == "normal"


def test_thyrocare_lipid_debug_output(capsys):
    text = _load_sample("thyrocare_lipid_regression.txt")
    extract_with_debug(text)
    captured = capsys.readouterr()

    # Raw OCR text should be printed
    assert "OCR OUTPUT" in captured.out
    assert "Total Cholesterol            186" in captured.out

    # Per-biomarker step logging
    assert "Matched biomarker: HDL Cholesterol" in captured.out
    assert "Extracted value: 67" in captured.out

    # Final dictionary
    assert "Final extracted dictionary" in captured.out


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
