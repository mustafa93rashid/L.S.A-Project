/** Mirrors Backend/src/middlewares/upload.middleware.js MAX_IMAGE_SIZE and
 * the raster subset of IMAGE_MIME_TYPES accepted by the image inputs across
 * the dashboard (SVG is backend-accepted but not offered as a client
 * option, so it is intentionally excluded here too). */
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024
export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
]

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.type)) {
    return 'Unsupported file type. Please upload a JPEG, PNG, GIF, or WEBP image.'
  }
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return 'Image is too large. Maximum size is 5MB.'
  }
  return null
}
