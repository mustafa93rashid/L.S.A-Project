import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cloudinaryThumbnail } from '@/lib/cloudinary'
import { validateImageFile } from '@/lib/file-validation'
import type { ProjectGalleryImage } from '@/features/projects/types'

export interface NewGalleryFile {
  file: File
  alt: string
}

interface GalleryManagerProps {
  id: string
  label: string
  existingImages: ProjectGalleryImage[]
  removedPublicIds: string[]
  onRemovedPublicIdsChange: (publicIds: string[]) => void
  newFiles: NewGalleryFile[]
  onNewFilesChange: (files: NewGalleryFile[]) => void
  maxFiles: number
  onError: (message: string) => void
}

/** Feature-local — manages one multi-image collection (gallery or
 * certificates) that supports marking existing Cloudinary images for
 * removal-by-publicId and staging new files with per-file alt text,
 * matching the backend's `removeGalleryPublicIds`/`galleryAlt` (and the
 * certificate equivalents) contract exactly. */
export function GalleryManager({
  id,
  label,
  existingImages,
  removedPublicIds,
  onRemovedPublicIdsChange,
  newFiles,
  onNewFilesChange,
  maxFiles,
  onError,
}: GalleryManagerProps) {
  const remainingExisting = existingImages.filter(
    (image) => !removedPublicIds.includes(image.publicId),
  )
  const totalCount = remainingExisting.length + newFiles.length

  const [previewUrls, setPreviewUrls] = useState<string[]>([])

  useEffect(() => {
    const urls = newFiles.map((entry) => URL.createObjectURL(entry.file))
    setPreviewUrls(urls)
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newFiles])

  const handleFilesSelected = (fileList: FileList | null) => {
    if (!fileList) return
    const files = Array.from(fileList)

    if (totalCount + files.length > maxFiles) {
      onError(`${label}: at most ${maxFiles} images are allowed.`)
      return
    }

    for (const file of files) {
      const validationError = validateImageFile(file)
      if (validationError) {
        onError(`${label}: ${validationError}`)
        return
      }
    }

    onNewFilesChange([...newFiles, ...files.map((file) => ({ file, alt: '' }))])
  }

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>
        {label} ({totalCount}/{maxFiles})
      </Label>

      {existingImages.length > 0 ? (
        <div className="flex flex-wrap gap-3">
          {existingImages.map((image) => {
            const markedForRemoval = removedPublicIds.includes(image.publicId)
            return (
              <div key={image.publicId} className="flex flex-col items-center gap-1">
                <img
                  src={cloudinaryThumbnail(image.url, 80)}
                  alt={image.alt}
                  className={
                    markedForRemoval
                      ? 'h-16 w-16 rounded-md border border-destructive object-cover opacity-40'
                      : 'h-16 w-16 rounded-md border border-border object-cover'
                  }
                />
                <Button
                  type="button"
                  variant={markedForRemoval ? 'outline' : 'ghost'}
                  size="sm"
                  onClick={() =>
                    onRemovedPublicIdsChange(
                      markedForRemoval
                        ? removedPublicIds.filter((id) => id !== image.publicId)
                        : [...removedPublicIds, image.publicId],
                    )
                  }
                >
                  {markedForRemoval ? 'Undo' : 'Remove'}
                </Button>
              </div>
            )
          })}
        </div>
      ) : null}

      {newFiles.length > 0 ? (
        <div className="flex flex-col gap-2">
          {newFiles.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
              <img
                src={previewUrls[index]}
                alt=""
                className="h-12 w-12 shrink-0 rounded-md border border-border object-cover"
              />
              <Input
                placeholder="Alt text"
                value={entry.alt}
                onChange={(event) => {
                  const next = [...newFiles]
                  next[index] = { ...next[index], alt: event.target.value }
                  onNewFilesChange(next)
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Remove new ${label.toLowerCase()} file ${index + 1}`}
                onClick={() => onNewFilesChange(newFiles.filter((_, i) => i !== index))}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      ) : null}

      <label
        htmlFor={id}
        className="inline-flex w-fit cursor-pointer items-center gap-1 rounded-md border border-input bg-transparent px-2.5 py-1 text-sm hover:bg-accent"
      >
        <Plus className="size-4" />
        Add images
      </label>
      <input
        id={id}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/gif,image/webp"
        className="hidden"
        onChange={(event) => {
          handleFilesSelected(event.target.files)
          event.target.value = ''
        }}
      />
    </div>
  )
}
