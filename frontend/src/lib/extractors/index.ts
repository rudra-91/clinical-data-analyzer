import type { TextExtractor } from './types'
import { PDFExtractor } from './pdfExtractor'
import { ImageExtractor } from './imageExtractor'
import { DocxExtractor } from './docxExtractor'
import { TxtExtractor } from './txtExtractor'
import type { SupportedFileType } from '../fileType'

const extractors: Record<SupportedFileType, TextExtractor> = {
  pdf: new PDFExtractor(),
  image: new ImageExtractor(),
  docx: new DocxExtractor(),
  txt: new TxtExtractor(),
}

export function getExtractor(fileType: SupportedFileType): TextExtractor {
  const extractor = extractors[fileType]
  if (!extractor) {
    throw new Error(`No extractor available for file type: ${fileType}`)
  }
  return extractor
}

export { PDFExtractor, ImageExtractor, DocxExtractor, TxtExtractor }
export type { TextExtractor, ExtractResult } from './types'
