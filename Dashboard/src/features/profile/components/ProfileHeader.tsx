import { useState } from 'react'
import { toast } from 'sonner'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarBadge, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { RoleBadge } from '@/components/data-display/RoleBadge'
import { StatusBadge } from '@/components/data-display/StatusBadge'
import { cloudinaryThumbnail } from '@/lib/cloudinary'
import { validateImageFile } from '@/lib/file-validation'
import { buildFormData } from '@/lib/form-data'
import {
  useDeleteProfileImageMutation,
  useUpdateProfileMutation,
} from '@/features/profile/queries'
import type { ProfileUser } from '@/features/profile/types'

interface ProfileHeaderProps {
  profile: ProfileUser
}

function initials(fullName: string | undefined): string {
  if (!fullName) return '?'
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('')
}

/**
 * Identity strip at the top of Account Settings — a large avatar plus who
 * this account is, not a decorative hero. Change/Remove photo are
 * deliberately small, secondary controls tucked under the avatar rather
 * than competing with the identity text for attention.
 *
 * Fully self-contained: picking a new photo uploads it immediately (the
 * same `PATCH /users/profile` multipart endpoint Personal Information
 * uses, just with an avatar-only body — the backend accepts a file with no
 * text fields), rather than gating it behind Personal Information's own
 * Save Changes. That keeps the header's action doing what it visibly
 * promises instead of silently queuing a change for an unrelated button.
 */
export function ProfileHeader({ profile }: ProfileHeaderProps) {
  const updateMutation = useUpdateProfileMutation()
  const deleteImageMutation = useDeleteProfileImageMutation()
  const [avatarError, setAvatarError] = useState<string | null>(null)

  function handleFileSelected(file: File | null) {
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
    <Card>
      <CardContent className="flex flex-col items-center gap-4 py-8 text-center sm:flex-row sm:items-center sm:gap-6 sm:text-left">
        <div className="relative shrink-0">
          <Avatar className="size-28 shadow-card">
            <AvatarImage
              src={
                profile.avatar.url
                  ? cloudinaryThumbnail(profile.avatar.url, 112)
                  : undefined
              }
              alt={profile.fullName}
            />
            <AvatarFallback className="text-2xl font-semibold">
              {initials(profile.fullName)}
            </AvatarFallback>
            <AvatarBadge
              className={profile.isActive ? 'bg-success' : 'bg-muted-foreground/60'}
              aria-hidden="true"
            />
          </Avatar>
          <span className="sr-only">
            {profile.isActive ? 'Active account' : 'Inactive account'}
          </span>
        </div>

        <div className="flex min-w-0 flex-1 flex-col items-center gap-3 sm:items-start">
          <div className="flex flex-col items-center gap-1.5 sm:items-start">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              {profile.fullName}
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <RoleBadge role={profile.role} />
              {profile.department ? (
                <span className="text-sm text-muted-foreground">
                  {profile.department}
                </span>
              ) : null}
            </div>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
          </div>

          <div className="flex flex-col items-center gap-1.5 sm:items-start">
            <div className="flex items-center gap-2">
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
              <Label htmlFor="avatar-input">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={updateMutation.isPending}
                  asChild
                >
                  <span>{updateMutation.isPending ? 'Uploading…' : 'Change photo'}</span>
                </Button>
              </Label>
              {profile.avatar.url ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    deleteImageMutation.mutate(undefined, {
                      onSuccess: () => toast.success('Profile image removed'),
                      onError: () => toast.error('Failed to remove profile image'),
                    })
                  }
                  disabled={deleteImageMutation.isPending}
                >
                  Remove
                </Button>
              ) : null}
            </div>
            {avatarError ? (
              <p className="text-xs text-destructive">{avatarError}</p>
            ) : null}
          </div>
        </div>

        <div className="shrink-0">
          <StatusBadge
            label={profile.isActive ? 'Active' : 'Inactive'}
            tone={profile.isActive ? 'success' : 'neutral'}
          />
        </div>
      </CardContent>
    </Card>
  )
}
