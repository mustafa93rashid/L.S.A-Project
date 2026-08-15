import { useRef, useState, type ChangeEvent } from 'react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { CalendarDays, Download, ExternalLink, FileCheck2, FileText, HardDrive, RefreshCw, ShieldCheck, Trash2, Upload, X } from 'lucide-react'

import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { PageLoader } from '@/components/feedback/PageLoader'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ConfirmDialog } from '@/components/overlays/ConfirmDialog'
import { Button } from '@/components/ui/button'

import { ApiError } from '@/types/api'
import { validateCompanyProfileFile, formatFileSize } from '@/features/company-profile/utils'
import { useCompanyProfileQuery, useUpdateCompanyProfileMutation, useDeleteCompanyProfileMutation, useDownloadCompanyProfileMutation } from '@/features/company-profile/queries'

export default function CompanyProfilePage() {
  const inputRef = useRef<HTMLInputElement | null>(null)

  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const { data: companyProfile, isLoading, isError, refetch } = useCompanyProfileQuery()

  const updateMutation = useUpdateCompanyProfileMutation()
  const deleteMutation = useDeleteCompanyProfileMutation()
  const downloadMutation = useDownloadCompanyProfileMutation()

  const isUploading = updateMutation.isPending
  const isDeleting = deleteMutation.isPending

  if (isLoading) return <PageLoader />
  if (isError) return <ErrorState description="Company profile could not be loaded." onRetry={() => refetch()} />

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null

    if (!file) return

    const validationError = validateCompanyProfileFile(file)

    if (validationError) {
      setFileError(validationError)
      setSelectedFile(null)
      event.target.value = ''
      return
    }

    setFileError(null)
    setSelectedFile(file)
  }

  const clearSelectedFile = () => {
    setSelectedFile(null)
    setFileError(null)

    if (inputRef.current) inputRef.current.value = ''
  }

  const handleUpload = () => {
    if (!selectedFile) {
      setFileError('Select a PDF file before uploading.')
      return
    }

    updateMutation.mutate(selectedFile, {
      onSuccess: () => {
        toast.success(companyProfile ? 'Company profile replaced successfully' : 'Company profile uploaded successfully')
        clearSelectedFile()
      },

      onError: (error) => {
        if (error instanceof ApiError) {
          setFileError(error.message)
          return
        }

        setFileError('Failed to upload company profile.')
      },
    })
  }

  const handleDelete = () => {
    deleteMutation.mutate(undefined, {
      onSuccess: () => {
        toast.success('Company profile deleted successfully')
        setDeleteDialogOpen(false)
        clearSelectedFile()
      },

      onError: (error) => {
        toast.error(error instanceof ApiError ? error.message : 'Failed to delete company profile')
      },
    })
  }

  const handleDownload = () => {
    if (!companyProfile) return

    downloadMutation.mutate(companyProfile.fileName, {
      onError: (error) => {
        toast.error(error instanceof ApiError ? error.message : 'Failed to download company profile')
      },
    })
  }

  return (
    <PageContainer className="max-w-7xl">
      <div className="space-y-7">

        <PageHeader title="Company Profile" description="Manage the official LSA company profile PDF available on the public website." />

        <section className="overflow-hidden rounded-[24px] border border-border/70 bg-card shadow-[0_1px_3px_rgba(0,0,0,0.025)]">

          <div className="flex flex-col gap-4 border-b border-border/60 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">

            <div className="flex min-w-0 items-start gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-[14px] border border-border/70 bg-muted/30 text-muted-foreground">
                <FileText className="size-[18px]" strokeWidth={1.8} />
              </div>

              <div className="min-w-0">
                <p className="text-[9px] font-semibold tracking-[0.13em] text-muted-foreground uppercase">
                  Website Document
                </p>

                <h2 className="mt-1 text-[14px] font-semibold tracking-[-0.015em] text-foreground">
                  Official Company Profile
                </h2>

                <p className="mt-1 text-[11px] leading-5 text-muted-foreground">
                  Upload and maintain the PDF visitors can access from the public website.
                </p>
              </div>
            </div>

            {companyProfile ? (
              <div className="inline-flex w-fit items-center gap-2 rounded-xl border border-success/20 bg-success/[0.04] px-3 py-2">
                <span className="size-2 rounded-full bg-success" />

                <span className="text-[10px] font-semibold text-success">
                  Published
                </span>
              </div>
            ) : null}

          </div>


          {companyProfile ? (
            <div className="p-5 sm:p-6">

              <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">

                <div className="overflow-hidden rounded-[20px] border border-border/70 bg-muted/[0.055]">

                  <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-center">

                    <div className="relative flex size-20 shrink-0 items-center justify-center rounded-[20px] border border-destructive/15 bg-destructive/[0.045] text-destructive">
                      <FileText className="size-8" strokeWidth={1.5} />

                      <span className="absolute -bottom-2 rounded-md border border-destructive/15 bg-card px-2 py-0.5 text-[8px] font-bold tracking-[0.08em] text-destructive uppercase">
                        PDF
                      </span>
                    </div>


                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-success/15 bg-success/[0.05] px-2 py-1 text-[9px] font-semibold text-success">
                          <FileCheck2 className="size-3" strokeWidth={1.8} />
                          Current document
                        </span>

                        <span className="inline-flex items-center gap-1.5 rounded-lg border border-border/70 bg-background px-2 py-1 text-[9px] font-semibold text-muted-foreground">
                          <ShieldCheck className="size-3" strokeWidth={1.8} />
                          Public
                        </span>
                      </div>


                      <h3 className="mt-3 break-all text-[15px] font-semibold tracking-[-0.02em] text-foreground">
                        {companyProfile.fileName}
                      </h3>


                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[10px] text-muted-foreground">

                        <span className="inline-flex items-center gap-1.5">
                          <HardDrive className="size-3.5" strokeWidth={1.7} />
                          {formatFileSize(companyProfile.size)}
                        </span>

                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays className="size-3.5" strokeWidth={1.7} />
                          Updated {format(new Date(companyProfile.updatedAt), 'MMM d, yyyy • h:mm a')}
                        </span>

                      </div>
                    </div>

                  </div>


                  <div className="flex flex-wrap items-center gap-2 border-t border-border/60 bg-background/50 px-5 py-3.5">

                    <Button type="button" variant="outline" size="sm" onClick={() => window.open(companyProfile.url, '_blank', 'noopener,noreferrer')}>
                      <ExternalLink className="size-3.5" />
                      View PDF
                    </Button>

                    <Button type="button" variant="outline" size="sm" disabled={downloadMutation.isPending} onClick={handleDownload}>
                      <Download className="size-3.5" />
                      {downloadMutation.isPending ? 'Downloading…' : 'Download'}
                    </Button>

                    <Button type="button" variant="ghost" size="sm" className="ml-auto text-destructive hover:bg-destructive/10 hover:text-destructive" disabled={isDeleting} onClick={() => setDeleteDialogOpen(true)}>
                      <Trash2 className="size-3.5" />
                      Delete
                    </Button>

                  </div>

                </div>


                <div className="rounded-[20px] border border-border/70 bg-muted/[0.04] p-4">

                  <div className="flex items-start gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-xl border border-border/70 bg-background text-muted-foreground">
                      <RefreshCw className="size-4" strokeWidth={1.8} />
                    </div>

                    <div>
                      <p className="text-[11px] font-semibold text-foreground">
                        Replace document
                      </p>

                      <p className="mt-1 text-[9px] leading-4 text-muted-foreground">
                        Uploading a new PDF replaces the current document.
                      </p>
                    </div>
                  </div>


                  <label htmlFor="company-profile-file" className={`mt-4 flex cursor-pointer flex-col items-center justify-center rounded-[16px] border border-dashed px-4 py-6 text-center transition-colors hover:bg-muted/30 ${fileError ? 'border-destructive/45 bg-destructive/[0.02]' : 'border-border'}`}>

                    <div className={`flex size-10 items-center justify-center rounded-xl border bg-background ${fileError ? 'border-destructive/20 text-destructive' : 'border-border/70 text-muted-foreground'}`}>
                      <Upload className="size-4" strokeWidth={1.8} />
                    </div>

                    <p className="mt-3 max-w-full truncate text-[10px] font-semibold text-foreground">
                      {selectedFile ? selectedFile.name : 'Choose replacement PDF'}
                    </p>

                    <p className="mt-1 text-[9px] text-muted-foreground">
                      PDF only • Maximum 20 MB
                    </p>

                  </label>


                  <input ref={inputRef} id="company-profile-file" type="file" accept="application/pdf,.pdf" className="sr-only" onChange={handleFileChange} />


                  {fileError ? (
                    <p className="mt-2 flex items-center gap-1.5 text-[10px] font-medium text-destructive">
                      <X className="size-3" />
                      {fileError}
                    </p>
                  ) : null}


                  {selectedFile ? (
                    <div className="mt-4 flex items-center gap-2">
                      <Button type="button" className="flex-1" disabled={isUploading} onClick={handleUpload}>
                        <Upload className="size-3.5" />
                        {isUploading ? 'Uploading…' : 'Replace profile'}
                      </Button>

                      <Button type="button" variant="outline" size="icon" disabled={isUploading} aria-label="Remove selected file" onClick={clearSelectedFile}>
                        <X className="size-4" />
                      </Button>
                    </div>
                  ) : null}

                </div>

              </div>

            </div>
          ) : (
            <div className="p-5 sm:p-6">

              <div className="flex min-h-[380px] items-center justify-center rounded-[22px] border border-dashed border-border bg-muted/[0.035] px-6 py-12">

                <div className="w-full max-w-md text-center">

                  <div className="mx-auto flex size-16 items-center justify-center rounded-[20px] border border-border/70 bg-background text-muted-foreground shadow-[0_4px_18px_rgba(0,0,0,0.035)]">
                    <FileText className="size-7" strokeWidth={1.6} />
                  </div>


                  <h3 className="mt-5 text-[15px] font-semibold tracking-[-0.02em] text-foreground">
                    No company profile uploaded
                  </h3>

                  <p className="mx-auto mt-2 max-w-sm text-[11px] leading-5 text-muted-foreground">
                    Upload the official LSA company profile PDF to make it available on the public website.
                  </p>


                  <label htmlFor="company-profile-file" className={`mt-6 flex cursor-pointer items-center gap-4 rounded-[18px] border border-dashed bg-card px-4 py-4 text-left transition-all hover:border-foreground/15 hover:bg-muted/[0.12] ${fileError ? 'border-destructive/45' : 'border-border'}`}>

                    <div className={`flex size-10 shrink-0 items-center justify-center rounded-xl border bg-background ${fileError ? 'border-destructive/20 text-destructive' : 'border-border/70 text-muted-foreground'}`}>
                      <Upload className="size-4" strokeWidth={1.8} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-semibold text-foreground">
                        {selectedFile ? selectedFile.name : 'Choose company profile PDF'}
                      </p>

                      <p className="mt-1 text-[9px] text-muted-foreground">
                        PDF only • Maximum 20 MB
                      </p>
                    </div>

                    <span className="hidden rounded-lg border border-border/70 bg-background px-3 py-1.5 text-[9px] font-semibold text-muted-foreground sm:inline-flex">
                      Browse
                    </span>

                  </label>


                  <input ref={inputRef} id="company-profile-file" type="file" accept="application/pdf,.pdf" className="sr-only" onChange={handleFileChange} />


                  {fileError ? (
                    <p className="mt-2 flex items-center justify-center gap-1.5 text-[10px] font-medium text-destructive">
                      <X className="size-3" />
                      {fileError}
                    </p>
                  ) : null}


                  {selectedFile ? (
                    <div className="mt-4 flex items-center justify-center gap-2">

                      <Button type="button" disabled={isUploading} onClick={handleUpload}>
                        <Upload className="size-3.5" />
                        {isUploading ? 'Uploading…' : 'Upload company profile'}
                      </Button>

                      <Button type="button" variant="outline" size="icon" disabled={isUploading} aria-label="Remove selected file" onClick={clearSelectedFile}>
                        <X className="size-4" />
                      </Button>

                    </div>
                  ) : null}

                </div>

              </div>

            </div>
          )}

        </section>

      </div>


      <ConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} title="Delete company profile?" description="The company profile PDF will be removed from the website and deleted from storage. This action cannot be undone." confirmLabel="Delete profile" variant="destructive" onConfirm={handleDelete} />

    </PageContainer>
  )
}