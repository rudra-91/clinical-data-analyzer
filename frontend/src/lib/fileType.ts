export type SupportedFileType = 'pdf' | 'image' | 'docx' | 'txt'

export interface FileValidationResult {
  valid: boolean
  type: SupportedFileType | null
  error: string | null
}

export const MAX_FILE_SIZE = 25 * 1024 * 1024 // 25 MB

export const SUPPORTED_EXTENSIONS: Record<string, SupportedFileType> = {
  '.pdf': 'pdf',
  '.doc': 'docx',
  '.docx': 'docx',
  '.txt': 'txt',
  '.jpg': 'image',
  '.jpeg': 'image',
  '.png': 'image',
  '.webp': 'image',
}

export const SUPPORTED_MIME_TYPES: Record<string, SupportedFileType[]> = {
  'application/pdf': ['pdf'],
  'application/msword': ['docx'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
  'text/plain': ['txt'],
  'image/jpeg': ['image'],
  'image/jpg': ['image'],
  'image/png': ['image'],
  'image/webp': ['image'],
}

export const ACCEPT_ATTRIBUTE = '.pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.webp'

export function getFileTypeFromExtension(filename: string): SupportedFileType | null {
  const ext = filename.substring(filename.lastIndexOf('.')).toLowerCase()
  return SUPPORTED_EXTENSIONS[ext] ?? null
}

export function getFileTypeFromMimeType(mimeType: string): SupportedFileType | null {
  const types = SUPPORTED_MIME_TYPES[mimeType]
  return types && types.length > 0 ? types[0] : null
}

export function validateFile(file: File | null): FileValidationResult {
  if (!file) {
    return { valid: false, type: null, error: 'No file selected.' }
  }

  if (file.size === 0) {
    return { valid: false, type: null, error: 'The selected file is empty.' }
  }

  if (file.size > MAX_FILE_SIZE) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1)
    return { valid: false, type: null, error: `File is too large (${sizeMB} MB). Maximum size is 25 MB.` }
  }

  const extType = getFileTypeFromExtension(file.name)
  if (!extType) {
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
    return {
      valid: false,
      type: null,
      error: `Unsupported file type '${ext}'. Supported: PDF, DOCX, TXT, JPG, PNG, WebP.`,
    }
  }

  const mimeTypeList = SUPPORTED_MIME_TYPES[file.type]
  if (file.type && mimeTypeList && !mimeTypeList.includes(extType)) {
    return {
      valid: false,
      type: null,
      error: `File extension and type mismatch for '${file.name}'.`,
    }
  }

  return { valid: true, type: extType, error: null }
}

export const SUPPORTED_FILE_TYPES: { ext: string; label: string }[] = [
  { ext: 'PDF', label: 'PDF' },
  { ext: 'DOCX', label: 'DOCX' },
  { ext: 'DOC', label: 'DOC' },
  { ext: 'TXT', label: 'TXT' },
  { ext: 'JPG', label: 'JPG' },
  { ext: 'JPEG', label: 'JPEG' },
  { ext: 'PNG', label: 'PNG' },
  { ext: 'WEBP', label: 'WEBP' },
]
