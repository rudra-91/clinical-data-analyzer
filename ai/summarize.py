import json, sys, urllib.request, os
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
from .extract import extract_clinical_values
from .analyze import analyze

CHROMA_DB = os.path.join(os.path.dirname(__file__), "chroma_db")
MODEL_NAME = "BAAI/bge-small-en-v1.5"
OLLAMA_MODEL, OLLAMA_URL = "llama3:latest", "http://localhost:11434/api/generate"

SAMPLE_REPORT = """
Patient Report
Name: John Doe
Date: 2026-08-08

Blood Pressure: 152/96 mmHg
Fasting Blood Sugar: 168 mg/dL
HbA1c: 7.2%
Hemoglobin: 11.2 g/dL
Total Cholesterol: 245 mg/dL
"""

def get_context(query):
    embeddings = HuggingFaceEmbeddings(model_name=MODEL_NAME)
    vectordb = Chroma(persist_directory=CHROMA_DB, embedding_function=embeddings)
    return vectordb.similarity_search(query, k=1)[0].page_content

def call_ollama(prompt):
    payload = json.dumps({
        "model": OLLAMA_MODEL,
        "prompt": prompt,
        "stream": False,
        "options": {"num_predict": 350, "temperature": 0.1}
    }).encode()
    req = urllib.request.Request(OLLAMA_URL, data=payload, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=120) as resp:
        return json.loads(resp.read())["response"]

if __name__ == "__main__":
    text = sys.argv[1] if len(sys.argv) > 1 else SAMPLE_REPORT
    values = extract_clinical_values(text)
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
    print(output[start:] if start != -1 else output)
