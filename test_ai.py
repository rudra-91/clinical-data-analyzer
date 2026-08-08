from ai import analyze_report

sample_report = """
Blood Pressure: 152/96 mmHg
Fasting Blood Sugar: 168 mg/dL
HbA1c: 7.2%
Hemoglobin: 11.2 g/dL
Total Cholesterol: 245 mg/dL
"""

result = analyze_report(sample_report)
print(result)
