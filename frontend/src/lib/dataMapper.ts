import type { AnalyzeResponse, AnalyzeResponseData, AnalysisResult, BiomarkerValue } from './api'
import type { AnalysisData, Finding, Reference } from './store'

// Map API analysis status to UI finding status
const STATUS_MAP: Record<string, 'high' | 'low' | 'normal' | 'near_optimal'> = {
  high: 'high',
  low: 'low',
  normal: 'normal',
  diabetes_range: 'high',
  prediabetes_range: 'high',
  borderline: 'high',
  very_high: 'high',
  near_optimal: 'near_optimal',
}

// Parameter display info — label, unit, and the extracted_values key
interface ParameterInfo {
  label: string
  unit: string
}

const PARAMETER_INFO: Record<string, ParameterInfo> = {
  blood_pressure: { label: 'Blood Pressure', unit: 'mmHg' },
  fasting_sugar: { label: 'Fasting Blood Sugar', unit: 'mg/dL' },
  glucose_ppbs: { label: 'PPBS', unit: 'mg/dL' },
  hba1c: { label: 'HbA1c', unit: '%' },
  hemoglobin: { label: 'Hemoglobin', unit: 'g/dL' },
  cholesterol: { label: 'Total Cholesterol', unit: 'mg/dL' },
  hdl: { label: 'HDL Cholesterol', unit: 'mg/dL' },
  ldl: { label: 'LDL Cholesterol', unit: 'mg/dL' },
  triglycerides: { label: 'Triglycerides', unit: 'mg/dL' },
  wbc: { label: 'WBC Count', unit: '10^3/uL' },
  platelets: { label: 'Platelet Count', unit: '10^3/uL' },
  creatinine: { label: 'Creatinine', unit: 'mg/dL' },
  urea: { label: 'Blood Urea', unit: 'mg/dL' },
  eGFR: { label: 'eGFR', unit: 'mL/min/1.73m2' },
  sgot: { label: 'SGOT (AST)', unit: 'U/L' },
  sgpt: { label: 'SGPT (ALT)', unit: 'U/L' },
  alp: { label: 'ALP', unit: 'U/L' },
  bilirubin: { label: 'Total Bilirubin', unit: 'mg/dL' },
  albumin: { label: 'Serum Albumin', unit: 'g/dL' },
  protein_total: { label: 'Total Protein', unit: 'g/dL' },
  tsh: { label: 'TSH', unit: 'mIU/L' },
  ft3: { label: 'Free T3', unit: 'pg/mL' },
  ft4: { label: 'Free T4', unit: 'ng/dL' },
  sodium: { label: 'Sodium', unit: 'mmol/L' },
  potassium: { label: 'Potassium', unit: 'mmol/L' },
  chloride: { label: 'Chloride', unit: 'mmol/L' },
  pulse: { label: 'Pulse', unit: 'bpm' },
  spO2: { label: 'Oxygen Saturation (SpO2)', unit: '%' },
  weight: { label: 'Weight', unit: 'kg' },
  bmi: { label: 'BMI', unit: 'kg/m2' },
  rdw: { label: 'RDW', unit: '%' },
  mcv: { label: 'MCV', unit: 'fL' },
  hct: { label: 'Hematocrit', unit: '%' },
}

// Reference ranges for display
const REFERENCE_RANGES: Record<string, string> = {
  blood_pressure: '< 120/80 mmHg',
  fasting_sugar: '70–99 mg/dL',
  glucose_ppbs: '< 140 mg/dL',
  hba1c: '< 5.7%',
  hemoglobin: '13.5–17.5 g/dL',
  cholesterol: '< 200 mg/dL',
  hdl: '> 40 mg/dL (men) / > 50 mg/dL (women)',
  ldl: '< 100 mg/dL',
  triglycerides: '< 150 mg/dL',
  wbc: '4,000–11,000 /μL',
  platelets: '150,000–450,000 /μL',
  creatinine: '0.6–1.2 mg/dL',
  urea: '7–20 mg/dL',
  eGFR: '> 60 mL/min/1.73m2',
  sgot: '0–40 U/L',
  sgpt: '0–45 U/L',
  alp: '44–147 U/L',
  bilirubin: '0.1–1.2 mg/dL',
  albumin: '3.5–5.0 g/dL',
  protein_total: '6.0–8.3 g/dL',
  tsh: '0.4–4.0 mIU/L',
  ft3: '2.3–4.2 pg/mL',
  ft4: '0.8–1.8 ng/dL',
  sodium: '135–145 mmol/L',
  potassium: '3.5–5.1 mmol/L',
  chloride: '96–106 mmol/L',
  pulse: '60–100 bpm',
  spO2: '≥ 95%',
  weight: 'N/A',
  bmi: '18.5–24.9 kg/m2',
  rdw: '11.5–14.5%',
  mcv: '80–100 fL',
  hct: '36–50%',
}

// Reference data for sources
const REFERENCE_DATA: Record<string, Reference> = {
  blood_pressure: {
    title: 'Blood Pressure Guideline (JNC 8)',
    excerpt:
      '"Blood pressure greater than or equal to 140/90 mmHg is considered hypertension and warrants lifestyle modification and/or pharmacological therapy..."',
    source: 'Joint National Committee on Hypertension, 2023',
  },
  fasting_sugar: {
    title: 'Diabetes Diagnosis Criteria (ADA)',
    excerpt:
      '"Fasting plasma glucose ≥ 126 mg/dL on two separate occasions confirms a diagnosis of diabetes mellitus. Values between 100–125 mg/dL indicate impaired fasting glucose..."',
    source: 'American Diabetes Association Standards of Care, 2024',
  },
  hba1c: {
    title: 'HbA1c Diagnostic Criteria (ADA)',
    excerpt:
      '"HbA1c ≥ 6.5% is diagnostic for diabetes. Values 5.7–6.4% indicate prediabetes..."',
    source: 'American Diabetes Association, 2024',
  },
  hemoglobin: {
    title: 'Anemia Reference Ranges (WHO)',
    excerpt:
      '"Anemia in adult males is defined as hemoglobin below 13.0 g/dL. Mild anemia ranges from 11.0–12.9 g/dL..."',
    source: 'World Health Organization Hemoglobin Concentrations, 2023',
  },
  cholesterol: {
    title: 'Cholesterol Reference (NCEP ATP III)',
    excerpt:
      '"LDL cholesterol ≥ 160 mg/dL is considered very high risk. Total cholesterol ≥ 240 mg/dL is high..."',
    source: 'National Cholesterol Education Program, 2022',
  },
  hdl: {
    title: 'HDL Cholesterol Reference (NCEP ATP III)',
    excerpt:
      '"HDL cholesterol < 40 mg/dL in men and < 50 mg/dL in women is a risk factor for heart disease..."',
    source: 'National Cholesterol Education Program, 2022',
  },
  ldl: {
    title: 'LDL Cholesterol Reference (NCEP ATP III)',
    excerpt:
      '"LDL cholesterol ≥ 160 mg/dL is considered very high risk..."',
    source: 'National Cholesterol Education Program, 2022',
  },
  triglycerides: {
    title: 'Triglycerides Reference (NCEP ATP III)',
    excerpt:
      '"Triglycerides ≥ 150 mg/dL are considered high. Levels ≥ 500 mg/dL increase pancreatitis risk..."',
    source: 'National Cholesterol Education Program, 2022',
  },
  creatinine: {
    title: 'Creatinine Reference (KDIGO)',
    excerpt:
      '"Serum creatinine reflects kidney function. Elevated levels may indicate renal impairment..."',
    source: 'Kidney Disease: Improving Global Outcomes, 2023',
  },
  urea: {
    title: 'Blood Urea Nitrogen Reference',
    excerpt:
      '"Elevated blood urea nitrogen (BUN) may indicate kidney dysfunction or dehydration..."',
    source: 'Clinical Laboratory Medicine, 2023',
  },
  sgot: {
    title: 'AST (SGOT) Reference (AASLD)',
    excerpt:
      '"Elevated AST levels are associated with liver damage, muscle injury, or cardiac conditions..."',
    source: 'American Association for the Study of Liver Diseases, 2023',
  },
  sgpt: {
    title: 'ALT (SGPT) Reference (AASLD)',
    excerpt:
      '"Elevated ALT is a marker of hepatocellular injury..."',
    source: 'American Association for the Study of Liver Diseases, 2023',
  },
  tsh: {
    title: 'TSH Reference (ATA)',
    excerpt:
      '"TSH is the primary screening test for thyroid dysfunction..."',
    source: 'American Thyroid Association, 2023',
  },
  ft3: {
    title: 'Free T3 Reference',
    excerpt:
      '"Free T3 measures the active thyroid hormone in circulation..."',
    source: 'Clinical Endocrinology, 2023',
  },
  ft4: {
    title: 'Free T4 Reference',
    excerpt:
      '"Free T4 is the primary test for evaluating thyroid function..."',
    source: 'Clinical Endocrinology, 2023',
  },
  sodium: {
    title: 'Sodium Reference',
    excerpt:
      '"Sodium imbalances can cause neurological symptoms..."',
    source: 'UpToDate, 2024',
  },
  potassium: {
    title: 'Potassium Reference',
    excerpt:
      '"Potassium abnormalities can cause cardiac arrhythmias..."',
    source: 'UpToDate, 2024',
  },
  chloride: {
    title: 'Chloride Reference',
    excerpt:
      '"Chloride is an electrolyte that helps maintain fluid balance..."',
    source: 'UpToDate, 2024',
  },
  wbc: {
    title: 'WBC Count Reference (CAP)',
    excerpt:
      '"White blood cell count is a key indicator of infection and inflammation..."',
    source: 'College of American Pathologists, 2023',
  },
  platelets: {
    title: 'Platelet Count Reference (CAP)',
    excerpt:
      '"Platelet count abnormalities may indicate bleeding disorders or infections..."',
    source: 'College of American Pathologists, 2023',
  },
}

// Generic recommendation for biomarkers not in RECOMMENDATIONS_MAP
const GENERIC_RECOMMENDATION =
  'Consult a healthcare professional regarding any abnormal values.'

// General recommendations shown when all biomarkers are normal
const NORMAL_RECOMMENDATIONS = [
  'Maintain a balanced diet.',
  'Continue regular physical activity.',
  'Repeat routine health checkups as advised.',
]

// Parameter-specific recommendations keyed by parameter name
const RECOMMENDATIONS_MAP: Record<string, string[]> = {
  blood_pressure: [
    'Monitor blood pressure regularly — target < 130/80 mmHg per current guidelines.',
    'Reduce sodium intake and increase potassium-rich foods to help lower blood pressure.',
  ],
  fasting_sugar: [
    'Repeat fasting glucose test and HbA1c for comprehensive diabetes assessment.',
    'Consider referral to an endocrinologist for further glucose monitoring.',
  ],
  glucose_ppbs: [
    'Post-prandial glucose reflects how your body handles carbohydrates after meals.',
    'Monitor glucose levels after meals to better manage diabetes.',
  ],
  hba1c: [
    'Monitor HbA1c levels quarterly to track long-term glucose control.',
    'Work with a healthcare provider to adjust diabetes management.',
  ],
  hemoglobin: [
    'Evaluate hemoglobin further with serum ferritin and peripheral blood smear.',
    'Consider iron studies to identify potential nutritional deficiency.',
  ],
  cholesterol: [
    'Follow a heart-healthy diet low in saturated fats and cholesterol.',
    "Consider statin therapy per your doctor's recommendation.",
  ],
  hdl: [
    'Increase physical activity — HDL can be raised through exercise.',
    'Consider replacing saturated fats with unsaturated fats in your diet.',
  ],
  ldl: [
    'Reduce saturated fat intake.',
    'Increase dietary fiber.',
    'Exercise at least 150 minutes per week.',
  ],
  triglycerides: [
    'Reduce intake of refined carbohydrates and sugars.',
    'Limit alcohol consumption and maintain a healthy weight.',
  ],
  tsh: [
    'If TSH is abnormal, further testing with Free T4 is recommended.',
    'Thyroid disorders may require hormone replacement or suppression therapy.',
  ],
  ft3: ['Thyroid hormone levels should be interpreted alongside TSH and Free T4.'],
  ft4: ['Free T4 is the best initial test for thyroid function assessment.'],
  sodium: [
    'Monitor fluid intake and review medications that affect sodium levels.',
  ],
  potassium: [
    'Review medications such as diuretics or ACE inhibitors that affect potassium.',
  ],
  creatinine: [
    'Monitor kidney function regularly if creatinine is elevated.',
    'Maintain adequate hydration and review nephrotoxic medications.',
  ],
  urea: [
    'Elevated urea may indicate dehydration or kidney impairment.',
    'Ensure adequate hydration and follow up with kidney function tests.',
  ],
  sgot: [
    'Avoid alcohol and review medications that may elevate liver enzymes.',
  ],
  sgpt: [
    'Avoid alcohol and review medications that may elevate liver enzymes.',
  ],
}

export const STATUS_TEXT: Record<string, string> = {
  high: 'above the normal range',
  low: 'below the normal range',
  normal: 'within the normal range',
  borderline: 'borderline',
  diabetes_range: 'in the diabetes range',
  prediabetes_range: 'in the prediabetes range',
  very_high: 'very high',
  near_optimal: 'is slightly above the optimal range',
}

export function mapApiResponseToAnalysisData(
  response: AnalyzeResponse,
): AnalysisData {
  const data: AnalyzeResponseData = response.data
  const extracted = data.extracted_values || {}
  const analysis: AnalysisResult = data.analysis || {}
  const summary: string = data.summary || ''
  const sources: string[] = data.sources || []

  console.log('[MAPPER] Mapping API response', { extracted, analysis, summary, sources })

  // Build findings dynamically from all extracted values
  const findings: Finding[] = []
  for (const key of Object.keys(extracted)) {
    const value = extracted[key]
    const status = analysis[key]
    if (status === undefined || value === undefined) continue

    const info = PARAMETER_INFO[key]
    if (!info) continue

    const uiStatus = STATUS_MAP[status] || 'normal'
    const valueStr = typeof value === 'string' ? value : String(value)

    findings.push({
      parameter: info.label,
      value: `${valueStr} ${info.unit}`,
      reference: REFERENCE_RANGES[key] || '',
      status: uiStatus,
    })
  }

  // Build references from sources, fall back to known references
  const references: Reference[] = []
  const usedKeys = new Set<string>()

  for (const source of sources) {
    const sourceBase = source.replace(/^knowledge_base\//, '').replace(/\.md$/, '')
    const ref = REFERENCE_DATA[sourceBase]
    if (ref) {
      references.push(ref)
      usedKeys.add(sourceBase)
    }
  }

  // Add references for abnormal findings not already covered by sources
  for (const key of Object.keys(analysis)) {
    const status = analysis[key]
    if (status && status !== 'normal') {
      const statusText = STATUS_MAP[status]
      if (statusText === 'normal') continue
      const ref = REFERENCE_DATA[key]
      if (ref && !usedKeys.has(key)) {
        references.push(ref)
        usedKeys.add(key)
      }
    }
  }

  // Build recommendations based on abnormal findings only
  const recommendations: string[] = []
  const usedRecs = new Set<string>()

  for (const key of Object.keys(analysis)) {
    const status = analysis[key]
    if (status && status !== 'normal') {
      const statusText = STATUS_MAP[status]
      if (statusText === 'normal') continue
      const recs = RECOMMENDATIONS_MAP[key]
      if (recs) {
        recs.forEach((r) => {
          if (!usedRecs.has(r)) {
            recommendations.push(r)
            usedRecs.add(r)
          }
        })
      } else {
        if (!usedRecs.has(GENERIC_RECOMMENDATION)) {
          recommendations.push(GENERIC_RECOMMENDATION)
          usedRecs.add(GENERIC_RECOMMENDATION)
        }
      }
    }
  }

  // If nothing was added, use general recommendations (all normal case)
  if (recommendations.length === 0) {
    recommendations.push(...NORMAL_RECOMMENDATIONS)
  }

  const analysisData: AnalysisData = {
    findings: findings.length > 0 ? findings : [],
    references: references.length > 0 ? references : [],
    recommendations: recommendations.length > 0 ? recommendations : NORMAL_RECOMMENDATIONS,
    summary: summary,
  }

  console.log('[MAPPER] Mapped analysis data', {
    findingsCount: analysisData.findings.length,
    referencesCount: analysisData.references.length,
    recommendationsCount: analysisData.recommendations.length,
  })

  return analysisData
}
