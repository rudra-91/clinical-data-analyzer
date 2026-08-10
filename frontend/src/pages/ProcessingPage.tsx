import { useEffect, useState } from 'react'
import type { Page } from '../App'
import { appStore } from '../lib/store'
import { getFileTypeFromExtension, type SupportedFileType } from '../lib/fileType'
import { getExtractor } from '../lib/extractors'
import { analyzeText, checkHealth } from '../lib/api'
import { mapApiResponseToAnalysisData } from '../lib/dataMapper'
import type { AnalyzeResponse } from '../lib/api'

interface Props {
  navigate: (p: Page) => void
}

const ProcessingStep = ({
  label,
  status,
}: {
  label: string
  status: 'pending' | 'active' | 'complete'
}) => {
  const isComplete = status === 'complete'
  const isActive = status === 'active'
  return (
    <div
      className={`flex items-center gap-3 transition-opacity duration-300 ${
        !isComplete && !isActive ? 'opacity-40' : 'opacity-100'
      }`}
    >
      <div
        className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${
          isComplete
            ? 'bg-emerald-100 text-emerald-600'
            : isActive
              ? 'bg-blue-100 text-blue-600'
              : 'bg-slate-100 text-slate-400'
        }`}
      >
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
      <span
        className={`text-sm font-medium ${
          isComplete ? 'text-emerald-700' : isActive ? 'text-blue-700' : 'text-slate-400'
        }`}
      >
        {label}
      </span>
    </div>
  )
}

export default function ProcessingPage({ navigate }: Props) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [stepProgress, setStepProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  const file = appStore.get().file
  const fileType: SupportedFileType | null = file ? getFileTypeFromExtension(file.name) : null

  // Build the dynamic steps list
  const steps: { label: string; key: string }[] = [
    { label: 'Uploading...', key: 'upload' },
    { label: 'Extracting Text...', key: 'extract' },
  ]
  if (fileType === 'image' || fileType === 'pdf') {
    steps.push({ label: 'Running OCR...', key: 'ocr' })
  }
  steps.push(
    { label: 'Analyzing Report...', key: 'analyze' },
    { label: 'Analysis Complete.', key: 'complete' },
  )

  useEffect(() => {
    if (!file) {
      setError('No file selected. Please go back and upload a file.')
      return
    }

    if (!fileType) {
      setError('Unsupported file type. Please go back and upload a supported file.')
      return
    }

    let cancelled = false

    const runPipeline = async () => {
      try {
        setCurrentStepIndex(0)
        setStepProgress(0)

        // Step 1: Initial processing (file ready)
        setCurrentStepIndex(0)
        setStepProgress(50)
        console.log('[PROCESSING] Step 1: Processing file', file.name)

        // Step 2: Extract text
        setCurrentStepIndex(1)
        const extractor = getExtractor(fileType)
        console.log('[PROCESSING] Step 2: Extracting text using', fileType, 'extractor')

        const extractResult = await extractor.extract(file, (progress) => {
          if (!cancelled) setStepProgress(progress)
        })

        if (cancelled) return

        console.log('[PROCESSING] Text extracted:', extractResult.text.length, 'chars', 'OCR used:', extractResult.usedOCR)

        if (!extractResult.text || extractResult.text.trim().length < 5) {
          throw new Error(
            'No readable clinical information was detected. Please upload a clearer scan or a digital report.',
          )
        }

        // Move past extraction and OCR steps to the analyze step
        const analyzeIdx = steps.findIndex((s) => s.key === 'analyze')
        setCurrentStepIndex(analyzeIdx)
        setStepProgress(0)

        if (extractResult.usedOCR) {
          console.log('[PROCESSING] OCR was used during extraction')
        } else if (fileType === 'pdf' || fileType === 'image') {
          console.log('[PROCESSING] OCR step was not needed (digital content or no OCR required)')
        }

        // Step 3: Send to backend for AI analysis
        if (!cancelled) {
          const isHealthy = await checkHealth()
          console.log('[PROCESSING] Backend health:', isHealthy)
          if (!isHealthy) {
            console.warn('[PROCESSING] Backend is not reachable — analysis will fail')
          }
        }

        const response: AnalyzeResponse = await analyzeText(extractResult.text, (progress) => {
          if (!cancelled) setStepProgress(progress)
        })

        if (cancelled) return

        if (!response.success) {
          throw new Error('The AI analysis service returned an error. Please try again later.')
        }

        console.log('[PROCESSING] Analysis received from backend')

        // Map API response to UI data format
        const analysisData = mapApiResponseToAnalysisData(response)
        appStore.set({
          extractedText: extractResult.text,
          analysisData,
          processingError: null,
        })

        // Step 4: Complete
        setStepProgress(100)
        setDone(true)
        setCurrentStepIndex(steps.length - 1)

        setTimeout(() => {
          if (!cancelled) navigate('results')
        }, 800)
      } catch (err: any) {
        if (cancelled) return
        const msg = err?.message || err?.toString() || 'An unexpected error occurred'
        console.error('[PROCESSING] Pipeline error:', err)
        setError(msg)
        appStore.set({ processingError: msg })
      }
    }

    runPipeline()

    return () => {
      cancelled = true
    }
  }, [])

  const progress = currentStepIndex < steps.length - 1
    ? ((currentStepIndex + stepProgress / 100) / (steps.length - 1)) * 100
    : 100

  const handleRetry = () => {
    setError(null)
    setDone(false)
    setCurrentStepIndex(0)
    setStepProgress(0)
    appStore.set({ processingError: null })
    // Re-trigger the pipeline
    window.location.reload()
  }

  const handleBack = () => {
    appStore.reset()
    navigate('upload')
  }

  if (error) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-md text-center animate-fade-up">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center text-4xl mb-6">
            ⚠️
          </div>
          <h1 className="text-2xl font-semibold text-slate-900 mb-3">Processing Error</h1>
          <p className="text-slate-500 text-sm mb-6">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={handleRetry}
              className="flex-1 py-2.5 rounded-xl font-semibold text-sm bg-[#1a6fd4] text-white hover:bg-[#1558b0] transition-colors shadow-sm"
            >
              Try Again
            </button>
            <button
              onClick={handleBack}
              className="flex-1 py-2.5 rounded-xl font-semibold text-sm border border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50 transition-all"
            >
              Back to Upload
            </button>
          </div>
        </div>
      </div>
    )
  }

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
              cx="56"
              cy="56"
              r="50"
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
          {done ? 'Analysis Complete!' : 'Processing Your Report...'}
        </h1>
        <p className="text-slate-500 text-sm mb-8">
          {done ? 'Preparing your report...' : `Step ${currentStepIndex + 1} of ${steps.length}`}
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
          {steps.map((step, i) => (
            <ProcessingStep
              key={step.key}
              label={step.label}
              status={
                i < currentStepIndex ? 'complete' : i === currentStepIndex ? 'active' : 'pending'
              }
            />
          ))}
        </div>
      </div>
    </div>
  )
}
