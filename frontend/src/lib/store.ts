export interface Finding {
  parameter: string
  value: string
  reference: string
  status: 'high' | 'low' | 'normal'
}

export interface Reference {
  title: string
  excerpt: string
  source: string
}

export interface AnalysisData {
  findings: Finding[]
  references: Reference[]
  recommendations: string[]
  summary: string
}

export interface StoreState {
  file: File | null
  extractedText: string | null
  analysisData: AnalysisData | null
  processingError: string | null
  uploadProgress: number
}

const initialState: StoreState = {
  file: null,
  extractedText: null,
  analysisData: null,
  processingError: null,
  uploadProgress: 0,
}

let state: StoreState = { ...initialState }
const listeners: Set<() => void> = new Set()

function emit() {
  listeners.forEach((l) => l())
}

export const appStore = {
  get: () => state,

  set: (partial: Partial<StoreState>) => {
    state = { ...state, ...partial }
    emit()
  },

  reset: () => {
    state = { ...initialState }
    emit()
  },

  subscribe: (listener: () => void) => {
    listeners.add(listener)
    return () => listeners.delete(listener)
  },
}
