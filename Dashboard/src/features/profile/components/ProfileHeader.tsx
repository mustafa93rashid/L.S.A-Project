import { useState } from 'react'
import { toast } from 'sonner'
import { Camera, Mail, Trash2 } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { RoleBadge } from '@/components/data-display/RoleBadge'
import { StatusBadge } from '@/components/data-display/StatusBadge'
import { cloudinaryThumbnail } from '@/lib/cloudinary'
import { validateImageFile } from '@/lib/file-validation'
import { buildFormData } from '@/lib/form-data'
import { useDeleteProfileImageMutation, useUpdateProfileMutation } from '@/features/profile/queries'
import type { ProfileUser } from '@/features/profile/types'


interface ProfileHeaderProps {
  profile: ProfileUser
}


function initials(fullName: string | undefined): string {
  if (!fullName) return '?'
  return fullName.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('')
}


export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const updateMutation = useUpdateProfileMutation()
  const deleteImageMutation = useDeleteProfileImageMutation()
  const [avatarError, setAvatarError] = useState<string | null>(null)


  const handleFileSelected = (file: File | null) => {
    if (!file) return

    const validationError = validateImageFile(file)

    if (validationError) {
      setAvatarError(validationError)
      return
    }

    setAvatarError(null)

    const formData = buildFormData({}, { avatar: file })

    updateMutation.mutate(formData, {
      onSuccess: () => toast.success('Profile photo updated'),
      onError: () => toast.error('Failed to update profile photo'),
    })
  }


  return (
    <Card className="relative overflow-hidden rounded-[24px] border-border/70 bg-card p-0 shadow-[0_1px_3px_rgba(0,0,0,0.025)]">

      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -right-16 -top-24 size-[260px] rounded-full bg-foreground/[0.025] blur-[70px]" />
        <div className="absolute bottom-0 left-0 h-[2px] w-[32%] rounded-r-full bg-foreground/45" />
      </div>


      <div className="relative z-10 flex flex-col gap-6 p-5 sm:p-6 xl:flex-row xl:items-center">

        <div className="relative mx-auto shrink-0 sm:mx-0">

          <Avatar className="size-28 border-4 border-background shadow-[0_10px_30px_rgba(0,0,0,0.12)] sm:size-32">

            <AvatarImage src={profile.avatar.url ? cloudinaryThumbnail(profile.avatar.url, 320) : undefined} alt={profile.fullName} className="object-cover" />

            <AvatarFallback className="bg-muted text-2xl font-semibold tracking-[-0.03em] text-foreground">
              {initials(profile.fullName)}
            </AvatarFallback>

            <AvatarBadge className={profile.isActive ? 'bg-success' : 'bg-muted-foreground/60'} aria-hidden="true" />

          </Avatar>


          <input
            id="avatar-input"
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            className="hidden"
            disabled={updateMutation.isPending}
            onChange={(event) => {
              const file = event.target.files?.[0] ?? null
              handleFileSelected(file)
              event.target.value = ''
            }}
          />


          <Label htmlFor="avatar-input" className="absolute bottom-1 right-1 cursor-pointer">
            <span className="flex size-9 items-center justify-center rounded-xl border border-border/70 bg-card text-muted-foreground shadow-md transition-all hover:bg-foreground hover:text-background">
              <Camera className="size-4" strokeWidth={1.8} />
            </span>
          </Label>

        </div>


        <div className="min-w-0 flex-1 text-center xl:text-left">

          <div className="flex flex-col items-center gap-3 xl:items-start">

            <div>
              <span className="text-[9px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                Account Profile
              </span>

              <h1 className="mt-1.5 text-2xl font-semibold tracking-[-0.035em] text-foreground">
                {profile.fullName}
              </h1>
            </div>


            <div className="flex flex-wrap justify-center gap-2 xl:justify-start">
              <RoleBadge role={profile.role} />

              <StatusBadge label={profile.isActive ? 'Active' : 'Inactive'} tone={profile.isActive ? 'success' : 'neutral'} />

              {profile.department ? (
                <span className="inline-flex items-center rounded-full border border-border/70 bg-muted/30 px-2.5 py-1 text-[10px] font-medium text-muted-foreground">
                  {profile.department}
                </span>
              ) : null}
            </div>


            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Mail className="size-3.5" strokeWidth={1.8} />
              <span className="truncate">{profile.email}</span>
            </div>

          </div>


          {avatarError ? (
            <p className="mt-3 text-xs text-destructive">
              {avatarError}
            </p>
          ) : null}

        </div>

          {profile.avatar.url ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              onClick={() =>
                deleteImageMutation.mutate(undefined, {
                  onSuccess: () => toast.success('Profile image removed'),
                  onError: () => toast.error('Failed to remove profile image'),
                })
              }
              disabled={deleteImageMutation.isPending}
            >
              <Trash2 className="size-3.5" />
              Remove photo
            </Button>
          ) : null}

        </div>


    </Card>
  )
}