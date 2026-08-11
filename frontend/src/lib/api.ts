export type BiomarkerValue = string | number | undefined

export interface ExtractedValues {
  [key: string]: BiomarkerValue
}

export interface AnalysisResult {
  [key: string]: string
}

export interface AnalyzeResponseData {
  extracted_values: ExtractedValues
  analysis: AnalysisResult
  summary: string
  sources: string[]
  debug?: {
    total_chars: number
    matched_count: number
    failed_patterns: string[]
    has_text: boolean
    unrecognized_lines: string[]
  }
}

export interface AnalyzeResponse {
  success: boolean
  status?: "success" | "partial_success"
  data: AnalyzeResponseData
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export async function analyzeText(
  text: string,
  onProgress?: (progress: number) => void,
): Promise<AnalyzeResponse> {
  console.log('[API] Sending extracted text to backend, length:', text.length)
  onProgress?.(50)

  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}/analyze-text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    })
  } catch (networkErr) {
    const msg = networkErr instanceof Error ? networkErr.message : String(networkErr)
    console.error('[API] Network error:', msg)
    if (msg.includes('fetch') || msg.includes('ECONN') || msg.includes('network') || msg.includes('CORS')) {
      throw new Error(
        'Unable to connect to the analysis backend. Please ensure the backend service is running on port 8000.',
      )
    }
    throw new Error(`Network error when contacting backend: ${msg}`)
  }

  onProgress?.(75)

  if (!response.ok) {
    let errorDetail = `HTTP ${response.status}`
    try {
      const errorJson = await response.json()
      errorDetail = errorJson.detail || errorJson.message || JSON.stringify(errorJson)
    } catch {
      const errorText = await response.text().catch(() => '')
      if (errorText) errorDetail = errorText
    }
    console.error('[API] Backend returned error:', response.status, errorDetail)
    throw new Error(`Backend analysis failed: ${errorDetail}`)
  }

  const result: AnalyzeResponse = await response.json()
  onProgress?.(100)
  console.log('[API] Analysis received:', result.success)

  return result
}

export async function checkHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`, { method: 'GET' })
    return response.ok
  } catch {
    return false
  }
}
