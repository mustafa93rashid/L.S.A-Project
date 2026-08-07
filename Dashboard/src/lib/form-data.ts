/**
 * Builds a multipart FormData body. Plain values are appended as-is;
 * object/array values are JSON.stringify'd, matching the backend's
 * customSanitizer pattern (e.g. equipment.validate.js's parseJsonObject)
 * that explicitly accepts a JSON string for nested fields over multipart,
 * since the browser can't send a real nested object as a form field.
 * `undefined`/`null` values are skipped so partial updates work.
 */
export function buildFormData(
  payload: Record<string, unknown>,
  files?: Record<string, File | null | undefined>,
): FormData {
  const formData = new FormData()

  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined || value === null) continue

    if (typeof value === 'object') {
      formData.append(key, JSON.stringify(value))
    } else {
      formData.append(key, String(value))
    }
  }

  if (files) {
    for (const [key, file] of Object.entries(files)) {
      if (file) formData.append(key, file)
    }
  }

  return formData
}
