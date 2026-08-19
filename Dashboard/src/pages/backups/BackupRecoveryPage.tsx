import { useRef, useState } from 'react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import {
  Archive,
  CheckCircle2,
  Cloud,
  Database,
  Download,
  FileArchive,
  HardDriveDownload,
  RefreshCcw,
  RotateCcw,
  ShieldAlert,
  Upload,
  X,
} from 'lucide-react'

import { PageContainer } from '@/components/layout/PageContainer'
import { SectionHeader } from '@/components/layout/SectionHeader'
import { ConfirmDialog } from '@/components/overlays/ConfirmDialog'
import { Button } from '@/components/ui/button'

import { ApiError } from '@/types/api'

import {
  useBackupInformationQuery,
  useDownloadBackupMutation,
  useRestoreBackupMutation,
  useValidateBackupMutation,
} from '@/features/backups/queries'

import type { BackupValidationResult } from '@/features/backups/api'

// ==================== Helpers ====================

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 Bytes'

  const units = ['Bytes', 'KB', 'MB', 'GB']
  const index = Math.floor(Math.log(bytes) / Math.log(1024))
  const size = bytes / 1024 ** index

  return `${size.toFixed(index === 0 ? 0 : 2)} ${units[index]}`
}

// ==================== Backup Recovery Page ====================

export default function BackupRecoveryPage() {
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // ==================== State ====================

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [validationResult, setValidationResult] = useState<BackupValidationResult | null>(null)
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false)

  // ==================== Queries ====================

  const backupInformationQuery = useBackupInformationQuery()

  // ==================== Mutations ====================

  const downloadMutation = useDownloadBackupMutation()
  const validateMutation = useValidateBackupMutation()
  const restoreMutation = useRestoreBackupMutation()

  // ==================== Download Backup ====================

  const handleDownloadBackup = () => {
    downloadMutation.mutate(undefined, {
      onSuccess: (blob) => {
        const url = URL.createObjectURL(blob)

        const link = document.createElement('a')

        const timestamp = new Date()
          .toISOString()
          .replace(/[:.]/g, '-')

        link.href = url
        link.download = `lsa-full-backup-${timestamp}.zip`

        document.body.appendChild(link)

        link.click()
        link.remove()

        URL.revokeObjectURL(url)

        toast.success('Full backup created successfully')
      },

      onError: (error) => {
        toast.error(
          error instanceof ApiError
            ? error.message
            : 'Failed to create backup',
        )
      },
    })
  }

  // ==================== Select Restore File ====================

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0] ?? null

    if (!file) return

    if (!file.name.toLowerCase().endsWith('.zip')) {
      toast.error('Only ZIP backup files are allowed')

      event.target.value = ''

      return
    }

    setSelectedFile(file)
    setValidationResult(null)
  }

  // ==================== Remove Restore File ====================

  const handleRemoveFile = () => {
    setSelectedFile(null)
    setValidationResult(null)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // ==================== Validate Backup ====================

  const handleValidateBackup = () => {
    if (!selectedFile) return

    validateMutation.mutate(selectedFile, {
      onSuccess: (response) => {
        setValidationResult(response.data)

        toast.success('Backup file is valid')
      },

      onError: (error) => {
        setValidationResult(null)

        toast.error(
          error instanceof ApiError
            ? error.message
            : 'Backup validation failed',
        )
      },
    })
  }

  // ==================== Restore Backup ====================

  const handleRestoreBackup = () => {
    if (!selectedFile || !validationResult) return

    restoreMutation.mutate(
      {
        file: selectedFile,
        dropExisting: true,
      },
      {
        onSuccess: () => {
          toast.success('Website restored successfully')

          setRestoreDialogOpen(false)
          setSelectedFile(null)
          setValidationResult(null)

          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
        },

        onError: (error) => {
          toast.error(
            error instanceof ApiError
              ? error.message
              : 'Failed to restore backup',
          )
        },
      },
    )
  }

  return (
    <PageContainer className="max-w-7xl">
      <div className="space-y-7">
        {/* ==================== Header ==================== */}

<SectionHeader
  eyebrow="System Management"
  title="Backup & Recovery"
  description="Create a complete backup of MongoDB and Cloudinary, or restore the website from a previous backup package."
/>

        {/* ==================== Overview ==================== */}

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-border/70 bg-card p-4">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-muted/20 text-muted-foreground">
                <Database className="size-[18px]" strokeWidth={1.8} />
              </div>

              <div>
                <p className="text-[11px] font-semibold text-foreground">
                  MongoDB
                </p>

                <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
                  All collections, documents, indexes, and database metadata.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card p-4">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-muted/20 text-muted-foreground">
                <Cloud className="size-[18px]" strokeWidth={1.8} />
              </div>

              <div>
                <p className="text-[11px] font-semibold text-foreground">
                  Cloudinary
                </p>

                <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
                  Images, documents, media files, public IDs, and asset metadata.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border/70 bg-card p-4">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-muted/20 text-muted-foreground">
                <Archive className="size-[18px]" strokeWidth={1.8} />
              </div>

              <div>
                <p className="text-[11px] font-semibold text-foreground">
                  Backup package
                </p>

                <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
                  Everything is packaged into one portable ZIP archive.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ==================== Backup ==================== */}

        <section className="overflow-hidden rounded-[22px] border border-border/70 bg-card">
          <div className="border-b border-border/60 px-5 py-4 sm:px-6">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-muted/20 text-muted-foreground">
                <HardDriveDownload className="size-[18px]" strokeWidth={1.8} />
              </div>

              <div>
                <h2 className="text-[13px] font-semibold text-foreground">
                  Full Website Backup
                </h2>

                <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
                  Download a complete snapshot of the database and all Cloudinary media.
                </p>
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <CheckCircle2 className="size-3.5 text-success" />
                  MongoDB database
                </div>

                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <CheckCircle2 className="size-3.5 text-success" />
                  Cloudinary assets
                </div>

                <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                  <CheckCircle2 className="size-3.5 text-success" />
                  Asset manifest and backup metadata
                </div>
              </div>

              <Button
                type="button"
                onClick={handleDownloadBackup}
                disabled={downloadMutation.isPending}
                className="gap-2"
              >
                {downloadMutation.isPending ? (
                  <RefreshCcw className="size-4 animate-spin" />
                ) : (
                  <Download className="size-4" />
                )}

                {downloadMutation.isPending
                  ? 'Creating backup...'
                  : 'Create & Download Backup'}
              </Button>
            </div>
          </div>
        </section>

        {/* ==================== Restore ==================== */}

        <section className="overflow-hidden rounded-[22px] border border-border/70 bg-card">
          <div className="border-b border-border/60 px-5 py-4 sm:px-6">
            <div className="flex items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-muted/20 text-muted-foreground">
                <RotateCcw className="size-[18px]" strokeWidth={1.8} />
              </div>

              <div>
                <h2 className="text-[13px] font-semibold text-foreground">
                  Restore Website
                </h2>

                <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
                  Validate and restore MongoDB and Cloudinary from an LSA backup archive.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-5 p-5 sm:p-6">
            {/* ==================== File Upload ==================== */}

            {!selectedFile ? (
              <label
                htmlFor="backup-file"
                className="group flex min-h-[180px] cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/[0.04] px-6 text-center transition-colors hover:border-foreground/15 hover:bg-muted/[0.10]"
              >
                <div className="flex size-11 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground transition-colors group-hover:text-foreground">
                  <Upload className="size-[18px]" strokeWidth={1.8} />
                </div>

                <p className="mt-3 text-[11px] font-semibold text-foreground">
                  Select backup package
                </p>

                <p className="mt-1 text-[9px] leading-4 text-muted-foreground">
                  Choose an LSA full backup ZIP file.
                </p>
              </label>
            ) : (
              <div className="flex items-center gap-4 rounded-2xl border border-border/70 bg-muted/[0.05] p-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground">
                  <FileArchive className="size-[18px]" strokeWidth={1.8} />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11px] font-semibold text-foreground">
                    {selectedFile.name}
                  </p>

                  <p className="mt-1 text-[9px] text-muted-foreground">
                    {formatFileSize(selectedFile.size)}
                  </p>
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleRemoveFile}
                  disabled={
                    validateMutation.isPending ||
                    restoreMutation.isPending
                  }
                  aria-label="Remove backup file"
                >
                  <X className="size-4" />
                </Button>
              </div>
            )}

            <input
              ref={fileInputRef}
              id="backup-file"
              type="file"
              accept=".zip,application/zip,application/x-zip-compressed"
              onChange={handleFileChange}
              className="sr-only"
            />

            {/* ==================== Validation Result ==================== */}

            {validationResult ? (
              <div className="rounded-2xl border border-success/20 bg-success/[0.025] p-4">
                <div className="flex items-start gap-3">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-success/15 bg-success-subtle text-success">
                    <CheckCircle2 className="size-4" strokeWidth={1.8} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-foreground">
                      Backup verified
                    </p>

                    <p className="mt-1 text-[9px] leading-4 text-muted-foreground">
                      This backup package passed validation and is ready to restore.
                    </p>

                    <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
                      <div>
                        <p className="text-[8px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60">
                          Version
                        </p>

                        <p className="mt-1 text-[10px] font-semibold text-foreground">
                          {validationResult.version}
                        </p>
                      </div>

                      <div>
                        <p className="text-[8px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60">
                          Created
                        </p>

                        <p className="mt-1 text-[10px] font-semibold text-foreground">
                          {validationResult.createdAt
                            ? format(
                                new Date(validationResult.createdAt),
                                'PPP p',
                              )
                            : 'Unknown'}
                        </p>
                      </div>

                      <div>
                        <p className="text-[8px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60">
                          Database
                        </p>

                        <p className="mt-1 text-[10px] font-semibold text-foreground">
                          {validationResult.database.included
                            ? 'Included'
                            : 'Missing'}
                        </p>
                      </div>

                      <div>
                        <p className="text-[8px] font-semibold uppercase tracking-[0.08em] text-muted-foreground/60">
                          Assets
                        </p>

                        <p className="mt-1 text-[10px] font-semibold text-foreground">
                          {validationResult.cloudinary.assetCount}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {/* ==================== Restore Warning ==================== */}

            {validationResult ? (
              <div className="flex items-start gap-3 rounded-2xl border border-destructive/15 bg-destructive/[0.025] p-4">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-destructive/15 bg-background text-destructive">
                  <ShieldAlert className="size-4" strokeWidth={1.8} />
                </div>

                <div>
                  <p className="text-[11px] font-semibold text-foreground">
                    Full database restore
                  </p>

                  <p className="mt-1 text-[10px] leading-5 text-muted-foreground">
                    Existing MongoDB collections included in this backup will be replaced before restoration. Cloudinary assets with matching public IDs will be overwritten.
                  </p>
                </div>
              </div>
            ) : null}

            {/* ==================== Restore Actions ==================== */}

            <div className="flex justify-end gap-3">
              {selectedFile && !validationResult ? (
                <Button
                  type="button"
                  onClick={handleValidateBackup}
                  disabled={validateMutation.isPending}
                  className="gap-2"
                >
                  {validateMutation.isPending ? (
                    <RefreshCcw className="size-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="size-4" />
                  )}

                  {validateMutation.isPending
                    ? 'Validating...'
                    : 'Validate Backup'}
                </Button>
              ) : null}

              {selectedFile && validationResult ? (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => setRestoreDialogOpen(true)}
                  disabled={restoreMutation.isPending}
                  className="gap-2"
                >
                  <RotateCcw className="size-4" />
                  Restore Website
                </Button>
              ) : null}
            </div>
          </div>
        </section>

        {/* ==================== Backup Information Error ==================== */}

        {backupInformationQuery.isError ? (
          <p className="text-[10px] text-destructive">
            Unable to load backup system information.
          </p>
        ) : null}
      </div>

      {/* ==================== Restore Confirmation ==================== */}

      <ConfirmDialog
        open={restoreDialogOpen}
        onOpenChange={setRestoreDialogOpen}
        title="Restore full website backup?"
        description="MongoDB data included in this backup will replace the current collections, and matching Cloudinary assets will be overwritten. This operation cannot be interrupted safely once it starts."
        confirmLabel={
          restoreMutation.isPending
            ? 'Restoring...'
            : 'Restore backup'
        }
        variant="destructive"
        onConfirm={handleRestoreBackup}
      />
    </PageContainer>
  )
}