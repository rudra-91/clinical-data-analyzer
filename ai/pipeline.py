import os
from .extract import extract_clinical_values
from .analyze import analyze
from .summarize import get_context, call_ollama

_KNOWLEDGE_BASE = os.path.join(os.path.dirname(__file__), "knowledge_base")
_CHROMA_DB = os.path.join(os.path.dirname(__file__), "chroma_db")


def analyze_report(report_text: str) -> dict:
    if not report_text or not report_text.strip():
        raise ValueError("Input text is empty")

    if not os.path.isdir(_KNOWLEDGE_BASE):
        raise FileNotFoundError(f"Knowledge base not found at {_KNOWLEDGE_BASE}")

    if not os.path.isdir(_CHROMA_DB):
        raise FileNotFoundError(f"ChromaDB not found at {_CHROMA_DB}. Run build_rag.py first.")

    values = extract_clinical_values(report_text)
    if not values:
        raise ValueError("No clinical values found in the report text")

    analysis = analyze(values)

    queries = [k for k, s in analysis.items() if s != "normal"]
    context_text = "\n\n".join(get_context(q) for q in queries) if queries else "No abnormal findings."

    sm = {'high': 'is above the normal range', 'low': 'is below the normal range',
          'normal': 'is within the normal range', 'diabetes_range': 'falls within the diabetes reference range',
          'prediabetes_range': 'falls within the prediabetes reference range', 'borderline': 'is borderline'}

    params = [
        ('Blood pressure', analysis['blood_pressure'], values['blood_pressure'], 'mmHg'),
        ('Fasting blood sugar', analysis['fasting_sugar'], values['fasting_sugar'], 'mg/dL'),
        ('HbA1c', analysis['hba1c'], values['hba1c'], '%'),
        ('Hemoglobin', analysis['hemoglobin'], values['hemoglobin'], 'g/dL'),
        ('Total cholesterol', analysis['cholesterol'], values['cholesterol'], 'mg/dL'),
    ]
    lines = [f"{p} {sm[s]} ({v} {u})." for p, s, v, u in params]
    lines.append("These findings may warrant further clinical evaluation.")
    summary_text = " ".join(lines)

    prompt = f"""Example format:
Clinical Summary:
Blood pressure is above the normal range. Fasting blood sugar is above the normal range. HbA1c falls within the diabetes reference range. Hemoglobin is below the normal range. Total cholesterol is above the normal range. These findings may warrant further clinical evaluation.

Disclaimer:
This is an educational analysis and not a medical diagnosis.

Now combine the following exact sentences into ONE smooth patient-friendly paragraph. Do not change any clinical interpretation, threshold meaning, or status wording. You may only combine the sentences into a readable paragraph. Keep all numeric values exactly unchanged.

{summary_text}

Reference: {context_text[:100]}"""

    output = call_ollama(prompt)
    start = output.find("Clinical Summary:")
    summary = output[start:].strip() if start != -1 else output.strip()

    sources = [f for f in os.listdir(_KNOWLEDGE_BASE) if f.endswith(".md")]

    return {
        "success": True,
        "data": {
            "extracted_values": values,
            "analysis": analysis,
            "summary": summary,
            "sources": sources,
        }
    }
