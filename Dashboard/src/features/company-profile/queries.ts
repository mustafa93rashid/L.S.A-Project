import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import * as api from '@/features/company-profile/api'
import type { CompanyProfile } from '@/features/company-profile/types'

// ==================== Query Keys ====================

export const companyProfileKeys = {
  all: ['companyProfile'] as const,
}

// ==================== Query ====================

export function useCompanyProfileQuery() {
  return useQuery({
    queryKey: companyProfileKeys.all,
    queryFn: api.getCompanyProfile,
  })
}

// ==================== Update ====================

export function useUpdateCompanyProfileMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) =>
      api.updateCompanyProfile(file),

    onSuccess: async (
      companyProfile: CompanyProfile,
    ) => {
      // Update cache immediately
      queryClient.setQueryData<CompanyProfile>(
        companyProfileKeys.all,
        companyProfile,
      )

      // Synchronize with backend
      await queryClient.invalidateQueries({
        queryKey: companyProfileKeys.all,
      })
    },
  })
}

// ==================== Delete ====================

export function useDeleteCompanyProfileMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.deleteCompanyProfile,

    onSuccess: async () => {
      // Remove immediately from cache
      queryClient.setQueryData<CompanyProfile | null>(
        companyProfileKeys.all,
        null,
      )

      // Synchronize with backend
      await queryClient.invalidateQueries({
        queryKey: companyProfileKeys.all,
      })
    },
  })
}

// ==================== Download ====================

export function useDownloadCompanyProfileMutation() {
  return useMutation({
    mutationFn: (fileName: string) =>
      api.downloadCompanyProfile(fileName),
  })
}