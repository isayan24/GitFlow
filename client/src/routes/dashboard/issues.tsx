import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { useProjectDetails } from '../../features/projects/api/useProjectDetails'
import { IssuesList } from '../../features/tasks/components/IssuesList'
import { AddTaskModal } from '../../features/tasks/components/AddTaskModal'
import { useDashboardStore } from '@/store/useDashboardStore'
import { AlertCircle } from 'lucide-react'

export const Route = createFileRoute('/dashboard/issues')({
  component: IssuesRoute,
})

function IssuesRoute() {
  const selectedRepoId = useDashboardStore((state) => state.selectedRepoId)
  const navigate = useNavigate()
  const [showAddTaskModal, setShowAddTaskModal] = useState(false)

  const { data: activeRepoDetails } = useProjectDetails(selectedRepoId)

  if (!selectedRepoId) {
    return (
      <div className="max-w-5xl mx-auto text-center py-20 border border-dashed border-border rounded-2xl flex flex-col items-center justify-center gap-3 text-left">
        <AlertCircle size={32} className="text-muted-foreground/45 stroke-[1.5] self-center" />
        <span className="text-muted-foreground text-sm">Please select a workspace to view its active tasks and issues.</span>
        <button
          onClick={() => navigate({ to: '/dashboard/projects' })}
          className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/90 transition cursor-pointer"
        >
          View Workspaces
        </button>
      </div>
    )
  }

  return (
    <>
      <IssuesList
        repoName={activeRepoDetails?.name || ''}
        repoOwner={activeRepoDetails?.owner || ''}
        tasks={activeRepoDetails?.tasks || []}
        onAddTaskClick={() => setShowAddTaskModal(true)}
      />

      {showAddTaskModal && selectedRepoId && (
        <AddTaskModal
          repoId={selectedRepoId}
          onClose={() => setShowAddTaskModal(false)}
        />
      )}
    </>
  )
}
