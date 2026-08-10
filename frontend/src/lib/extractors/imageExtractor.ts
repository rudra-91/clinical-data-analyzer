import { TextExtractor, ExtractResult } from './types'

export class ImageExtractor implements TextExtractor {
  async extract(
    file: File,
    onProgress?: (progress: number) => void,
  ): Promise<ExtractResult> {
    console.log('[EXTRACT:IMAGE] Starting OCR for image:', file.name)
    onProgress?.(10)

    let Tesseract: any
    try {
      Tesseract = await import('tesseract.js')
    } catch {
      throw new Error('Failed to load OCR library (tesseract.js).')
    }

    try {
      onProgress?.(15)
      console.log('[EXTRACT:IMAGE] Starting recognition with Tesseract.js')

      const {
        data: { text, confidence },
      } = await Tesseract.recognize(
        file,
        'eng',
        {
          logger: (m: { status?: string; progress?: number }) => {
            if (m.status === 'recognizing') {
              onProgress?.(15 + (m.progress ?? 0) * 70)
            }
          },
        },
      )

      onProgress?.(90)

      const cleaned = (text || '').trim().replace(/\n{3,}/g, '\n\n')

      if (cleaned.length < 5) {
        throw new Error(
          'No readable clinical information was detected. Please upload a clearer scan or a digital report.',
        )
      }

      const conf = typeof confidence === 'number' ? confidence : 0
      console.log('[EXTRACT:IMAGE] OCR completed, length:', cleaned.length, 'confidence:', conf)

      onProgress?.(100)
      return { text: cleaned, usedOCR: true, confidence: conf }
    } catch (err: any) {
      const msg = err?.message || String(err)
      console.error('[EXTRACT:IMAGE] OCR failed:', msg)
      throw new Error(`Image OCR failed: ${msg}`)
    }
  }
}
