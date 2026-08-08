import type { Page } from '../App'

interface Props {
  navigate: (p: Page) => void
}

const features = [
  {
    icon: '📄',
    title: 'Upload Clinical Reports',
    desc: 'Supports standard PDF laboratory reports from major diagnostic providers.',
    accent: 'bg-blue-50',
  },
  {
    icon: '🧠',
    title: 'AI Clinical Analysis',
    desc: 'Detects values that are above or below common reference ranges automatically.',
    accent: 'bg-violet-50',
  },
  {
    icon: '📚',
    title: 'Medical Knowledge (RAG)',
    desc: 'Uses trusted medical reference documents to explain findings in context.',
    accent: 'bg-teal-50',
  },
  {
    icon: '📊',
    title: 'Structured Report',
    desc: 'Generates a clean, readable clinical summary with actionable next steps.',
    accent: 'bg-sky-50',
  },
]

const steps = [
  { n: '01', title: 'Upload Report', desc: 'Select your PDF laboratory report' },
  { n: '02', title: 'Extract Values', desc: 'AI reads and parses lab measurements' },
  { n: '03', title: 'AI + RAG Analysis', desc: 'Cross-references medical guidelines' },
  { n: '04', title: 'Summary Generated', desc: 'Receive your clinical overview' },
]

export default function LandingPage({ navigate }: Props) {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-white">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'radial-gradient(circle at center, #1a6fd4 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />
        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-24 grid md:grid-cols-2 gap-12 items-center">
          <div className="animate-fade-up">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold mb-6 tracking-wide uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              AI-Powered Analysis
            </div>
            <h1
              className="text-5xl md:text-[56px] font-normal leading-[1.1] text-slate-900 mb-6"
              style={{ fontFamily: 'Instrument Serif, Georgia, serif' }}
            >
              AI-Powered
              <br />
              <span className="text-[#1a6fd4]">Clinical Report</span>
              <br />
              Analysis
            </h1>
            <p className="text-slate-600 text-lg leading-relaxed mb-8 max-w-md">
              Upload a laboratory report and receive an AI-generated summary of abnormal findings,
              explanations based on medical reference guidelines, and an easy-to-understand
              clinical overview.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => navigate('upload')}
                className="px-6 py-3 bg-[#1a6fd4] text-white font-semibold rounded-xl hover:bg-[#1558b0] transition-all duration-150 shadow-md hover:shadow-lg"
              >
                Upload Report
              </button>
              <button
                onClick={() => {
                  document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="px-6 py-3 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:border-slate-300 hover:bg-slate-50 transition-all duration-150"
              >
                Learn More
              </button>
            </div>
          </div>

          {/* Hero illustration */}
          <div className="relative hidden md:block">
            <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-blue-50 to-sky-50 opacity-60" />
            <div className="relative rounded-2xl overflow-hidden shadow-xl border border-blue-100">
              <img
                src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=640&h=480&fit=crop&auto=format"
                alt="Doctor reviewing digital medical reports with AI assistance"
                className="w-full h-72 object-cover"
              />
              {/* Overlay card */}
              <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur rounded-xl p-4 shadow-lg border border-blue-50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#1a6fd4] flex items-center justify-center text-white text-lg flex-shrink-0">
                    🧠
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">AI Analysis Complete</p>
                    <p className="text-sm font-semibold text-slate-900">3 findings detected · Report ready</p>
                  </div>
                  <span className="ml-auto flex items-center gap-1 text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Done
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats strip */}
      <section className="bg-[#1a6fd4] py-10">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: '< 20s', label: 'Analysis time' },
            { value: '99%', label: 'Extraction accuracy' },
            { value: '50+', label: 'Lab parameters' },
            { value: 'RAG', label: 'Medical guidelines' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-bold text-white mb-1">{s.value}</p>
              <p className="text-blue-200 text-sm">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 bg-[#f8fafc]">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-[#1a6fd4] text-sm font-semibold uppercase tracking-widest mb-3">Capabilities</p>
            <h2
              className="text-4xl font-normal text-slate-900 mb-4"
              style={{ fontFamily: 'Instrument Serif, Georgia, serif' }}
            >
              What the platform does
            </h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              A complete AI-powered pipeline from raw PDF to structured clinical insights.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f) => (
              <div
                key={f.title}
                className="bg-white rounded-2xl p-6 border border-slate-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className={`w-11 h-11 rounded-xl ${f.accent} flex items-center justify-center text-2xl mb-4`}>
                  {f.icon}
                </div>
                <h3 className="font-semibold text-slate-900 mb-2 text-[15px]">{f.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-14">
            <p className="text-[#1a6fd4] text-sm font-semibold uppercase tracking-widest mb-3">Workflow</p>
            <h2
              className="text-4xl font-normal text-slate-900 mb-4"
              style={{ fontFamily: 'Instrument Serif, Georgia, serif' }}
            >
              How it works
            </h2>
          </div>
          {/* Timeline */}
          <div className="grid md:grid-cols-4 gap-0">
            {steps.map((step, i) => (
              <div key={step.n} className="relative flex flex-col items-center text-center px-4">
                {/* Connector line */}
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-9 left-1/2 w-full h-px bg-gradient-to-r from-blue-200 to-blue-100 z-0" />
                )}
                <div className="relative z-10 w-16 h-16 rounded-full bg-[#1a6fd4] flex flex-col items-center justify-center mb-4 shadow-md">
                  <span className="text-blue-200 text-[10px] font-bold tracking-widest">{step.n}</span>
                </div>
                <h4 className="font-semibold text-slate-900 mb-1.5 text-sm">{step.title}</h4>
                <p className="text-slate-500 text-xs leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center mt-16">
            <button
              onClick={() => navigate('upload')}
              className="px-8 py-3.5 bg-[#1a6fd4] text-white font-semibold rounded-xl hover:bg-[#1558b0] transition-all duration-150 shadow-md hover:shadow-lg text-base"
            >
              Try it now — Upload a Report
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
