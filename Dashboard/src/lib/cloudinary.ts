/** Inserts a resizing transformation into a Cloudinary delivery URL so
 * small previews (e.g. a drawer thumbnail) don't download the full
 * original asset. No-op for non-Cloudinary URLs (e.g. local/test data). */
export function cloudinaryThumbnail(url: string, size = 96): string {
  const marker = '/upload/'
  const index = url.indexOf(marker)
  if (index === -1) return url

  const insertAt = index + marker.length
  return `${url.slice(0, insertAt)}w_${size},h_${size},c_fill,q_auto,f_auto/${url.slice(insertAt)}`
}
