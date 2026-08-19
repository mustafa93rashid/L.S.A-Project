import { useMutation, useQuery } from '@tanstack/react-query'

import {
  downloadFullBackup,
  getBackupInformation,
  restoreBackup,
  validateBackup,
} from '@/features/backups/api'

// ==================== Query Keys ====================

export const backupKeys = {
  all: ['backups'] as const,
  information: () => [...backupKeys.all, 'information'] as const,
}

// ==================== Backup Information Query ====================

export function useBackupInformationQuery() {
  return useQuery({
    queryKey: backupKeys.information(),
    queryFn: getBackupInformation,
  })
}

// ==================== Download Backup Mutation ====================

export function useDownloadBackupMutation() {
  return useMutation({
    mutationFn: downloadFullBackup,
  })
}

// ==================== Validate Backup Mutation ====================

export function useValidateBackupMutation() {
  return useMutation({
    mutationFn: (file: File) => validateBackup(file),
  })
}

// ==================== Restore Backup Mutation ====================

interface RestoreBackupVariables {
  file: File
  dropExisting?: boolean
}

export function useRestoreBackupMutation() {
  return useMutation({
    mutationFn: ({
      file,
      dropExisting = true,
    }: RestoreBackupVariables) => restoreBackup(file, dropExisting),
  })
}