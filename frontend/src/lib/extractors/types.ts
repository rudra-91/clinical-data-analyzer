export interface ExtractResult {
  text: string
  usedOCR: boolean
  confidence?: number
}

export interface TextExtractor {
  extract(
    file: File,
    onProgress?: (progress: number) => void,
  ): Promise<ExtractResult>
}
