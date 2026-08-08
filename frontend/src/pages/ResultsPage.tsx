import { useState } from 'react'
import type { Page } from '../App'
import StatusBadge from '../components/StatusBadge'

interface Props {
  navigate: (p: Page) => void
}

const findings = [
  {
    parameter: 'Blood Pressure',
    value: '150/95 mmHg',
    reference: '< 120/80 mmHg',
    status: 'high' as const,
  },
  {
    parameter: 'Fasting Blood Sugar',
    value: '168 mg/dL',
    reference: '70–99 mg/dL',
    status: 'high' as const,
  },
  {
    parameter: 'Hemoglobin',
    value: '10.8 g/dL',
    reference: '13.5–17.5 g/dL',
    status: 'low' as const,
  },
  {
    parameter: 'Total Cholesterol',
    value: '192 mg/dL',
    reference: '< 200 mg/dL',
    status: 'normal' as const,
  },
]

const references = [
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

const recommendations = [
  'Consult a healthcare professional regarding your blood pressure and blood sugar levels.',
  'Monitor blood pressure regularly — target < 130/80 mmHg per current guidelines.',
  'Repeat fasting glucose test and HbA1c for comprehensive diabetes assessment.',
  'Evaluate hemoglobin further with serum ferritin and peripheral blood smear.',
  'Maintain a heart-healthy diet, regular physical activity, and adequate sleep.',
]

export default function ResultsPage({ navigate }: Props) {
  const [expandedRef, setExpandedRef] = useState<number | null>(0)

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
            <button className="flex items-center gap-2 px-4 py-2.5 bg-[#1a6fd4] text-white text-sm font-semibold rounded-xl hover:bg-[#1558b0] transition-colors shadow-sm">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Download PDF
            </button>
            <button
              onClick={() => navigate('upload')}
              className="px-4 py-2.5 border border-slate-200 text-slate-600 text-sm font-semibold rounded-xl hover:border-slate-300 hover:bg-white transition-all"
            >
              Analyze Another
            </button>
          </div>
        </div>

        {/* Patient Summary */}
        <section className="bg-white rounded-2xl border border-slate-200 p-6 mb-5 shadow-sm">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-[13px] font-semibold text-slate-500 uppercase tracking-wide mb-1">Overall Status</h2>
              <StatusBadge status="attention" />
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-xl flex-shrink-0">⚠️</div>
          </div>
          <p className="text-slate-700 leading-relaxed text-sm">
            This report reveals three out-of-range laboratory values: elevated blood pressure consistent with Stage 1 hypertension,
            fasting blood glucose in the diabetic range, and hemoglobin below the reference minimum suggesting mild anemia.
            Total cholesterol falls within the acceptable range. These findings warrant prompt follow-up with a licensed healthcare provider.
          </p>
        </section>

        {/* Abnormal Findings */}
        <section className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900 mb-3">Abnormal Findings</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            {findings.map((f) => (
              <div
                key={f.parameter}
                className={`bg-white rounded-2xl border p-5 shadow-sm transition-shadow hover:shadow-md ${
                  f.status === 'high'
                    ? 'border-red-100'
                    : f.status === 'low'
                      ? 'border-blue-100'
                      : 'border-emerald-100'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-3">
                  <h3 className="font-semibold text-slate-900 text-sm">{f.parameter}</h3>
                  <StatusBadge status={f.status} />
                </div>
                <p className={`text-2xl font-bold mb-0.5 ${
                  f.status === 'high' ? 'text-red-600' : f.status === 'low' ? 'text-blue-600' : 'text-emerald-600'
                }`}>
                  {f.value}
                </p>
                <p className="text-xs text-slate-400">Reference: {f.reference}</p>
                {/* Bar indicator */}
                <div className="mt-3 h-1 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      f.status === 'high' ? 'bg-red-400 w-4/5' : f.status === 'low' ? 'bg-blue-400 w-2/5' : 'bg-emerald-400 w-3/5'
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
          <p className="text-slate-700 leading-relaxed text-sm mb-3">
            Your results indicate a combination of cardiovascular and metabolic risk factors. The elevated blood pressure reading
            of 150/95 mmHg exceeds the hypertension threshold defined by major cardiology guidelines and increases the risk of
            stroke and heart disease if left unmanaged.
          </p>
          <p className="text-slate-700 leading-relaxed text-sm mb-3">
            The fasting blood sugar of 168 mg/dL is above the diabetic cutoff of 126 mg/dL, suggesting impaired glucose metabolism.
            A confirmatory test and HbA1c measurement are recommended to establish a formal diagnosis.
          </p>
          <p className="text-slate-700 leading-relaxed text-sm">
            The hemoglobin level of 10.8 g/dL indicates mild anemia, which may cause fatigue, reduced exercise capacity, and
            increased cardiovascular strain. Further investigation into the underlying cause — nutritional deficiency, chronic
            disease, or blood loss — is advised.
          </p>
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
