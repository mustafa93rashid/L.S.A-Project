import { useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { ApiError } from '@/types/api'
import { ROLE_LABELS, type Role } from '@/constants/roles'
import { useUpdateUserRoleMutation } from '@/features/users/queries'
import { ROLE_CHANGE_ROLES } from '@/features/users/schema'
import type { User } from '@/features/users/types'

interface ChangeRoleDialogProps {
  user: User | null
  onOpenChange: (open: boolean) => void
}

export function ChangeRoleDialog({ user, onOpenChange }: ChangeRoleDialogProps) {
  const [role, setRole] = useState<Role | ''>('')
  const roleMutation = useUpdateUserRoleMutation()

  const open = Boolean(user)
  const currentRole = role || user?.role || ''
  const isUnchanged = !currentRole || currentRole === user?.role

  const handleSave = () => {
    if (!user || !currentRole || isUnchanged) return
    roleMutation.mutate(
      { id: user._id, role: currentRole as Role },
      {
        onSuccess: () => {
          toast.success('User role updated successfully')
          setRole('')
          onOpenChange(false)
        },
        onError: (error) => {
          toast.error(error instanceof ApiError ? error.message : 'Failed to update role')
        },
      },
    )
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setRole('')
        onOpenChange(next)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change role</DialogTitle>
          <DialogDescription>
            Change the role for {user?.fullName}. Current role:{' '}
            {user ? ROLE_LABELS[user.role] : '—'}.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-1.5 py-2">
          <Label htmlFor="change-role">Role</Label>
          <Select value={currentRole} onValueChange={(value) => setRole(value as Role)}>
            <SelectTrigger id="change-role">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLE_CHANGE_ROLES.map((value) => (
                <SelectItem key={value} value={value}>
                  {ROLE_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={roleMutation.isPending || isUnchanged}
          >
            {roleMutation.isPending ? 'Saving…' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
