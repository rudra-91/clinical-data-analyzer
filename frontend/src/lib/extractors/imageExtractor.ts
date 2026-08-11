import { TextExtractor, ExtractResult } from './types'

/**
 * Preprocess a File (image) into an ImageData with:
 *   1. Grayscale conversion
 *   2. Otsu adaptive threshold binarization
 *   3. Contrast enhancement
 *   4. Unsharp-mask sharpening
 */
async function preprocessImage(file: File): Promise<ImageData> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get canvas context'))
        return
      }
      canvas.width = img.width
      canvas.height = img.height
      ctx.drawImage(img, 0, 0)

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imageData.data

      // --- 1. Grayscale ---
      const grayValues: number[] = []
      for (let i = 0; i < data.length; i += 4) {
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
        data[i] = data[i + 1] = data[i + 2] = gray
        grayValues.push(gray)
      }

      // --- 2. Otsu's threshold ---
      let threshold = otsuThreshold(grayValues)

      // --- 3. Contrast enhancement (stretch histogram) ---
      let min = 255
      let max = 0
      for (const g of grayValues) {
        if (g < min) min = g
        if (g > max) max = g
      }
      const range = max - min || 1

      // --- 4. Binarize + contrast stretch + sharpen ---
      // Sharpen kernel (3x3 unsharp mask)
      const sharpenKernel = [
        0, -1, 0,
        -1, 5, -1,
        0, -1, 0,
      ]
      const sharpened = applyConvolution(grayValues, canvas.width, canvas.height, sharpenKernel, threshold, min, range)

      // Write back to imageData (grayscale + binary)
      for (let i = 0; i < data.length; i += 4) {
        const idx = i / 4
        const val = sharpened[idx]
        data[i] = data[i + 1] = data[i + 2] = val
        data[i + 3] = 255
      }

      imageData.data.set(data)
      ctx.putImageData(imageData, 0, 0)
      resolve(imageData)
    }
    img.onerror = () => reject(new Error('Failed to load image for preprocessing'))
    img.src = URL.createObjectURL(file)
  })
}

function otsuThreshold(values: number[]): number {
  const histogram = new Array(256).fill(0)
  for (const v of values) {
    histogram[Math.round(v)]++
  }
  const total = values.length
  let sum = 0
  for (let t = 0; t < 256; t++) {
    sum += t * histogram[t]
  }
  let sumB = 0
  let wB = 0
  let wF = 0
  let varMax = 0
  let threshold = 128
  for (let t = 0; t < 256; t++) {
    wB += histogram[t]
    if (wB === 0) continue
    wF = total - wB
    if (wF === 0) break
    sumB += t * histogram[t]
    const mB = sumB / wB
    const mF = (sum - sumB) / wF
    const varBetween = wB * wF * (mB - mF) ** 2
    if (varBetween > varMax) {
      varMax = varBetween
      threshold = t
    }
  }
  return threshold
}

function applyConvolution(
  values: number[],
  width: number,
  height: number,
  kernel: number[],
  threshold: number,
  min: number,
  range: number,
): number[] {
  const result = new Array(values.length).fill(0)
  const ksize = 3
  const khalf = 1

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0
      for (let ky = -khalf; ky <= khalf; ky++) {
        for (let kx = -khalf; kx <= khalf; kx++) {
          const pixelX = Math.max(0, Math.min(width - 1, x + kx))
          const pixelY = Math.max(0, Math.min(height - 1, y + ky))
          const pixel = values[pixelY * width + pixelX]
          const kv = kernel[(ky + khalf) * ksize + (kx + khalf)]
          sum += pixel * kv
        }
      }
      // Contrast stretch + threshold
      const contrastStretched = ((sum - min) / range) * 255
      result[y * width + x] = contrastStretched > threshold ? 255 : 0
    }
  }
  return result
}

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

      if (conf < 50) {
        console.log('[EXTRACT:IMAGE] OCR confidence low (' + conf + '%), retrying with preprocessing')
        onProgress?.(91)

        try {
          const processedImageData = await preprocessImage(file)
          const {
            data: { text: text2, confidence: conf2 },
          } = await Tesseract.recognize(
            processedImageData,
            'eng',
            {
              logger: (m: { status?: string; progress?: number }) => {
                if (m.status === 'recognizing') {
                  onProgress?.(91 + (m.progress ?? 0) * 8)
                }
              },
            },
          )

          const cleaned2 = (text2 || '').trim().replace(/\n{3,}/g, '\n\n')
          const confNum2 = typeof conf2 === 'number' ? conf2 : 0

          if (cleaned2.length > cleaned.length || (cleaned2.length >= cleaned.length && confNum2 > conf)) {
            console.log('[EXTRACT:IMAGE] Preprocessing improved result:', cleaned2.length, 'chars, confidence:', confNum2)
            onProgress?.(100)
            return { text: cleaned2, usedOCR: true, confidence: confNum2 }
          }
        } catch (preprocessErr) {
          console.warn('[EXTRACT:IMAGE] Preprocessing failed, using original OCR result:', preprocessErr)
        }
      }

      onProgress?.(100)
      return { text: cleaned, usedOCR: true, confidence: conf }
    } catch (err: any) {
      const msg = err?.message || String(err)
      console.error('[EXTRACT:IMAGE] OCR failed:', msg)
      throw new Error(`Image OCR failed: ${msg}`)
    }
  }
}
