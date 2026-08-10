import { TextExtractor, ExtractResult } from './types'

import { GlobalWorkerOptions } from 'pdfjs-dist'

GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString()

export class PDFExtractor implements TextExtractor {
  async extract(
    file: File,
    onProgress?: (progress: number) => void,
  ): Promise<ExtractResult> {
    console.log('[EXTRACT:PDF] Starting PDF extraction for:', file.name)
    onProgress?.(10)

    const arrayBuffer = await file.arrayBuffer()
    onProgress?.(25)

    let pdfjs: any
    try {
      pdfjs = await import('pdfjs-dist')
    } catch (e) {
      console.error('[EXTRACT:PDF] Failed to load pdfjs-dist:', e)
      throw new Error('Failed to load PDF processing library.')
    }

    const getDocument = pdfjs.getDocument
    if (!getDocument) {
      throw new Error('pdfjs-dist getDocument not found.')
    }

    let pdf: any
    try {
      console.log('[EXTRACT:PDF] Loading PDF document')
      const loadingTask = getDocument({
        data: new Uint8Array(arrayBuffer),
      })
      pdf = await loadingTask.promise
      onProgress?.(40)
      console.log('[EXTRACT:PDF] PDF loaded, pages:', pdf.numPages)
    } catch (err: any) {
      const msg = err?.message || err?.toString() || 'Unknown error'
      console.error('[EXTRACT:PDF] PDF loading failed:', msg)

      if (msg.toLowerCase().includes('password') || msg.toLowerCase().includes('encrypted')) {
        throw new Error('This PDF is password-protected. Please upload an unlocked copy.')
      }
      if (msg.toLowerCase().includes('corrupt') || msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('malformed')) {
        throw new Error('This PDF appears to be corrupted or invalid.')
      }
      throw new Error(`Failed to open PDF: ${msg}`)
    }

    let allText = ''
    const totalPages = pdf.numPages

    for (let i = 1; i <= totalPages; i++) {
      try {
        const page = await pdf.getPage(i)
        const textContent = await page.getTextContent()
        const pageText = (textContent.items as any[])
          .filter((item: any) => 'str' in item)
          .map((item: any) => item.str as string)
          .join('')
        allText += pageText + '\n'
        onProgress?.(40 + (50 * i) / totalPages)
      } catch (err) {
        console.error('[EXTRACT:PDF] Error extracting page', i, err)
      }
    }

    const trimmed = allText.trim()

    if (trimmed.length > 0) {
      console.log('[EXTRACT:PDF] Digital text extraction succeeded, length:', trimmed.length)
      pdf.destroy?.()
      onProgress?.(100)
      return { text: trimmed, usedOCR: false }
    }

    console.log('[EXTRACT:PDF] No digital text found — running OCR for scanned PDF')
    onProgress?.(45)
    pdf.destroy?.()

    return this.runOCR(arrayBuffer, onProgress)
  }

  private async runOCR(
    arrayBuffer: ArrayBuffer,
    onProgress?: (progress: number) => void,
  ): Promise<ExtractResult> {
    onProgress?.(50)

    let Tesseract: any
    try {
      Tesseract = await import('tesseract.js')
    } catch {
      throw new Error('Failed to load OCR library (tesseract.js).')
    }

    let pdfjs: any
    try {
      pdfjs = await import('pdfjs-dist')
    } catch {
      throw new Error('Failed to load PDF library for OCR rendering.')
    }

    const getDocument = pdfjs.getDocument

    const pdf = await getDocument({
      data: new Uint8Array(arrayBuffer),
    }).promise

    const totalPages = pdf.numPages
    console.log('[EXTRACT:PDF:OCR] Pages to OCR:', totalPages)

    const worker = await Tesseract.createWorker('eng', 1, {
      logger: (m: { status?: string; progress?: number }) => {
        if (m.status === 'recognizing') {
          onProgress?.(55 + (m.progress ?? 0) * 35)
        }
      },
    })

    let allText = ''

    try {
      onProgress?.(55)

      for (let i = 1; i <= totalPages; i++) {
        const page = await pdf.getPage(i)
        const viewport = page.getViewport({ scale: 2 })
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Failed to get canvas context for PDF OCR')

        canvas.width = viewport.width
        canvas.height = viewport.height

        await page.render({
          canvasContext: ctx,
          viewport,
        }).promise

        const {
          data: { text },
        } = await worker.recognize(canvas, {})
        allText += text + '\n'
        onProgress?.(55 + (35 * i) / totalPages)
      }

      const cleaned = allText.replace(/\n{3,}/g, '\n\n').trim()

      if (cleaned.length < 10) {
        throw new Error('No readable text was detected from this PDF.')
      }

      console.log('[EXTRACT:PDF:OCR] OCR completed, length:', cleaned.length)
      onProgress?.(100)
      return { text: cleaned, usedOCR: true }
    } catch (err: any) {
      const msg = err?.message || String(err)
      console.error('[EXTRACT:PDF:OCR] OCR failed:', msg)
      throw new Error(`OCR extraction failed: ${msg}`)
    } finally {
      if (worker.terminate) await worker.terminate()
      pdf.destroy?.()
    }
  }
}
