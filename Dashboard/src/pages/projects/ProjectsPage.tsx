import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { CheckCircle2, Eye, FolderKanban, ImageIcon, Pencil, Plus, Sparkles, Trash2 } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CollectionCard, CollectionCardSkeleton } from '@/components/collection-card'
import { ConfirmDialog } from '@/components/overlays/ConfirmDialog'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { ApiError } from '@/types/api'
import { cloudinaryThumbnail } from '@/lib/cloudinary'
import { useDeleteProjectMutation, useProjectsQuery } from '@/features/projects/queries'
import type { Project } from '@/features/projects/types'
import { SectionHeader } from '@/components/layout/SectionHeader'


export default function ProjectsPage() {
  const { data, isLoading, isError, refetch } = useProjectsQuery()
  const deleteMutation = useDeleteProjectMutation()
  const [deletingProject, setDeletingProject] = useState<Project | null>(null)

  const projects = data ?? []

  const featuredCount = projects.filter((project) => project.isFeatured && project.isActive).length


  const handleDelete = () => {
    if (!deletingProject) return

    deleteMutation.mutate(deletingProject._id, {
      onSuccess: () => {
        toast.success('Project deleted successfully')
        setDeletingProject(null)
      },
      onError: (error) => {
        toast.error(error instanceof ApiError ? error.message : 'Failed to delete project')
      },
    })
  }


  return (
    <PageContainer>
      <div className="space-y-7">
        <PageHeader
          title="Projects"
          description="Manage the project case studies displayed across the public website."
          action={
            <Button type="button" asChild size="lg">
              <Link to="/projects/new">
                <Plus className="size-4" strokeWidth={1.8} />
                Add project
              </Link>
            </Button>
          }
        />


        <section>
<SectionHeader
  eyebrow="Project Management"
  title="Project Collection"
  description="Manage project visibility, featured case studies and public presentation."
  icon={Sparkles}
  statLabel="Featured"
  statValue={featuredCount}
  showStat={!isLoading && !isError}
/>


          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <CollectionCardSkeleton key={index} />
              ))}
            </div>
          ) : isError ? (
            <div className="rounded-[22px] border border-border/70 bg-card px-6 py-12">
              <ErrorState description="Projects could not be loaded." onRetry={() => refetch()} />
            </div>
          ) : projects.length === 0 ? (
            <div className="rounded-[22px] border border-border/70 bg-card px-6 py-12">
              <EmptyState
                icon={FolderKanban}
                title="No projects yet"
                description="Add a project to display it on the public website."
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {projects.map((project) => (
                <CollectionCard
                  key={project._id}
                  image={
                    project.cardImage?.url ? (
                      <img
                        src={cloudinaryThumbnail(project.cardImage.url, 720)}
                        alt={project.cardImage.alt || project.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted-foreground/35">
                        <ImageIcon className="size-7" strokeWidth={1.5} />
                      </div>
                    )
                  }
                  badges={
                    <>
                      <Badge
                        variant={project.isActive ? 'success' : 'secondary'}
                        className="border-white/10 shadow-sm backdrop-blur-md"
                      >
                        {project.isActive ? 'Active' : 'Inactive'}
                      </Badge>

                      {project.isFeatured ? (
                        <Badge variant="info" className="border-white/10 shadow-sm backdrop-blur-md">
                          Featured
                        </Badge>
                      ) : null}
                    </>
                  }
                  actions={
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Edit ${project.title}`}
                        className="size-7 text-white/80 hover:bg-white/15 hover:text-white"
                        asChild
                      >
                        <Link to={`/projects/${project._id}/edit`}>
                          <Pencil className="size-3.5" strokeWidth={1.8} />
                        </Link>
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Delete ${project.title}`}
                        className="size-7 text-white/75 hover:bg-destructive/30 hover:text-white"
                        onClick={() => setDeletingProject(project)}
                      >
                        <Trash2 className="size-3.5" strokeWidth={1.8} />
                      </Button>
                    </>
                  }
                  overlayLeft={project.categoryLabel}
                  overlayRight={`#${project.displayOrder}`}
                  eyebrow="Project"
                  icon={FolderKanban}
                  title={project.title}
                  description={project.shortDescription ?? project.description ?? 'No project description available.'}
                  footerLeft={{
                    icon: CheckCircle2,
                    label: 'Category',
                    value: project.categoryLabel || '—',
                  }}
                  footerRight={{
                    icon: Eye,
                    label: 'Featured',
                    value: project.isFeatured ? 'Featured' : 'Standard',
                  }}
                  active={project.isActive}
                />
              ))}
            </div>
          )}
        </section>


        <ConfirmDialog
          open={Boolean(deletingProject)}
          onOpenChange={(open) => !open && setDeletingProject(null)}
          title="Delete project"
          description={`Are you sure you want to delete "${deletingProject?.title}"? This cannot be undone.`}
          variant="destructive"
          confirmLabel="Delete"
          onConfirm={handleDelete}
          isLoading={deleteMutation.isPending}
        />
      </div>
    </PageContainer>
  )
}