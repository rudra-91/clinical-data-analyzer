import os

from .extract import extract_with_debug
from .analyze import analyze
from .summarize import get_context, call_ollama
from .biomarkers import get_biomarker_by_key

_KNOWLEDGE_BASE = os.path.join(os.path.dirname(__file__), "knowledge_base")
_CHROMA_DB = os.path.join(os.path.dirname(__file__), "chroma_db")

# Human-friendly labels for the summary sentences.
_PARAM_LABELS = {
    "blood_pressure": "Blood pressure",
    "fasting_sugar": "Fasting blood sugar",
    "glucose_ppbs": "Post-prandial blood sugar",
    "hba1c": "HbA1c",
    "hemoglobin": "Hemoglobin",
    "cholesterol": "Total cholesterol",
    "hdl": "HDL cholesterol",
    "ldl": "LDL cholesterol",
    "triglycerides": "Triglycerides",
    "wbc": "White blood cell count",
    "platelets": "Platelet count",
    "creatinine": "Creatinine",
    "urea": "Blood urea",
    "eGFR": "eGFR",
    "sgot": "SGOT (AST)",
    "sgpt": "SGPT (ALT)",
    "alp": "Alkaline phosphatase",
    "bilirubin": "Total bilirubin",
    "albumin": "Serum albumin",
    "protein_total": "Total protein",
    "tsh": "TSH",
    "ft3": "Free T3",
    "ft4": "Free T4",
    "sodium": "Sodium",
    "potassium": "Potassium",
    "chloride": "Chloride",
    "pulse": "Pulse",
    "spO2": "Oxygen saturation (SpO2)",
    "weight": "Weight",
    "bmi": "BMI",
    "rdw": "RDW",
    "mcv": "MCV",
    "hct": "Hematocrit",
}

_PARAM_UNITS = {
    "blood_pressure": "mmHg",
    "fasting_sugar": "mg/dL",
    "glucose_ppbs": "mg/dL",
    "hba1c": "%",
    "hemoglobin": "g/dL",
    "cholesterol": "mg/dL",
    "hdl": "mg/dL",
    "ldl": "mg/dL",
    "triglycerides": "mg/dL",
    "wbc": "10^3/uL",
    "platelets": "10^3/uL",
    "creatinine": "mg/dL",
    "urea": "mg/dL",
    "eGFR": "mL/min/1.73m2",
    "sgot": "U/L",
    "sgpt": "U/L",
    "alp": "U/L",
    "bilirubin": "mg/dL",
    "albumin": "g/dL",
    "protein_total": "g/dL",
    "tsh": "mIU/L",
    "ft3": "pg/mL",
    "ft4": "ng/dL",
    "sodium": "mmol/L",
    "potassium": "mmol/L",
    "chloride": "mmol/L",
    "pulse": "bpm",
    "spO2": "%",
    "weight": "kg",
    "bmi": "kg/m2",
    "rdw": "%",
    "mcv": "fL",
    "hct": "%",
}

# Map analysis status → human-readable description
_STATUS_MEANING = {
    "high": "is above the normal range",
    "low": "is below the normal range",
    "normal": "is within the normal range",
    "borderline": "is borderline",
    "diabetes_range": "falls within the diabetes reference range",
    "prediabetes_range": "falls within the prediabetes reference range",
    "near_optimal": "is near optimal (100-129 mg/dL)",
    "very_high": "is very high",
}


def _format_line(key: str, status: str, value, unit: str) -> str:
    label = _PARAM_LABELS.get(key, key.replace("_", " ").title())
    val_str = f"{value} {unit}".strip()
    meaning = _STATUS_MEANING.get(status, "is abnormal")
    return f"{label} {meaning} ({val_str})."


def _build_summary(values: dict, analysis: dict) -> str:
    lines = []
    for key, status in analysis.items():
        if status == "normal":
            continue
        value = values.get(key, "")
        unit = _PARAM_UNITS.get(key, "")
        lines.append(_format_line(key, status, value, unit))

    if not lines:
        return "All measured parameters are within normal reference ranges."

    lines.append("These findings may warrant further clinical evaluation.")
    summary_text = " ".join(lines)

    context_text = "No abnormal findings."
    queries = [k for k, s in analysis.items() if s != "normal"]
    if queries:
        try:
            if os.path.isdir(_CHROMA_DB):
                context_parts = []
                for q in queries:
                    bm = get_biomarker_by_key(q)
                    query_str = bm.name if bm else q
                    ctx = get_context(query_str)
                    context_parts.append(ctx)
                context_text = "\n\n".join(context_parts)
        except Exception:
            pass

    prompt = f"""Example format:
Clinical Summary:
Blood pressure is above the normal range. Fasting blood sugar is above the normal range. HbA1c falls within the diabetes reference range. Hemoglobin is below the normal range. Total cholesterol is above the normal range. These findings may warrant further clinical evaluation.

Disclaimer:
This is an educational analysis and not a medical diagnosis.

Now combine the following exact sentences into ONE smooth patient-friendly paragraph. Do not change any clinical interpretation, threshold meaning, or status wording. You may only combine the sentences into a readable paragraph. Keep all numeric values exactly unchanged.

{summary_text}

Reference: {context_text[:200]}"""

    try:
        output = call_ollama(prompt)
        start = output.find("Clinical Summary:")
        summary = output[start:].strip() if start != -1 else output.strip()
        if "Disclaimer:" in summary:
            disclaimer_idx = summary.find("Disclaimer:")
            summary = summary[:disclaimer_idx].strip()
            summary += "\n\nDisclaimer: This is an educational analysis and not a medical diagnosis."
    except Exception as exc:
        # Fall back to plain-text summary if Ollama is unavailable
        summary = summary_text + "\n\nDisclaimer: This is an educational analysis and not a medical diagnosis."
        _ = exc  # log silently

    return summary


def analyze_report(report_text: str) -> dict:
    if not report_text or not report_text.strip():
        raise ValueError("No clinical data found")

    if not os.path.isdir(_KNOWLEDGE_BASE):
        raise FileNotFoundError(f"Knowledge base not found at {_KNOWLEDGE_BASE}")

    values, debug = extract_with_debug(report_text)

    # ---------------------------------------------------------------
    # No clinical values found — decide between hard error and
    # partial_success based on whether the OCR text was long enough
    # to contain real medical content.
    # ---------------------------------------------------------------
    if not values:
        if debug["has_text"] and debug["total_chars"] >= 20:
            # OCR extracted readable text but we couldn't parse specific
            # biomarkers — return partial_success instead of failing.
            return {
                "status": "partial_success",
                "success": True,
                "data": {
                    "extracted_values": {},
                    "analysis": {},
                    "summary": "Some clinical text was detected but specific biomarker values could not be extracted. Please review the raw report for details.",
                    "sources": [],
                    "debug": debug,
                },
            }
        raise ValueError("No clinical data found")

    analysis = analyze(values)
    summary = _build_summary(values, analysis)
    sources = [f for f in os.listdir(_KNOWLEDGE_BASE) if f.endswith(".md")]

    return {
        "success": True,
        "data": {
            "extracted_values": values,
            "analysis": analysis,
            "summary": summary,
            "sources": sources,
            "debug": debug,
        },
    }
