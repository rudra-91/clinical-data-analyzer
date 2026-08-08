import { useEffect, useState } from 'react'
import type { Page } from '../App'

interface Props {
  navigate: (p: Page) => void
}

const steps = [
  { label: 'Extracting text from PDF', delay: 800 },
  { label: 'Detecting laboratory values', delay: 2000 },
  { label: 'Retrieving medical guidelines', delay: 3200 },
  { label: 'Generating AI summary', delay: 4800 },
]

export default function ProcessingPage({ navigate }: Props) {
  const [completed, setCompleted] = useState<number[]>([])
  const [done, setDone] = useState(false)

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []

    steps.forEach((step, i) => {
      timers.push(setTimeout(() => {
        setCompleted((prev) => [...prev, i])
      }, step.delay))
    })

    timers.push(setTimeout(() => {
      setDone(true)
    }, 6200))

    timers.push(setTimeout(() => {
      navigate('results')
    }, 7000))

    return () => timers.forEach(clearTimeout)
  }, [navigate])

  const progress = (completed.length / steps.length) * 100

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md text-center animate-fade-up">
        {/* Spinner */}
        <div className="relative w-28 h-28 mx-auto mb-8">
          {/* Pulse rings */}
          <div
            className="absolute inset-0 rounded-full border-4 border-blue-100 animate-pulse-ring"
            style={{ animationDelay: '0s' }}
          />
          <div
            className="absolute inset-2 rounded-full border-4 border-blue-200 animate-pulse-ring"
            style={{ animationDelay: '0.4s' }}
          />
          {/* Spinning arc */}
          <svg
            className="absolute inset-0 w-full h-full animate-spin-slow"
            viewBox="0 0 112 112"
          >
            <circle
              cx="56" cy="56" r="50"
              fill="none"
              stroke="#1a6fd4"
              strokeWidth="4"
              strokeDasharray="314"
              strokeDashoffset={314 - (314 * progress) / 100}
              strokeLinecap="round"
              transform="rotate(-90 56 56)"
              style={{ transition: 'stroke-dashoffset 0.6s ease' }}
            />
          </svg>
          {/* Center icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl">{done ? '✅' : '🧠'}</span>
          </div>
        </div>

        <h1 className="text-2xl font-semibold text-slate-900 mb-2">
          {done ? 'Analysis Complete!' : 'Analyzing Clinical Report...'}
        </h1>
        <p className="text-slate-500 text-sm mb-8">
          {done ? 'Preparing your report...' : 'Estimated time: 10–20 seconds'}
        </p>

        {/* Progress bar */}
        <div className="h-1.5 bg-slate-100 rounded-full mb-8 overflow-hidden">
          <div
            className="h-full bg-[#1a6fd4] rounded-full transition-all duration-700 ease-out"
            style={{ width: `${done ? 100 : progress}%` }}
          />
        </div>

        {/* Steps */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 text-left space-y-4">
          {steps.map((step, i) => {
            const isComplete = completed.includes(i)
            const isActive = !isComplete && completed.length === i
            return (
              <div
                key={step.label}
                className={`flex items-center gap-3 transition-opacity duration-300 ${
                  !isComplete && !isActive ? 'opacity-40' : 'opacity-100'
                }`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
                  isComplete
                    ? 'bg-emerald-100 text-emerald-600'
                    : isActive
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-slate-100 text-slate-400'
                }`}>
                  {isComplete ? (
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : isActive ? (
                    <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                  )}
                </div>
                <span className={`text-sm font-medium ${
                  isComplete ? 'text-emerald-700' : isActive ? 'text-blue-700' : 'text-slate-400'
                }`}>
                  {step.label}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
