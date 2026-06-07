import { AlertCircle, Plus } from 'lucide-react'

interface Task {
  id: string
  title: string
  description: string | null
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED'
  type: 'GITHUB_ISSUE' | 'GITHUB_PR' | 'MANUAL'
  githubNumber: number | null
  githubUrl: string | null
  createdAt: string
  updatedAt: string
}

interface IssuesListProps {
  repoName: string
  repoOwner: string
  tasks: Task[]
  onAddTaskClick: () => void
}

export function IssuesList({ repoName, repoOwner, tasks = [], onAddTaskClick }: IssuesListProps) {
  const getStatusBadge = (status: string) => {
    if (status === 'COMPLETED') return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
    if (status === 'IN_PROGRESS') return 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
    return 'bg-muted border border-border text-muted-foreground'
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6 text-left">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-extrabold tracking-tight text-foreground font-sans">Tasks & GitHub Issues</h3>
          <p className="text-muted-foreground text-sm mt-1">Full registry of telemetry tasks for {repoOwner}/{repoName}.</p>
        </div>
        <button
          onClick={onAddTaskClick}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl text-primary-foreground bg-primary hover:bg-primary/90 shadow-md shadow-primary/10 transition cursor-pointer"
        >
          <Plus size={14} /> New Task
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-20 border border-border rounded-2xl flex flex-col items-center justify-center gap-3">
          <AlertCircle size={32} className="text-muted-foreground/35 stroke-[1.5] self-center" />
          <span className="text-muted-foreground text-sm">No tasks or issues imported for this project.</span>
        </div>
      ) : (
        <div className="border border-border rounded-2xl bg-card/20 overflow-hidden">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/65 text-muted-foreground font-semibold">
                <th className="p-4">Task / Issue</th>
                <th className="p-4">Source</th>
                <th className="p-4">Status</th>
                <th className="p-4">Updated</th>
                <th className="p-4 text-right">Link</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className="border-b border-border/50 hover:bg-accent/40 transition duration-150">
                  <td className="p-4">
                    <div className="flex flex-col gap-1 max-w-md">
                      <span className="font-bold text-foreground">{task.title}</span>
                      {task.description && (
                        <span className="text-muted-foreground text-3xs truncate">{task.description}</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="capitalize text-muted-foreground font-medium font-sans">
                      {task.type === 'MANUAL' ? 'Manual Note' : task.type.replace('GITHUB_', '').toLowerCase()}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-semibold ${getStatusBadge(task.status)}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {new Date(task.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right font-sans">
                    {task.githubUrl ? (
                      <a
                        href={task.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:text-primary/90 font-semibold"
                      >
                        View ↗
                      </a>
                    ) : (
                      <span className="text-muted-foreground/60">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
