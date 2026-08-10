import { useState, useRef, type DragEvent, type ChangeEvent } from 'react'
import type { Page } from '../App'
import { validateFile, ACCEPT_ATTRIBUTE, SUPPORTED_FILE_TYPES } from '../lib/fileType'
import { appStore } from '../lib/store'

interface Props {
  navigate: (p: Page) => void
}

export default function UploadPage({ navigate }: Props) {
  const [dragging, setDragging] = useState(false)
  const [currentFile, setCurrentFile] = useState<File | null>(() => appStore.get().file)
  const [validationError, setValidationError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (selectedFile: File | null) => {
    setValidationError(null)
    if (!selectedFile) return

    const result = validateFile(selectedFile)
    if (!result.valid) {
      setValidationError(result.error)
      setCurrentFile(null)
      appStore.set({ file: null, extractedText: null, analysisData: null, processingError: null })
      return
    }

    setCurrentFile(selectedFile)
    appStore.set({ file: selectedFile, extractedText: null, analysisData: null, processingError: null, uploadProgress: 0 })
    console.log('[UPLOAD] File validated:', selectedFile.name, 'type:', result.type)
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    const dropped = e.dataTransfer.files[0]
    if (dropped) handleFileSelect(dropped)
  }

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) handleFileSelect(f)
  }

  const handleAnalyze = () => {
    if (currentFile) navigate('processing')
  }
  const fileType = currentFile ? currentFile.name.substring(currentFile.name.lastIndexOf('.')).toUpperCase() : null

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl animate-fade-up">
        {/* Back link */}
        <button
          onClick={() => navigate('landing')}
          className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-700 mb-8 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to home
        </button>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
          <div className="mb-8">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl mb-4">📋</div>
            <h1 className="text-2xl font-semibold text-slate-900 mb-1.5">Upload Clinical Report</h1>
            <p className="text-slate-500 text-sm">
              Upload a clinical report in any format &mdash; PDF, DOCX, TXT, or a medical image scan. We automatically extract the text for you.
            </p>
          </div>

          {/* Validation error */}
          {validationError && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <p className="text-red-800 text-sm">{validationError}</p>
            </div>
          )}

          {/* Drop zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`
              relative rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer
              flex flex-col items-center justify-center py-12 px-6 text-center mb-6
              ${dragging
                ? 'border-[#1a6fd4] bg-blue-50 scale-[1.01]'
                : currentFile
                  ? 'border-emerald-400 bg-emerald-50'
                  : 'border-slate-200 bg-slate-50 hover:border-[#1a6fd4] hover:bg-blue-50'
              }
            `}
            onClick={() => inputRef.current?.click()}
          >
            <input
              ref={inputRef}
              type="file"
              accept={ACCEPT_ATTRIBUTE}
              className="sr-only"
              onChange={handleChange}
            />

            {currentFile ? (
              <>
                <div className="w-14 h-14 rounded-xl bg-emerald-100 flex items-center justify-center text-3xl mb-3">
                  {currentFile.type.startsWith('image/') ? '🖼️' : '📄'}
                </div>
                <p className="font-semibold text-emerald-700 text-sm mb-1 break-all max-w-xs">{currentFile.name}</p>
                <p className="text-emerald-600 text-xs">
                  {(currentFile.size / 1024).toFixed(1)} KB · {fileType}
                </p>
                <p className="text-xs text-slate-400 mt-3">Click to replace file</p>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center text-3xl mb-3">
                  📁
                </div>
                <p className="font-semibold text-slate-700 text-sm mb-1">
                  Drag &amp; drop your report here
                </p>
                <p className="text-slate-400 text-xs mb-3">or click to browse files</p>
                <div className="inline-flex flex-wrap items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-200 text-slate-500 text-xs font-medium">
                  {SUPPORTED_FILE_TYPES.map((ft, i) => (
                    <span key={ft.ext}>{ft.label}</span>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleAnalyze}
              disabled={!currentFile}
              className={`
                flex-1 py-3 rounded-xl font-semibold text-sm transition-all duration-150
                ${currentFile
                  ? 'bg-[#1a6fd4] text-white hover:bg-[#1558b0] shadow-md hover:shadow-lg'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }
              `}
            >
              Analyze Report
            </button>
            <button
              onClick={() => inputRef.current?.click()}
              className="px-5 py-3 rounded-xl border border-slate-200 text-slate-600 font-semibold text-sm hover:border-slate-300 hover:bg-slate-50 transition-all duration-150"
            >
              Choose File
            </button>
          </div>

          <div className="mt-4 text-xs text-slate-400 text-center">
            <p>Supported: PDF · DOCX · TXT · JPG/PNG/WebP · Max 25 MB</p>
            <p>Your file is processed securely and not stored permanently.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
