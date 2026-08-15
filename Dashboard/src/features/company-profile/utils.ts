const PDF_MIME_TYPE = 'application/pdf'
const MAX_COMPANY_PROFILE_SIZE = 20 * 1024 * 1024

export function validateCompanyProfileFile(file: File): string | null {
  if (file.type !== PDF_MIME_TYPE) return 'Only PDF files are allowed.'

  if (!file.name.toLowerCase().endsWith('.pdf')) return 'The file must have a .pdf extension.'

  if (file.size > MAX_COMPANY_PROFILE_SIZE) return 'Company profile file must not exceed 20 MB.'

  return null
}

export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 KB'

  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** index

  return `${value.toFixed(index === 0 ? 0 : value >= 10 ? 1 : 2)} ${units[index]}`
}