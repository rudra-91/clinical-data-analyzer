import { TextExtractor, ExtractResult } from './types'

export class TxtExtractor implements TextExtractor {
  async extract(
    file: File,
    onProgress?: (progress: number) => void,
  ): Promise<ExtractResult> {
    console.log('[EXTRACT:TXT] Reading text file:', file.name)
    onProgress?.(10)

    return new Promise<ExtractResult>((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = () => {
        onProgress?.(50)
        try {
          let text = reader.result as string

          if (!text || text.trim().length === 0) {
            throw new Error(
              'The text file appears to be empty. Please upload a file with clinical content.',
            )
          }

          // Clean up excessive whitespace while preserving readability
          text = text.trim().replace(/\n{3,}/g, '\n\n')

          console.log('[EXTRACT:TXT] Text read successfully, length:', text.length)
          onProgress?.(100)

          resolve({ text, usedOCR: false })
        } catch (err: any) {
          console.error('[EXTRACT:TXT] Read failed:', err)
          reject(new Error(`Failed to read text file: ${err?.message || String(err)}`))
        }
      }

      reader.onerror = () => {
        console.error('[EXTRACT:TXT] FileReader error:', reader.error)
        reject(new Error('Failed to read the text file.'))
      }

      reader.readAsText(file)
    })
  }
}
