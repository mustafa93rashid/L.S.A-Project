import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

/** UserCard's loading placeholder — static, matching the front face's
 * layout and the flip card's real `min-h-92` footprint, so the grid
 * doesn't visibly reflow once real data (and the flip interaction)
 * arrives. Deliberately doesn't flip or animate — there's nothing to
 * reveal yet. */
export function UserCardSkeleton() {
  return (
    <Card className="relative min-h-92 gap-0 py-0">
      <Skeleton className="absolute top-3 right-3 size-7 rounded-full" />

      <CardContent className="flex flex-1 flex-col items-center justify-center gap-3 px-6 pt-8 pb-5">
        <Skeleton className="size-20 rounded-full" />
        <div className="flex flex-col items-center gap-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-40" />
        </div>
        <Skeleton className="h-5 w-24 rounded-full" />
      </CardContent>

      <div className="flex justify-center border-t border-border py-2.5">
        <Skeleton className="h-5 w-24" />
      </div>
    </Card>
  )
}
