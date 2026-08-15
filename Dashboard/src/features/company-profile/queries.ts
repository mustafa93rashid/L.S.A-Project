import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import * as api from '@/features/company-profile/api'
import type { CompanyProfile } from '@/features/company-profile/types'

export const companyProfileKeys = {
  all: ['companyProfile'] as const,
}

export function useCompanyProfileQuery() {
  return useQuery({
    queryKey: companyProfileKeys.all,
    queryFn: api.getCompanyProfile,
  })
}

export function useUpdateCompanyProfileMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (file: File) => api.updateCompanyProfile(file),
    onSuccess: (companyProfile: CompanyProfile) => {
      queryClient.setQueryData(companyProfileKeys.all, companyProfile)
    },
  })
}

export function useDeleteCompanyProfileMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: api.deleteCompanyProfile,
    onSuccess: () => {
      queryClient.setQueryData(companyProfileKeys.all, null)
    },
  })
}

export function useDownloadCompanyProfileMutation() {
  return useMutation({
    mutationFn: (fileName: string) => api.downloadCompanyProfile(fileName),
  })
}