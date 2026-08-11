"""
Abnormal-value categorisation for extracted biomarkers.

The original code hard-coded five parameters.  This version iterates over
whatever biomarkers the extraction module found and uses the normal-range
thresholds defined in ``biomarkers.py`` (plus a few special rules for
HbA1c, total cholesterol, and blood pressure that need multi-tier logic).
"""

from __future__ import annotations

from .biomarkers import get_biomarker_by_key


def _categorize_hba1c(value: float) -> str:
    if value >= 6.5:
        return "diabetes_range"
    if value >= 5.7:
        return "prediabetes_range"
    return "normal"


def _categorize_cholesterol(value: float) -> str:
    if value >= 240:
        return "high"
    if 200 <= value <= 239:
        return "borderline"
    return "normal"


def _categorize_bp(value: str) -> str:
    s, d = value.split("/")
    s, d = int(s), int(d)
    if s >= 140 or d >= 90:
        return "high"
    if s < 90 or d < 60:
        return "low"
    return "normal"


def _categorize_generic(value: float, lo: float, hi: float, name: str) -> str:
    # Special-case a few well-known markers
    if name == "TSH":
        if value > 4.0:
            return "high"
        if value < 0.4:
            return "low"
        return "normal"
    if name == "Triglycerides":
        if value >= 500:
            return "very_high"
        if value > 150:
            return "high"
        return "normal"
    if name == "LDL Cholesterol":
        if value >= 190:
            return "very_high"
        if value >= 160:
            return "high"
        if value >= 130:
            return "borderline"
        if value >= 100:
            return "near_optimal"
        return "normal"
    if name == "HDL Cholesterol":
        # Low HDL is the concern
        if "female" in str(value).lower() or True:
            # For simplicity we can't distinguish sex in extracted value;
            # use male threshold (<40 = low) as default
            if value < 40:
                return "low"
        return "normal"
    if name == "Sodium":
        return "high" if value > hi else "low" if value < lo else "normal"
    if name == "Potassium":
        if value > 5.1:
            return "high"
        if value < 3.5:
            return "low"
        return "normal"
    if name == "Creatinine":
        return "high" if value > hi else "low" if value < lo else "normal"
    if name == "Urea":
        if value > 40:
            return "high"
        return "normal"
    if name == "SGOT (AST)":
        return "high" if value > hi else "normal"
    if name == "SGPT (ALT)":
        return "high" if value > hi else "normal"
    if name == "Hemoglobin":
        return "low" if value < lo else "high" if value > hi else "normal"
    if name == "WBC / White Blood Cells":
        if value > 11.0:
            return "high"
        if value < 4.0:
            return "low"
        return "normal"
    if name == "Platelets":
        if value > 450 or value < 150:
            return "low"
        return "normal"

    # Generic fallback
    if value > hi:
        return "high"
    if value < lo:
        return "low"
    return "normal"


def analyze(values: dict) -> dict:
    """Categorise every value that was extracted.

    Unknown keys (not in the biomarker registry) are skipped.
    """
    result: dict[str, str] = {}

    for key, value in values.items():
        bm = get_biomarker_by_key(key)
        if bm is None:
            continue

        if bm.is_bp:
            result[key] = _categorize_bp(value)
        elif key == "hba1c":
            result[key] = _categorize_hba1c(value)  # type: ignore[arg-type]
        elif key == "cholesterol":
            result[key] = _categorize_cholesterol(value)  # type: ignore[arg-type]
        elif bm.normal_range is not None:
            lo, hi = bm.normal_range
            result[key] = _categorize_generic(value, lo, hi, bm.name)  # type: ignore[arg-type]
        else:
            result[key] = "normal"

    return result


if __name__ == "__main__":
    extracted = {
        "blood_pressure": "152/96",
        "fasting_sugar": 168,
        "hba1c": 7.2,
        "hemoglobin": 11.2,
        "cholesterol": 245,
    }
    print(analyze(extracted))
