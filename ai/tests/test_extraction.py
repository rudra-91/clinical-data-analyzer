"""Unit tests for the clinical biomarker extraction pipeline."""

import os
import sys

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from ai.extract import extract_clinical_values, extract_with_debug

SAMPLE_DIR = os.path.join(os.path.dirname(__file__), "sample_reports")


def _load_sample(name: str) -> str:
    path = os.path.join(SAMPLE_DIR, name)
    with open(path, "r") as f:
        return f.read()


# ---------------------------------------------------------------------------
# CBC
# ---------------------------------------------------------------------------

def test_cbc_extracts_hemoglobin_wbc_platelets():
    text = _load_sample("cbc_thyrocare.txt")
    values = extract_clinical_values(text)
    assert values.get("hemoglobin") == 13.2
    assert values.get("wbc") == 7.2
    assert values.get("platelets") == 245.0 or values.get("platelets") == 245


def test_cbc_thyrocare_extracts_rdw_mcv():
    text = _load_sample("cbc_thyrocare.txt")
    values = extract_clinical_values(text)
    assert "rdw" in values
    assert "mcv" in values


def test_cbc_existing_sample_still_works():
    """Ensure the original sample report format is still recognised."""
    text = """
    Patient Report
    Name: John Doe
    Date: 2026-08-08

    Blood Pressure: 152/96 mmHg
    Fasting Blood Sugar: 168 mg/dL
    HbA1c: 7.2%
    Hemoglobin: 11.2 g/dL
    Total Cholesterol: 245 mg/dL
    """
    values = extract_clinical_values(text)
    assert values.get("blood_pressure") == "152/96"
    assert values.get("fasting_sugar") == 168
    assert values.get("hba1c") == 7.2
    assert values.get("hemoglobin") == 11.2
    assert values.get("cholesterol") == 245


# ---------------------------------------------------------------------------
# Lipid Profile
# ---------------------------------------------------------------------------

def test_lipid_profile_thyrocare():
    text = _load_sample("cbc_thyrocare.txt")
    values = extract_clinical_values(text)
    assert values.get("cholesterol") == 245.0 or values.get("cholesterol") == 245
    assert "hdl" in values
    assert "ldl" in values
    assert "triglycerides" in values


def test_lipid_profile_apollo_with_hdl_cholesterol_direct():
    text = _load_sample("lipid_apollo.txt")
    values = extract_clinical_values(text)
    # "HDL Cholesterol" should map to HDL, not total cholesterol
    assert "cholesterol" in values
    assert "hdl" in values
    assert "ldl" in values
    assert "triglycerides" in values


def test_lipid_profile_apollo_extracts_cholesterol():
    text = _load_sample("lipid_apollo.txt")
    values = extract_clinical_values(text)
    assert values.get("cholesterol") == 268


def test_hdl_cholesterol_direct_matches_hdl_not_cholesterol():
    """Thyrocare-style 'Cholesterol - HDL' should extract HDL, not duplicate."""
    text = "Cholesterol - HDL: 45 mg/dL"
    values = extract_clinical_values(text)
    assert "hdl" in values
    assert values["hdl"] == 45.0


def test_total_cholesterol_does_not_steal_hdl():
    """Ensure 'Cholesterol' pattern doesn't consume 'HDL Cholesterol' text."""
    text = """
    Total Cholesterol: 245 mg/dL
    HDL Cholesterol: 45 mg/dL
    LDL Cholesterol: 120 mg/dL
    """
    values = extract_clinical_values(text)
    assert values.get("cholesterol") == 245.0
    assert values.get("hdl") == 45.0
    assert values.get("ldl") == 120.0


# ---------------------------------------------------------------------------
# Diabetes
# ---------------------------------------------------------------------------

def test_diabetes_vijaya_fbs_ppbs_hba1c():
    text = _load_sample("diabetes_vijaya.txt")
    values = extract_clinical_values(text)
    assert values.get("fasting_sugar") == 142
    assert values.get("glucose_ppbs") == 210
    assert values.get("hba1c") == 8.4


def test_diabetes_fbs_with_glucose_fasting():
    text = "Glucose (Fasting): 95 mg/dL"
    values = extract_clinical_values(text)
    assert values.get("fasting_sugar") == 95.0


def test_ppbs_extraction():
    text = "PPBS: 165 mg/dL  Post Prandial Blood Sugar: 170 mg/dL"
    values = extract_clinical_values(text)
    assert values.get("glucose_ppbs") in (165.0, 170.0)


# ---------------------------------------------------------------------------
# Kidney Function Test
# ---------------------------------------------------------------------------

def test_kidney_aarthi_creatinine_urea_electrolytes():
    text = _load_sample("kidney_aarthi.txt")
    values = extract_clinical_values(text)
    assert values.get("urea") == 42
    assert values.get("creatinine") == 1.4
    assert "egfr" in values
    assert values.get("sodium") == 138
    assert values.get("potassium") == 4.8
    assert values.get("chloride") == 102


def test_creatinine_serum_creatinine():
    text = "Serum Creatinine: 1.1 mg/dL"
    values = extract_clinical_values(text)
    assert values.get("creatinine") == 1.1


# ---------------------------------------------------------------------------
# Liver Function Test
# ---------------------------------------------------------------------------

def test_liver_apollo_sgot_sgpt_protein_albumin_bilirubin():
    text = _load_sample("lipid_apollo.txt")
    values = extract_clinical_values(text)
    assert values.get("sgot") == 52
    assert values.get("sgpt") == 78
    assert values.get("protein_total") == 7.2
    assert values.get("albumin") == 4.1
    assert values.get("bilirubin") == 1.1


def test_sgot_alt_aliases():
    text = "SGOT (AST): 50 U/L  SGPT (ALT): 80 U/L"
    values = extract_clinical_values(text)
    assert values.get("sgot") == 50
    assert values.get("sgpt") == 80


def test_alp_extraction():
    text = "ALP: 110 U/L"
    values = extract_clinical_values(text)
    assert values.get("alp") == 110


# ---------------------------------------------------------------------------
# Thyroid Profile
# ---------------------------------------------------------------------------

def test_thyroid_lalpath_tsh_ft3_ft4():
    text = _load_sample("thyroid_lalpath.txt")
    values = extract_clinical_values(text)
    assert values.get("tsh") == 8.5
    assert values.get("ft3") == 2.8
    assert values.get("ft4") == 1.9


def test_free_t3_ft3_extracts():
    text = "Free T3 (FT3): 3.5 pg/mL"
    values = extract_clinical_values(text)
    assert values.get("ft3") == 3.5


# ---------------------------------------------------------------------------
# Blood Pressure
# ---------------------------------------------------------------------------

def test_bp_with_colon():
    text = "Blood Pressure: 152/96 mmHg"
    values = extract_clinical_values(text)
    assert values.get("blood_pressure") == "152/96"


def test_bp_abbreviation():
    text = "BP: 130/85 mmHg"
    values = extract_clinical_values(text)
    assert values.get("blood_pressure") == "130/85"


def test_bp_with_s_d():
    text = "BP(S/D): 140/90"
    values = extract_clinical_values(text)
    assert values.get("blood_pressure") == "140/90"


# ---------------------------------------------------------------------------
# Comprehensive SRL report
# ---------------------------------------------------------------------------

def test_srl_comprehensive_report():
    text = _load_sample("comprehensive_srl.txt")
    values = extract_clinical_values(text)
    assert values.get("hemoglobin") == 9.8
    assert values.get("wbc") == 13.5
    assert values.get("platelets") == 480
    assert values.get("cholesterol") == 285
    assert values.get("hdl") == 32
    assert values.get("ldl") == 210
    assert values.get("triglycerides") == 320
    assert values.get("fasting_sugar") == 155
    assert values.get("glucose_ppbs") == 248
    assert values.get("hba1c") == 9.1
    assert values.get("sgot") == 68
    assert values.get("sgpt") == 95
    assert values.get("creatinine") == 1.8
    assert values.get("urea") == 55
    assert values.get("blood_pressure") == "158/98"
    assert values.get("pulse") == 92


# ---------------------------------------------------------------------------
# Generic pathology lab
# ---------------------------------------------------------------------------

def test_generic_mixed_report():
    text = _load_sample("generic_mixed.txt")
    values = extract_clinical_values(text)
    assert values.get("hemoglobin") == 12.5
    assert values.get("wbc") == 6.8
    assert values.get("cholesterol") == 210
    assert values.get("hdl") == 39
    assert values.get("fasting_sugar") == 110
    assert values.get("hba1c") == 6.2
    assert values.get("sgot") == 45
    assert values.get("sgpt") == 62
    assert values.get("sodium") == 140
    assert values.get("potassium") == 4.2
    assert values.get("chloride") == 101
    assert values.get("creatinine") == 1.1
    assert values.get("tsh") == 3.2
    assert values.get("ft3") == 3.0
    assert values.get("ft4") == 1.4
    assert values.get("pulse") == 76
    assert values.get("blood_pressure") == "135/85"
    assert values.get("spO2") == 97


# ---------------------------------------------------------------------------
# Flexible matching (spacing, case, format variations)
# ---------------------------------------------------------------------------

def test_case_insensitive_matching():
    text = "HEMOGLOBIN: 12.5 g/dL  Cholesterol 210 mg/dL"
    values = extract_clinical_values(text)
    assert values.get("hemoglobin") == 12.5
    assert values.get("cholesterol") == 210.0


def test_flexible_separators():
    text = "Hemoglobin=12.5  Cholesterol-145  HDL Cholesterol.38"
    values = extract_clinical_values(text)
    assert values.get("hemoglobin") == 12.5
    assert values.get("cholesterol") == 145.0
    assert values.get("hdl") == 38.0


def test_no_separator_between_name_and_value():
    text = "Cholesterol 180"
    values = extract_clinical_values(text)
    assert values.get("cholesterol") == 180.0


def test_uppercase_report():
    text = """
    TOTAL CHOLESTEROL: 220 MG/DL
    HDL CHOLESTEROL: 42 MG/DL
    LDL CHOLESTEROL: 145 MG/DL
    TRIGLYCERIDES: 150 MG/DL
    HEMOGLOBIN: 14.0 G/DL
    """
    values = extract_clinical_values(text)
    assert values.get("cholesterol") == 220.0
    assert values.get("hdl") == 42.0
    assert values.get("ldl") == 145.0
    assert values.get("triglycerides") == 150.0
    assert values.get("hemoglobin") == 14.0


# ---------------------------------------------------------------------------
# Debug output
# ---------------------------------------------------------------------------

def test_extract_with_debug_returns_debug_info():
    text = "Hemoglobin: 12.5 g/dL"
    values, debug = extract_with_debug(text)
    assert values.get("hemoglobin") == 12.5
    assert debug["has_text"] is True
    assert debug["total_chars"] > 0
    assert debug["matched_count"] == 1


def test_extract_with_debug_prints_raw_text(capsys):
    text = "Fasting Blood Sugar: 110 mg/dL"
    extract_with_debug(text)
    captured = capsys.readouterr()
    assert "OCR OUTPUT" in captured.out
    assert "Fasting Blood Sugar: 110 mg/dL" in captured.out


def test_extract_debug_when_no_biomarkers(capsys):
    text = "Patient Name: John Doe\nDate: 2026-08-08\nNo lab values here."
    values, debug = extract_with_debug(text)
    assert values == {}
    assert debug["matched_count"] == 0
    assert debug["has_text"] is True
    captured = capsys.readouterr()
    assert "no biomarkers were extracted" in captured.out
    assert "Total OCR characters" in captured.out


def test_extract_empty_text():
    values, debug = extract_with_debug("")
    assert values == {}
    assert debug["has_text"] is False
    assert debug["matched_count"] == 0


def test_extract_whitespace_only_text():
    values, debug = extract_with_debug("   \n\n   \t  \n")
    assert values == {}
    assert debug["has_text"] is False
    assert debug["matched_count"] == 0


def test_unrecognized_lines_returned():
    text = """
    Blood Pressure: 140/90 mmHg
    Patient Name: John Doe
    Date: 2026-08-08
    Hemoglobin: 13.5 g/dL
    This line has no biomarker
    """
    values, debug = extract_with_debug(text)
    assert values.get("blood_pressure") == "140/90"
    assert values.get("hemoglobin") == 13.5
    assert "Patient Name: John Doe" in debug["unrecognized_lines"]
    assert "This line has no biomarker" in debug["unrecognized_lines"]


def test_partial_success_status():
    """When text has medical content but no extractable biomarkers,
    the pipeline should return partial_success, not an error."""
    from ai.pipeline import analyze_report

    # Text has medical content but no recognized biomarker patterns
    text = """
    Patient Report
    Name: John Doe
    Date: 2026-08-08
    This patient has been experiencing fatigue and dizziness.
    No abnormal biomarkers were detected in the physical examination.
    """
    result = analyze_report(text)
    assert result["status"] == "partial_success"
    assert result["success"] is True
    assert "debug" in result["data"]


def test_no_clinical_data_error_for_empty_text():
    """Short/empty text should still raise ValueError."""
    from ai.pipeline import analyze_report

    with pytest.raises(ValueError, match="No clinical data found"):
        analyze_report("   ")


def test_spO2_extraction():
    text = "SpO2: 96 %  Oxygen Saturation: 97%"
    values = extract_clinical_values(text)
    assert values.get("spO2") in (96, 97)


def test_wbc_count_extraction():
    text = "WBC Count: 6.8 10^3/uL"
    values = extract_clinical_values(text)
    assert values.get("wbc") == 6.8


def test_white_blood_cell_count_extraction():
    text = "White Blood Cell Count: 8.5 10^3/uL"
    values = extract_clinical_values(text)
    assert values.get("wbc") == 8.5


def test_egfr_extraction():
    text = "eGFR (CKD-EPI): 58 mL/min"
    values = extract_clinical_values(text)
    assert values.get("egfr") == 58


def test_sodium_potassium_chloride():
    text = "Sodium: 140 mmol/L  Potassium: 4.2 mmol/L  Chloride: 101 mmol/L"
    values = extract_clinical_values(text)
    assert values.get("sodium") == 140
    assert values.get("potassium") == 4.2
    assert values.get("chloride") == 101


def test_hemoglobin_hb_extraction():
    text = "Hb: 13.2 g/dL"
    values = extract_clinical_values(text)
    assert values.get("hemoglobin") == 13.2


def test_hct_hematocrit_extraction():
    text = "Hematocrit (Hct): 39.5 %"
    values = extract_clinical_values(text)
    assert values.get("hct") == 39.5


def test_bmi_extraction():
    text = "BMI: 24.5 kg/m2"
    values = extract_clinical_values(text)
    assert values.get("bmi") == 24.5


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
