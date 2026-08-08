import re
import sys

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

def extract_clinical_values(text):
    result = {}

    bp = re.search(r'(\d{2,3})\s*/\s*(\d{2,3})\s*mmHg', text)
    if bp:
        result['blood_pressure'] = f"{bp.group(1)}/{bp.group(2)}"

    sugar = re.search(r'Fasting Blood Sugar[:\s]+(\d+)\s*mg/dL', text, re.IGNORECASE)
    if sugar:
        result['fasting_sugar'] = int(sugar.group(1))

    hba1c = re.search(r'HbA1c[:\s]+(\d+\.?\d*)\s*%', text, re.IGNORECASE)
    if hba1c:
        result['hba1c'] = float(hba1c.group(1))

    hgb = re.search(r'Hemoglobin[:\s]+(\d+\.?\d*)\s*g/dL', text, re.IGNORECASE)
    if hgb:
        result['hemoglobin'] = float(hgb.group(1))

    chol = re.search(r'Total Cholesterol[:\s]+(\d+)\s*mg/dL', text, re.IGNORECASE)
    if chol:
        result['cholesterol'] = int(chol.group(1))

    return result

if __name__ == "__main__":
    text = sys.argv[1] if len(sys.argv) > 1 else SAMPLE_REPORT
    values = extract_clinical_values(text)
    print(values)
