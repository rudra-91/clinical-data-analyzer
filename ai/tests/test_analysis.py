"""Unit tests for the analysis (categorization) module."""

import os
import sys

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from ai.analyze import analyze, _categorize_generic

SAMPLE_DIR = os.path.join(os.path.dirname(__file__), "sample_reports")


def _load_sample(name: str) -> str:
    path = os.path.join(SAMPLE_DIR, name)
    with open(path, "r") as f:
        return f.read()


# ---------------------------------------------------------------------------
# LDL classification tests (NCEP ATP III guidelines)
# ---------------------------------------------------------------------------

def test_ldl_optimal_is_normal():
    """LDL < 100 should be classified as normal (optimal)."""
    from ai.extract import extract_clinical_values
    text = "LDL Cholesterol: 85 mg/dL"
    values = extract_clinical_values(text)
    result = analyze(values)
    assert result["ldl"] == "normal"


def test_ldl_near_optimal_113():
    """LDL 100-129 should be classified as near_optimal."""
    from ai.extract import extract_clinical_values
    text = "LDL Cholesterol: 113 mg/dL"
    values = extract_clinical_values(text)
    result = analyze(values)
    assert result["ldl"] == "near_optimal"


def test_ldl_near_optimal_100():
    """LDL = 100 should be classified as near_optimal."""
    from ai.extract import extract_clinical_values
    text = "LDL Cholesterol: 100 mg/dL"
    values = extract_clinical_values(text)
    result = analyze(values)
    assert result["ldl"] == "near_optimal"


def test_ldl_near_optimal_129():
    """LDL = 129 should be classified as near_optimal."""
    from ai.extract import extract_clinical_values
    text = "LDL Cholesterol: 129 mg/dL"
    values = extract_clinical_values(text)
    result = analyze(values)
    assert result["ldl"] == "near_optimal"


def test_ldl_borderline_130():
    """LDL = 130 should be classified as borderline."""
    from ai.extract import extract_clinical_values
    text = "LDL Cholesterol: 130 mg/dL"
    values = extract_clinical_values(text)
    result = analyze(values)
    assert result["ldl"] == "borderline"


def test_ldl_borderline_159():
    """LDL = 159 should be classified as borderline."""
    from ai.extract import extract_clinical_values
    text = "LDL Cholesterol: 159 mg/dL"
    values = extract_clinical_values(text)
    result = analyze(values)
    assert result["ldl"] == "borderline"


def test_ldl_high_160():
    """LDL = 160 should be classified as high."""
    from ai.extract import extract_clinical_values
    text = "LDL Cholesterol: 160 mg/dL"
    values = extract_clinical_values(text)
    result = analyze(values)
    assert result["ldl"] == "high"


def test_ldl_high_189():
    """LDL = 189 should be classified as high."""
    from ai.extract import extract_clinical_values
    text = "LDL Cholesterol: 189 mg/dL"
    values = extract_clinical_values(text)
    result = analyze(values)
    assert result["ldl"] == "high"


def test_ldl_very_high_190():
    """LDL >= 190 should be classified as very_high."""
    from ai.extract import extract_clinical_values
    text = "LDL Cholesterol: 190 mg/dL"
    values = extract_clinical_values(text)
    result = analyze(values)
    assert result["ldl"] == "very_high"


def test_ldl_very_high_250():
    """LDL = 250 should be classified as very_high."""
    from ai.extract import extract_clinical_values
    text = "LDL Cholesterol: 250 mg/dL"
    values = extract_clinical_values(text)
    result = analyze(values)
    assert result["ldl"] == "very_high"


# ---------------------------------------------------------------------------
# All-normal report
# ---------------------------------------------------------------------------

def test_all_normal_report_all_normal():
    """All biomarkers in the all-normal report should be categorized as normal."""
    from ai.extract import extract_clinical_values
    text = _load_sample("all_normal_report.txt")
    values = extract_clinical_values(text)
    analysis = analyze(values)
    for key, status in analysis.items():
        assert status == "normal", f"{key} was {status}, expected normal"


def test_all_normal_report_pipeline_summary():
    """Pipeline should produce a summary indicating all values are normal."""
    from ai.pipeline import analyze_report
    text = _load_sample("all_normal_report.txt")
    result = analyze_report(text)
    assert result["success"] is True
    summary = result["data"]["summary"]
    assert "normal" in summary.lower()


# ---------------------------------------------------------------------------
# LDL = 113 (near_optimal) report
# ---------------------------------------------------------------------------

def test_ldl_113_report_ldl_near_optimal():
    """LDL = 113 should be flagged as near_optimal, everything else normal."""
    from ai.extract import extract_clinical_values
    text = _load_sample("ldl_near_optimal_report.txt")
    values = extract_clinical_values(text)
    analysis = analyze(values)
    assert analysis["ldl"] == "near_optimal"
    # All other biomarkers should be normal
    for key, status in analysis.items():
        if key != "ldl":
            assert status == "normal", f"{key} was {status}, expected normal"


def test_ldl_113_report_has_exactly_one_abnormal():
    """Only LDL should be abnormal in the near_optimal report."""
    from ai.extract import extract_clinical_values
    text = _load_sample("ldl_near_optimal_report.txt")
    values = extract_clinical_values(text)
    analysis = analyze(values)
    abnormal = {k: v for k, v in analysis.items() if v != "normal"}
    assert len(abnormal) == 1
    assert "ldl" in abnormal
    assert abnormal["ldl"] == "near_optimal"


# ---------------------------------------------------------------------------
# Multiple abnormal biomarkers report
# ---------------------------------------------------------------------------

def test_multiple_abnormal_report_has_multiple_abnormal():
    """The multiple abnormal report should have several non-normal biomarkers."""
    from ai.extract import extract_clinical_values
    text = _load_sample("multiple_abnormal_report.txt")
    values = extract_clinical_values(text)
    analysis = analyze(values)

    abnormal = {k: v for k, v in analysis.items() if v != "normal"}
    assert len(abnormal) >= 3

    # Cholesterol should be high (265 >= 240)
    assert analysis["cholesterol"] == "high"
    # LDL should be high (185 >= 160)
    assert analysis["ldl"] == "high"
    # HDL should be low (38 < 40)
    assert analysis["hdl"] == "low"
    # Triglycerides should be high (320 > 150)
    assert analysis["triglycerides"] == "high"
    # Fasting sugar should be high (168 >= 126)
    assert analysis["fasting_sugar"] == "high"
    # HbA1c should be diabetes_range (8.5 >= 6.5)
    assert analysis["hba1c"] == "diabetes_range"
    # Hemoglobin should be low (10.2 < 13.5)
    assert analysis["hemoglobin"] == "low"
    # WBC should be high (13.5 > 11)
    assert analysis["wbc"] == "high"


def test_multiple_abnormal_report_extracts_correct_values():
    """Verify the exact extracted values from the multiple abnormal report."""
    from ai.extract import extract_clinical_values
    text = _load_sample("multiple_abnormal_report.txt")
    values = extract_clinical_values(text)
    assert values.get("cholesterol") == 265
    assert values.get("hdl") == 38
    assert values.get("ldl") == 185
    assert values.get("triglycerides") == 320
    assert values.get("fasting_sugar") == 168
    assert values.get("hba1c") == 8.5
    assert values.get("hemoglobin") == 10.2
    assert values.get("wbc") == 13.5


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
