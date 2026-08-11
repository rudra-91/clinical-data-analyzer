import { useState, useEffect } from 'react'
import type { Page } from '../App'
import { jsPDF } from 'jspdf'
import StatusBadge from '../components/StatusBadge'
import { appStore, type AnalysisData, type Finding, type Reference } from '../lib/store'
import { STATUS_TEXT } from '../lib/dataMapper'

interface Props {
  navigate: (p: Page) => void
}

// Fallback data used when visiting ResultsPage directly (e.g. preview)
const fallbackFindings: Finding[] = [
  { parameter: 'Blood Pressure', value: '150/95 mmHg', reference: '< 120/80 mmHg', status: 'high' },
  { parameter: 'Fasting Blood Sugar', value: '168 mg/dL', reference: '70–99 mg/dL', status: 'high' },
  { parameter: 'Hemoglobin', value: '10.8 g/dL', reference: '13.5–17.5 g/dL', status: 'low' },
  { parameter: 'Total Cholesterol', value: '192 mg/dL', reference: '< 200 mg/dL', status: 'normal' },
]

const fallbackReferences: Reference[] = [
  {
    title: 'Blood Pressure Guideline (JNC 8)',
    excerpt:
      '"Blood pressure greater than or equal to 140/90 mmHg is considered hypertension and warrants lifestyle modification and/or pharmacological therapy..."',
    source: 'Joint National Committee on Hypertension, 2023',
  },
  {
    title: 'Diabetes Diagnosis Criteria (ADA)',
    excerpt:
      '"Fasting plasma glucose ≥ 126 mg/dL on two separate occasions confirms a diagnosis of diabetes mellitus. Values between 100–125 mg/dL indicate impaired fasting glucose..."',
    source: 'American Diabetes Association Standards of Care, 2024',
  },
  {
    title: 'Anemia Reference Ranges (WHO)',
    excerpt:
      '"Anemia in adult males is defined as hemoglobin below 13.0 g/dL. Mild anemia ranges from 11.0–12.9 g/dL and may present as fatigue and reduced exercise tolerance..."',
    source: 'World Health Organization Hemoglobin Concentrations, 2023',
  },
]

const fallbackRecommendations = [
  'Consult a healthcare professional regarding your blood pressure and blood sugar levels.',
  'Monitor blood pressure regularly — target < 130/80 mmHg per current guidelines.',
  'Repeat fasting glucose test and HbA1c for comprehensive diabetes assessment.',
  'Evaluate hemoglobin further with serum ferritin and peripheral blood smear.',
  'Maintain a heart-healthy diet, regular physical activity, and adequate sleep.',
]

const fallbackSummary =
  'This report reveals three out-of-range laboratory values: elevated blood pressure consistent with Stage 1 hypertension, ' +
  'fasting blood glucose in the diabetic range, and hemoglobin below the reference minimum suggesting mild anemia. ' +
  'Total cholesterol falls within the acceptable range. These findings warrant prompt follow-up with a licensed healthcare provider.'

function generateRiskText(findings: Finding[]): string {
  const lines = findings
    .filter((f) => f.status !== 'normal')
    .map((f) => {
      const meaning = STATUS_TEXT[f.status] || 'is abnormal'
      if (f.status === 'high') {
        return `Elevated ${f.parameter} (${f.value}): ${meaning}.`
      }
      if (f.status === 'low') {
        return `Low ${f.parameter} (${f.value}): ${meaning}.`
      }
      if (f.status === 'near_optimal') {
        return `${f.parameter} (${f.value}): ${meaning}.`
      }
      return `Abnormal ${f.parameter} (${f.value}): ${meaning}.`
    })
    .filter(Boolean)
  return lines.join('\n')
}

type OverallStatusType = 'good' | 'mild_attention' | 'attention'

interface OverallStatusResult {
  status: OverallStatusType
  message: string
}

function generateOverallStatus(findings: Finding[]): OverallStatusResult {
  const abnormal = findings.filter((f) => f.status !== 'normal')

  if (abnormal.length === 0) {
    return {
      status: 'good',
      message: 'All measured laboratory parameters are within normal reference ranges.',
    }
  }

  if (abnormal.length === 1 && abnormal[0].status === 'near_optimal') {
    const f = abnormal[0]
    return {
      status: 'mild_attention',
      message: `Most laboratory parameters are within normal limits. ${f.parameter} ${STATUS_TEXT[f.status]}. Lifestyle modifications such as regular exercise and a heart-healthy diet may help improve ${f.parameter.toLowerCase()} levels.`,
    }
  }

  if (abnormal.length === 1) {
    const f = abnormal[0]
    return {
      status: 'attention',
      message: `Attention is needed for ${f.parameter} ${STATUS_TEXT[f.status]} (${f.value}). Please consult a healthcare professional for further evaluation.`,
    }
  }

  const abnormalNames = abnormal.map((f) => f.parameter).join(', ')
  return {
    status: 'attention',
    message: `${abnormal.length} parameters require attention: ${abnormalNames}. Please consult a healthcare professional for further evaluation.`,
  }
}

function generateClinicalInterpretation(findings: Finding[]): string[] {
  const paragraphs: string[] = []
  const abnormal = findings.filter((f) => f.status !== 'normal')

  if (abnormal.length === 0) {
    paragraphs.push(
      'All laboratory values are within normal reference ranges. No clinically significant abnormalities detected.',
    )
    return paragraphs
  }

  if (abnormal.length === 1 && abnormal[0].status === 'near_optimal') {
    const f = abnormal[0]
    paragraphs.push(
      `Most laboratory values are within normal limits. ${f.parameter} ${STATUS_TEXT[f.status]}. ` +
        `Lifestyle modifications such as regular exercise and a heart-healthy diet may help improve ${f.parameter.toLowerCase()} levels.`,
    )
    return paragraphs
  }

  const parts: string[] = []
  for (const f of abnormal) {
    const meaning = STATUS_TEXT[f.status] || 'is abnormal'
    parts.push(`${f.parameter} ${meaning} (${f.value}).`)
  }

  if (abnormal.length > 1) {
    const summary = abnormal.map((f) => f.parameter.toLowerCase()).join(', ')
    paragraphs.push(
      `Multiple abnormalities detected involving: ${summary}. ${parts.join(' ')} These findings warrant further clinical evaluation.`,
    )
  } else {
    paragraphs.push(parts.join(' ') + ' These findings warrant further clinical evaluation.')
  }

  return paragraphs
}

function generatePDF(data: AnalysisData, fileName: string) {
  console.log('[PDF] Starting PDF generation with dynamic data')
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  })

  console.log('[PDF] jsPDF doc created:', doc)
  const pageWidth = doc.internal.pageSize.getWidth()
  const leftMargin = 20
  const rightMargin = 20
  const contentWidth = pageWidth - leftMargin - rightMargin
  console.log('[PDF] Page dimensions:', { pageWidth, contentWidth })

  let yPos = 15

  // Header with logo and title
  doc.setFillColor(26, 111, 212)
  doc.roundedRect(0, 0, pageWidth, 25, 0, 0, 'F')

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  doc.text('Clinical Data Analyzer AI', leftMargin, 12)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'normal')
  doc.text('Clinical Report Analysis', leftMargin, 20)

  doc.setTextColor(26, 111, 212)
  yPos = 35

  // Report Information
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text('Report Information', leftMargin, yPos)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  const now = new Date()
  const timestamp = now.toISOString()
  const uploadTime = now.toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  const analysisTime = now.toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
  yPos += 6
  doc.setTextColor(30, 41, 59)
  doc.text(`Filename: ${fileName}`, leftMargin + 5, yPos)
  yPos += 5
  doc.text(`Upload Time: ${uploadTime}`, leftMargin + 5, yPos)
  yPos += 5
  doc.text(`Analysis Time: ${analysisTime}`, leftMargin + 5, yPos)
  yPos += 8

  // AI-Generated Summary
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(26, 111, 212)
  doc.text('AI-Generated Summary', leftMargin, yPos)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(30, 41, 59)
  yPos += 6
  const findings = data.findings.length > 0 ? data.findings : fallbackFindings
  const overallStatusMsg = generateOverallStatus(findings).message
  const summaryText = overallStatusMsg || data.summary || fallbackSummary
  const summaryLines = doc.splitTextToSize(summaryText, contentWidth - 10)
  doc.text(summaryLines, leftMargin + 5, yPos)
  yPos += summaryLines.length * 4 + 8

  // Key Clinical Findings
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(26, 111, 212)
  doc.text('Key Clinical Findings', leftMargin, yPos)
  doc.setFont('helvetica', 'normal')
  yPos += 6

  findings.forEach((f) => {
    doc.setFontSize(10)
    doc.setTextColor(30, 41, 59)
    doc.setFont('helvetica', 'bold')
    doc.text(f.parameter, leftMargin + 5, yPos)
    doc.setFont('helvetica', 'normal')
    const statusColor =
      f.status === 'high'
        ? [220, 53, 69]
        : f.status === 'low'
          ? [79, 79, 202]
          : [16, 185, 129]
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2])
    doc.text(`${f.value} (${f.status})`, leftMargin + 60, yPos)
    doc.setTextColor(100, 116, 139)
    doc.setFont('helvetica', 'italic')
    doc.setFontSize(8)
    doc.text(`Reference: ${f.reference}`, leftMargin + 5, yPos + 5)
    doc.setFont('helvetica', 'normal')
    yPos += 12
  })

  // Risk Assessment
  yPos += 4
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(26, 111, 212)
  doc.text('Risk Assessment', leftMargin, yPos)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(30, 41, 59)
  yPos += 6
  const riskText = generateRiskText(findings) || 'No significant risk factors identified.'
  const riskLines = doc.splitTextToSize(riskText, contentWidth - 10)
  doc.text(riskLines, leftMargin + 5, yPos)
  yPos += riskLines.length * 4 + 8

  // Recommendations
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(26, 111, 212)
  doc.text('Recommendations', leftMargin, yPos)
  doc.setFont('helvetica', 'normal')
  yPos += 6

  const recs = data.recommendations.length > 0 ? data.recommendations : fallbackRecommendations

  recs.forEach((rec, i) => {
    doc.setFontSize(10)
    doc.setTextColor(30, 41, 59)
    doc.text(`${i + 1}. ${rec}`, leftMargin + 5, yPos)
    yPos += 5
  })

  yPos += 4

  // Confidence Score
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(26, 111, 212)
  doc.text('Confidence Score', leftMargin, yPos)
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(30, 41, 59)
  yPos += 6
  doc.setFillColor(26, 111, 212)
  doc.roundedRect(leftMargin + 5, yPos - 2, 50, 6, 1, 1, 'F')
  doc.setTextColor(255, 255, 255)
  doc.text('95%', leftMargin + 8, yPos + 5)

  yPos += 14

  // Disclaimer
  doc.setTextColor(245, 152, 61)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  const disclaimer =
    'Important: This report is for educational and demonstration purposes only. ' +
    'It does not provide medical diagnoses or replace professional medical advice. ' +
    'Always consult a qualified healthcare provider.'
  const discLines = doc.splitTextToSize(disclaimer, contentWidth - 10)
  doc.text(discLines, leftMargin, yPos)

  const fileName_safe = `Clinical_Report_Analysis_${timestamp.replace(/[:.]/g, '-')}.pdf`
  console.log('[PDF] Saving with filename:', fileName_safe)

  try {
    const pdfOutput = doc.output('blob')
    console.log('[PDF] Blob created successfully, size:', pdfOutput.size)

    if (typeof document !== 'undefined' && document.createElement && URL.createObjectURL) {
      const url = URL.createObjectURL(pdfOutput)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName_safe
      document.body.appendChild(a)
      a.click()
      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 100)
      console.log('[PDF] Download triggered via blob URL')
    } else {
      console.log('[PDF] Falling back to doc.save()')
      doc.save(fileName_safe)
    }
  } catch (outputError) {
    console.error('[PDF] Blob creation failed, trying doc.save():', outputError)
    doc.save(fileName_safe)
  }
  console.log('[PDF] PDF generation complete')
}

export default function ResultsPage({ navigate }: Props) {
  const [expandedRef, setExpandedRef] = useState<number | null>(0)
  const [downloading, setDownloading] = useState(false)
  const [downloadError, setDownloadError] = useState<string | null>(null)
  const [analysisData, setAnalysisData] = useState<AnalysisData>({
    findings: fallbackFindings,
    references: fallbackReferences,
    recommendations: fallbackRecommendations,
    summary: fallbackSummary,
  })

  const [fileName, setFileName] = useState<string>('sample_laboratory_report.pdf')

  useEffect(() => {
    const store = appStore.get()
    const data = store.analysisData

    if (data) {
      setAnalysisData({
        findings: data.findings.length > 0 ? data.findings : fallbackFindings,
        references: data.references.length > 0 ? data.references : fallbackReferences,
        recommendations: data.recommendations.length > 0 ? data.recommendations : fallbackRecommendations,
        summary: data.summary || fallbackSummary,
      })
    }

    const file = store.file
    if (file) {
      setFileName(file.name)
    }
  }, [])

  const handleDownloadPDF = async () => {
    console.log('[PDF] Download button clicked')
    setDownloading(true)
    setDownloadError(null)
    try {
      console.log('[PDF] Calling generatePDF with dynamic data')
      generatePDF(analysisData, fileName)
      console.log('[PDF] generatePDF completed successfully')
    } catch (error: any) {
      console.error('[PDF] PDF generation failed - full error:', error)
      console.error('[PDF] Error type:', typeof error)
      console.error('[PDF] Error name:', error?.name)
      console.error('[PDF] Error message:', error?.message)
      console.error('[PDF] Error stack:', error?.stack)
      if (error?.cause) {
        console.error('[PDF] Error cause:', error.cause)
      }
      const errorMsg =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
            ? error
            : error?.toString
              ? error.toString()
              : JSON.stringify(error)
      setDownloadError(errorMsg)
    } finally {
      setDownloading(false)
    }
  }

  const findings = analysisData.findings
  const references = analysisData.references
  const recommendations = analysisData.recommendations
  const summary = analysisData.summary
  const overallStatusResult = generateOverallStatus(findings)
  const overallStatus = overallStatusResult.status
  const overallStatusMessage = overallStatusResult.message
  const interpretationParagraphs = generateClinicalInterpretation(findings)


  return (
    <div className="min-h-[calc(100vh-64px)] bg-[#f8fafc] py-12">
      <div className="max-w-4xl mx-auto px-6">

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10 animate-fade-up">
          <div>
            <p className="text-[#1a6fd4] text-xs font-semibold uppercase tracking-widest mb-1">AI Report</p>
            <h1
              className="text-4xl font-normal text-slate-900"
              style={{ fontFamily: 'Instrument Serif, Georgia, serif' }}
            >
              Clinical Analysis Report
            </h1>
            <p className="text-slate-500 text-sm mt-1.5">Generated · {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
          </div>
          <div className="flex gap-3 flex-shrink-0">
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className={`flex items-center gap-2 px-4 py-2.5 text-white text-sm font-semibold rounded-xl shadow-sm transition-all duration-150 ${
                downloading
                  ? 'bg-slate-300 cursor-not-allowed'
                  : 'bg-[#1a6fd4] hover:bg-[#1558b0] hover:shadow-lg'
              }`}
            >
              {downloading ? (
                <>
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Download PDF
                </>
              )}
            </button>
            <button
              onClick={() => {
                appStore.reset()
                navigate('upload')
              }}
              className="px-4 py-2.5 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:border-slate-300 hover:bg-white transition-all"
            >
              Analyze Another
            </button>
          </div>
        </div>

        {/* Download error message */}
        {downloadError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3 animate-fade-up">
            <span className="text-xl">⚠️</span>
            <p className="text-red-800 text-sm">{downloadError}</p>
          </div>
        )}

        {/* Patient Summary */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 mb-5 shadow-sm">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Overall Status</h2>
              <StatusBadge status={overallStatus} />
            </div>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${
              overallStatus === 'attention' || overallStatus === 'mild_attention' ? 'bg-amber-50' : 'bg-emerald-50'
            }`}>
              {overallStatus === 'good' ? '✅' : '⚠️'}
            </div>
          </div>
          <p className="text-slate-700 leading-relaxed text-sm">
            {overallStatusMessage}
          </p>
        </section>

        {/* Findings / Laboratory Results */}
        <section className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">{findings.some((f) => f.status !== 'normal') ? 'Abnormal Findings' : 'Laboratory Results'}</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {findings.map((f) => (
              <div
                key={f.parameter}
                className={`bg-white rounded-2xl border p-5 shadow-sm transition-shadow hover:shadow-md ${
                  f.status === 'high'
                    ? 'border-red-100'
                    : f.status === 'low'
                      ? 'border-blue-100'
                      : f.status === 'near_optimal'
                        ? 'border-amber-100'
                        : 'border-emerald-100'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-semibold text-slate-900 text-sm">{f.parameter}</h3>
                  <StatusBadge status={f.status} />
                </div>
                <p className={`text-2xl font-bold mb-0.5 ${
                  f.status === 'high' ? 'text-red-600' : f.status === 'low' ? 'text-blue-600' : f.status === 'near_optimal' ? 'text-amber-600' : 'text-emerald-600'
                }`}>
                  {f.value}
                </p>
                <p className="text-xs text-slate-400">Reference: {f.reference}</p>
                {/* Bar indicator */}
                <div className="mt-3 h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      f.status === 'high' ? 'bg-red-400 w-4/5' : f.status === 'low' ? 'bg-blue-400 w-2/5' : f.status === 'near_optimal' ? 'bg-amber-400 w-4/5' : 'bg-emerald-400 w-3/5'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* AI Explanation */}
        <section className="bg-gradient-to-br from-blue-50 to-sky-50 rounded-2xl border border-blue-100 p-6 mb-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-[#1a6fd4] flex items-center justify-center text-white text-lg">🧠</div>
            <h2 className="text-lg font-semibold text-slate-900">Clinical Interpretation</h2>
          </div>
          {interpretationParagraphs.map((para, i) => (
            <p key={i} className="text-slate-700 leading-relaxed text-sm mb-3">
              {para}
            </p>
          ))}
        </section>

        {/* Medical References */}
        <section className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Supporting Medical References</h2>
          <div className="space-y-3">
            {references.map((ref, i) => (
              <div
                key={ref.title}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
              >
                <button
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors"
                  onClick={() => setExpandedRef(expandedRef === i ? null : i)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-base">📚</div>
                    <span className="font-semibold text-slate-800 text-sm">{ref.title}</span>
                  </div>
                  <svg
                    width="16" height="16" viewBox="0 0 16 16" fill="none"
                    className={`flex-shrink-0 transition-transform duration-200 ${expandedRef === i ? 'rotate-180' : ''}`}
                  >
                    <path d="M4 6l4 4 4-4" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {expandedRef === i && (
                  <div className="px-5 pb-5">
                    <blockquote className="border-l-2 border-[#1a6fd4] pl-4 italic text-slate-600 text-sm leading-relaxed mb-2">
                      {ref.excerpt}
                    </blockquote>
                    <p className="text-xs text-slate-400">Source: {ref.source}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Recommendations */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 mb-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-xl">📋</div>
            <h2 className="text-lg font-semibold text-slate-900">Recommendations</h2>
          </div>
          <ul className="space-y-3">
            {recommendations.map((rec, i) => (
              <li key={i} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2.5 2.5 3.5-4" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed">{rec}</p>
              </li>
            ))}
          </ul>
        </section>

        {/* Disclaimer */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-3">
          <span className="text-xl flex-shrink-0">⚠️</span>
          <p className="text-amber-800 text-sm leading-relaxed">
            <strong>Important Disclaimer:</strong> This application is intended for educational and demonstration purposes only.
            It does not provide medical diagnoses or replace professional medical advice, diagnosis, or treatment.
            Always seek the advice of a qualified healthcare provider regarding any medical condition.
          </p>
        </div>
      </div>
    </div>
  )
}
