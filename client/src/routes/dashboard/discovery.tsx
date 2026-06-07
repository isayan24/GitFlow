import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { DiscoveryWizard } from '../../features/projects/components/DiscoveryWizard'
import { useDashboardStore } from '@/store/useDashboardStore'

export const Route = createFileRoute('/dashboard/discovery')({
  component: DiscoveryRoute,
})

function DiscoveryRoute() {
  const setSelectedRepoId = useDashboardStore((state) => state.setSelectedRepoId)
  const navigate = useNavigate()

  return (
    <DiscoveryWizard
      onImportSuccess={(newRepoId) => {
        setSelectedRepoId(newRepoId)
        navigate({ to: '/dashboard/projects/$projectId', params: { projectId: newRepoId } })
      }}
    />
  )
}
