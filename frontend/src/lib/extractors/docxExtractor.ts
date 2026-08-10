import { TextExtractor, ExtractResult } from './types'

export class DocxExtractor implements TextExtractor {
  async extract(
    file: File,
    onProgress?: (progress: number) => void,
  ): Promise<ExtractResult> {
    console.log('[EXTRACT:DOCX] Starting DOCX extraction for:', file.name)
    onProgress?.(10)

    let mammoth: any
    try {
      mammoth = await import('mammoth')
    } catch {
      throw new Error('Failed to load DOCX processing library (mammoth).')
    }

    try {
      onProgress?.(30)
      const arrayBuffer = await file.arrayBuffer()

      // Use the browser-compatible function
      let result: { value?: string; messages?: unknown[] } | string

      if (typeof mammoth.extractRawText === 'function') {
        const res = await mammoth.extractRawText({ arrayBuffer })
        result = res
      } else if (typeof mammoth.extractText === 'function') {
        result = await mammoth.extractText({ arrayBuffer })
      } else if (typeof mammoth.default?.extractRawText === 'function') {
        result = await mammoth.default.extractRawText({ arrayBuffer })
      } else {
        throw new Error('Mammoth library does not have a compatible extract function.')
      }

      // Normalize the result — extractRawText returns { value: string, messages: [] }
      let text: string
      if (typeof result === 'string') {
        text = result
      } else if (result && typeof result.value === 'string') {
        text = result.value
      } else {
        throw new Error('Mammoth returned an unexpected result format.')
      }

      onProgress?.(80)
      const trimmed = text.trim().replace(/\n{3,}/g, '\n\n')

      if (trimmed.length < 5) {
        throw new Error(
          'No readable text was found in this document. Please upload a different file.',
        )
      }

      console.log('[EXTRACT:DOCX] Text extracted, length:', trimmed.length)
      onProgress?.(100)
      return { text: trimmed, usedOCR: false }
    } catch (err: any) {
      const msg = err?.message || String(err)
      console.error('[EXTRACT:DOCX] Extraction failed:', msg)

      if (msg.includes('Malformed')) {
        throw new Error('This DOCX file appears to be corrupted or malformed.')
      }
      throw new Error(`Failed to read DOCX: ${msg}`)
    }
  }
}
