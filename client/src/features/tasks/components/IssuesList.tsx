import { AlertCircle, Plus } from 'lucide-react'

interface Issue {
  id: string
  title: string
  description: string | null
  status: 'OPEN' | 'CLOSED'
  type: 'GITHUB_ISSUE' | 'GITHUB_PR' | 'MANUAL'
  githubNumber: number | null
  githubUrl: string | null
  createdAt: string
  updatedAt: string
}

interface IssuesListProps {
  repoName: string
  repoOwner: string
  issues: Issue[]
  onAddIssueClick: () => void
}

export function IssuesList({ repoName, repoOwner, issues = [], onAddIssueClick }: IssuesListProps) {
  const getStatusBadge = (status: string) => {
    if (status === 'CLOSED') return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
    return 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
  }

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-6 text-left animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-extrabold tracking-tight text-foreground font-sans">Issues & GitHub Sync</h3>
          <p className="text-muted-foreground text-sm mt-1">Full registry of telemetry issues for {repoOwner}/{repoName}.</p>
        </div>
        <button
          onClick={onAddIssueClick}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-xl text-primary-foreground bg-primary hover:bg-primary/90 shadow-md shadow-primary/10 transition cursor-pointer"
        >
          <Plus size={14} /> New Issue
        </button>
      </div>

      {issues.length === 0 ? (
        <div className="text-center py-20 border border-border rounded-2xl flex flex-col items-center justify-center gap-3">
          <AlertCircle size={32} className="text-muted-foreground/35 stroke-[1.5] self-center" />
          <span className="text-muted-foreground text-sm">No issues imported for this project.</span>
        </div>
      ) : (
        <div className="border border-border rounded-2xl bg-card/20 overflow-hidden">
          <table className="w-full border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/65 text-muted-foreground font-semibold">
                <th className="p-4">Issue</th>
                <th className="p-4">Source</th>
                <th className="p-4">Status</th>
                <th className="p-4">Updated</th>
                <th className="p-4 text-right">Link</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue) => (
                <tr key={issue.id} className="border-b border-border/50 hover:bg-accent/40 transition duration-150">
                  <td className="p-4">
                    <div className="flex flex-col gap-1 max-w-md">
                      <span className="font-bold text-foreground">{issue.title}</span>
                      {issue.description && (
                        <span className="text-muted-foreground text-3xs truncate">{issue.description}</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="capitalize text-muted-foreground font-medium font-sans">
                      {issue.type === 'MANUAL' ? 'Local Workspace' : issue.type.replace('GITHUB_', '').toLowerCase()}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-semibold ${getStatusBadge(issue.status)}`}>
                      {issue.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4 text-muted-foreground">
                    {new Date(issue.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right font-sans">
                    {issue.githubUrl ? (
                      <a
                          href={issue.githubUrl}
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
