import { apiClient } from '@/lib/api-client'

// ==================== Types ====================

export interface BackupInformationResponse {
  success: boolean
  data: {
    type: 'full'
    includes: {
      mongodb: boolean
      cloudinary: boolean
    }
    formats: {
      database: string
      media: string
      package: string
    }
  }
}

export interface BackupValidationResult {
  valid: boolean
  version: number
  application: string
  createdAt: string | null
  database: {
    included: boolean
  }
  cloudinary: {
    included: boolean
    assetCount: number
  }
}

export interface BackupValidationResponse {
  success: boolean
  message: string
  data: BackupValidationResult
}

export interface RestoreResult {
  success: boolean
  restoredAt: string
  backup: {
    version: number
    application: string
    createdAt: string | null
  }
  mongodb: {
    restored: boolean
  }
  cloudinary: {
    totalAssets: number
    restoredAssets: number
    failedAssets: number
  }
}

export interface RestoreResponse {
  success: boolean
  message: string
  data: RestoreResult
}

// ==================== Get Backup Information ====================

export async function getBackupInformation(): Promise<BackupInformationResponse> {
  const response = await apiClient.get<BackupInformationResponse>('/backups')

  return response.data
}

// ==================== Download Full Backup ====================

export async function downloadFullBackup(): Promise<Blob> {
  const response = await apiClient.post('/backups/download', undefined, {
    responseType: 'blob',
  })

  return response.data
}

// ==================== Validate Backup ====================

export async function validateBackup(file: File): Promise<BackupValidationResponse> {
  const formData = new FormData()

  formData.append('backup', file)

  const response = await apiClient.post<BackupValidationResponse>(
    '/backups/validate',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  )

  return response.data
}

// ==================== Restore Backup ====================

export async function restoreBackup(
  file: File,
  dropExisting = true,
): Promise<RestoreResponse> {
  const formData = new FormData()

  formData.append('backup', file)
  formData.append('dropExisting', String(dropExisting))

  const response = await apiClient.post<RestoreResponse>(
    '/backups/restore',
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    },
  )

  return response.data
}