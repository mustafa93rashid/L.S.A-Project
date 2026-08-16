// components/forms/ImageUploadField.tsx

import {
  useEffect,
  useMemo,
  useRef,
} from 'react'

import {
  ImagePlus,
  Upload,
  X,
  type LucideIcon,
} from 'lucide-react'

import { FieldError } from '@/components/forms/FieldError'
import { cloudinaryThumbnail } from '@/lib/cloudinary'
import { validateImageFile } from '@/lib/file-validation'
import { cn } from '@/lib/utils'

interface ImageUploadFieldProps {
  id: string
  title: string
  description?: string

  file: File | null
  onFileChange: (file: File | null) => void

  error?: string | null
  onErrorChange?: (error: string | null) => void

  existingUrl?: string | null
  existingAlt?: string

  required?: boolean

  placeholderTitle?: string
  placeholderDescription?: string

  acceptedFormatsText?: string
  accept?: string

  maxWidthClassName?: string
  aspectClassName?: string

  thumbnailWidth?: number

  icon?: LucideIcon
}

export function ImageUploadField({
  id,
  title,
  description,
  file,
  onFileChange,
  error,
  onErrorChange,
  existingUrl,
  existingAlt = '',
  required = false,
  placeholderTitle = 'Add image',
  placeholderDescription = 'Click to select an image',
  acceptedFormatsText = 'JPEG, PNG, GIF or WebP — maximum file size 5 MB.',
  accept = 'image/jpeg,image/png,image/gif,image/webp',
  maxWidthClassName = 'max-w-[460px]',
  aspectClassName = 'aspect-[16/8]',
  thumbnailWidth = 900,
  icon: Icon = ImagePlus,
}: ImageUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement | null>(null)

  const previewUrl = useMemo(() => {
    if (file) return URL.createObjectURL(file)

    if (existingUrl) {
      return cloudinaryThumbnail(existingUrl, thumbnailWidth)
    }

    return null
  }, [file, existingUrl, thumbnailWidth])

  useEffect(() => {
    if (!file || !previewUrl) return

    return () => {
      URL.revokeObjectURL(previewUrl)
    }
  }, [file, previewUrl])

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFile = event.target.files?.[0] ?? null

    if (!selectedFile) return

    const validationError = validateImageFile(selectedFile)

    if (validationError) {
      onErrorChange?.(validationError)
      onFileChange(null)
      event.target.value = ''
      return
    }

    onErrorChange?.(null)
    onFileChange(selectedFile)
  }

  const handleRemove = (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault()
    event.stopPropagation()

    onFileChange(null)

    if (inputRef.current) {
      inputRef.current.value = ''
    }

    if (!existingUrl && required) {
      onErrorChange?.(`${title} is required.`)
    } else {
      onErrorChange?.(null)
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <div
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-xl border bg-background',
            error
              ? 'border-destructive/20 text-destructive'
              : 'border-border/70 text-muted-foreground',
          )}
        >
          <Icon className="size-4" strokeWidth={1.8} />
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-[11px] font-semibold text-foreground">
              {title}
            </p>

            {required ? (
              <span className="text-[8px] font-semibold text-destructive">
                Required
              </span>
            ) : null}
          </div>

          {description ? (
            <p className="mt-1 text-[9px] leading-4 text-muted-foreground">
              {description}
            </p>
          ) : null}
        </div>
      </div>

      <div className={cn('w-full', maxWidthClassName)}>
        <label
          htmlFor={id}
          className={cn(
            'group relative block cursor-pointer overflow-hidden rounded-[18px] border bg-background transition-all',
            error
              ? 'border-destructive/40'
              : 'border-border/70 hover:border-foreground/15',
          )}
        >
          {previewUrl ? (
            <div className={cn('relative overflow-hidden', aspectClassName)}>
              <img
                src={previewUrl}
                alt={file ? `Selected ${title}` : existingAlt || title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.015]"
              />

              <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-200 group-hover:bg-black/20">
                <div className="flex size-9 scale-95 items-center justify-center rounded-xl border border-white/15 bg-black/40 text-white opacity-0 backdrop-blur-md transition-all duration-200 group-hover:scale-100 group-hover:opacity-100">
                  <Upload className="size-4" strokeWidth={1.8} />
                </div>
              </div>

              {file ? (
                <button
                  type="button"
                  aria-label={`Remove selected ${title.toLowerCase()}`}
                  onClick={handleRemove}
                  className="absolute right-2.5 top-2.5 z-10 flex size-8 items-center justify-center rounded-xl border border-white/15 bg-black/45 text-white backdrop-blur-md transition-colors hover:bg-black/60"
                >
                  <X className="size-3.5" />
                </button>
              ) : null}
            </div>
          ) : (
            <div
              className={cn(
                'flex flex-col items-center justify-center gap-2.5 px-5 text-center',
                aspectClassName,
              )}
            >
              <div
                className={cn(
                  'flex size-10 items-center justify-center rounded-xl border',
                  error
                    ? 'border-destructive/20 bg-destructive/[0.04] text-destructive'
                    : 'border-border/70 bg-muted/20 text-muted-foreground',
                )}
              >
                <Icon className="size-[17px]" strokeWidth={1.7} />
              </div>

              <div>
                <p
                  className={cn(
                    'text-[10px] font-semibold',
                    error ? 'text-destructive' : 'text-foreground',
                  )}
                >
                  {placeholderTitle}
                </p>

                <p className="mt-1 text-[9px] text-muted-foreground">
                  {placeholderDescription}
                </p>
              </div>
            </div>
          )}
        </label>

        <input
          ref={inputRef}
          id={id}
          type="file"
          accept={accept}
          onChange={handleChange}
          className="sr-only"
        />

        <FieldError message={error} />

        <p className="mt-1.5 text-[9px] leading-4 text-muted-foreground/70">
          {acceptedFormatsText}
        </p>
      </div>
    </div>
  )
}