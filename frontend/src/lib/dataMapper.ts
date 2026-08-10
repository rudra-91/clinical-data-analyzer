import type { AnalyzeResponse, AnalyzeResponseData, AnalysisResult, ExtractedValues } from './api'
import type { AnalysisData, Finding, Reference } from './store'

// Map API analysis status to UI finding status
const STATUS_MAP: Record<string, 'high' | 'low' | 'normal'> = {
  high: 'high',
  low: 'low',
  normal: 'normal',
  diabetes_range: 'high',
  prediabetes_range: 'high',
  borderline: 'high',
}

// Reference data keyed by parameter name
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
}

// Recommendations keyed by parameter abnormal status
const RECOMMENDATIONS_MAP: Record<string, string[]> = {
  blood_pressure: [
    'Monitor blood pressure regularly — target < 130/80 mmHg per current guidelines.',
    'Reduce sodium intake and increase potassium-rich foods to help lower blood pressure.',
  ],
  fasting_sugar: [
    'Repeat fasting glucose test and HbA1c for comprehensive diabetes assessment.',
    'Consider referral to an endocrinologist for further glucose monitoring.',
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
    'Consider statin therapy per your doctor’s recommendation.',
  ],
}

// Parameter display names and units
const PARAMETER_INFO: Record<string, { label: string; unit: string; key: keyof ExtractedValues }> = {
  blood_pressure: { label: 'Blood Pressure', unit: 'mmHg', key: 'blood_pressure' },
  fasting_sugar: { label: 'Fasting Blood Sugar', unit: 'mg/dL', key: 'fasting_sugar' },
  hba1c: { label: 'HbA1c', unit: '%', key: 'hba1c' },
  hemoglobin: { label: 'Hemoglobin', unit: 'g/dL', key: 'hemoglobin' },
  cholesterol: { label: 'Total Cholesterol', unit: 'mg/dL', key: 'cholesterol' },
}

// Reference ranges for display
const REFERENCE_RANGES: Record<string, string> = {
  blood_pressure: '< 120/80 mmHg',
  fasting_sugar: '70–99 mg/dL',
  hba1c: '< 5.7%',
  hemoglobin: '13.5–17.5 g/dL',
  cholesterol: '< 200 mg/dL',
}

const DEFAULT_RECOMMENDATIONS = [
  'Consult a healthcare professional regarding any abnormal values.',
  'Maintain a heart-healthy diet, regular physical activity, and adequate sleep.',
  'Monitor lab values on your next routine check-up.',
]

export function mapApiResponseToAnalysisData(
  response: AnalyzeResponse,
): AnalysisData {
  const data: AnalyzeResponseData = response.data
  const extracted = data.extracted_values || {}
  const analysis: AnalysisResult = data.analysis || {}
  const summary: string = data.summary || ''
  const sources: string[] = data.sources || []

  console.log('[MAPPER] Mapping API response', { extracted, analysis, summary, sources })

  // Build findings
  const findings: Finding[] = []
  for (const [key, info] of Object.entries(PARAMETER_INFO)) {
    const value = extracted[info.key]
    const status = analysis[key as keyof AnalysisResult]
    if (status === undefined || value === undefined) continue

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

  // Add any references not already included
  for (const [key, ref] of Object.entries(REFERENCE_DATA)) {
    if (!usedKeys.has(key) && findings.some((f) => f.parameter === ref.title.split('(')[0].trim())) {
      references.push(ref)
      usedKeys.add(key)
    }
  }

  // Build recommendations based on abnormal findings
  const recommendations: string[] = []
  const usedParams = new Set<string>()

  for (const key of Object.keys(PARAMETER_INFO)) {
    const status = analysis[key as keyof AnalysisResult]
    if (status && status !== 'normal' && STATUS_MAP[status] !== 'normal') {
      const recs = RECOMMENDATIONS_MAP[key]
      if (recs) {
        recs.forEach((r) => {
          if (!usedParams.has(r)) {
            recommendations.push(r)
            usedParams.add(r)
          }
        })
      }
    }
  }

  // Always include general recommendations
  DEFAULT_RECOMMENDATIONS.forEach((r) => {
    if (!usedParams.has(r)) {
      recommendations.push(r)
      usedParams.add(r)
    }
  })

  const analysisData: AnalysisData = {
    findings: findings.length > 0 ? findings : [],
    references: references.length > 0 ? references : [],
    recommendations: recommendations.length > 0 ? recommendations : DEFAULT_RECOMMENDATIONS,
    summary: summary,
  }

  console.log('[MAPPER] Mapped analysis data', {
    findingsCount: analysisData.findings.length,
    referencesCount: analysisData.references.length,
    recommendationsCount: analysisData.recommendations.length,
  })

  return analysisData
}
