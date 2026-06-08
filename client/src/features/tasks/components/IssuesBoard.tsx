import { useState } from 'react'
import { Plus, GitBranch, AlertCircle, ListTodo, Search, Filter, Check, Clock } from 'lucide-react'
import { IssueDetailModal } from './IssueDetailModal'

interface ChecklistItem {
  id: string;
  title: string;
  description: string | null;
  status: 'PENDING' | 'DONE';
  imageUrl: string | null;
}

interface Issue {
  id: string;
  title: string;
  description: string | null;
  status: 'OPEN' | 'CLOSED';
  type: 'GITHUB_ISSUE' | 'GITHUB_PR' | 'MANUAL';
  githubNumber: number | null;
  githubUrl: string | null;
  checklists: ChecklistItem[];
  createdAt: string;
  updatedAt: string;
}

interface IssuesBoardProps {
  repoId: string
  issues: Issue[]
  onAddIssueClick: () => void
}

type FilterStatus = 'ALL' | 'OPEN' | 'CLOSED';

export function IssuesBoard({ repoId, issues = [], onAddIssueClick }: IssuesBoardProps) {
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

  // Filter and search logic
  const filteredIssues = issues.filter(issue => {
    const matchesStatus = statusFilter === 'ALL' || issue.status === statusFilter;
    const matchesSearch = searchQuery.trim() === '' || 
      issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (issue.description && issue.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (issue.githubNumber && issue.githubNumber.toString().includes(searchQuery));
    return matchesStatus && matchesSearch;
  });


  const getStatusBadge = (status: 'OPEN' | 'CLOSED') => {
    switch (status) {
      case 'OPEN':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border bg-indigo-500/10 border-indigo-500/25 text-indigo-400 font-bold">
            <Clock size={10} /> Open
          </span>
        )
      case 'CLOSED':
        return (
          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border bg-emerald-500/10 border-emerald-500/25 text-emerald-400 font-bold">
            <Check size={10} /> Closed
          </span>
        )
    }
  }

  // Find the fresh version of the currently selected issue if the parent array updates
  const activeIssue = selectedIssue
    ? issues.find(i => i.id === selectedIssue.id) || null
    : null;

  return (
    <div className="flex flex-col gap-5 mt-2">
      {/* Header controls: Search & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl border border-border bg-card/15">
        <div className="flex flex-wrap items-center gap-2">
          {(['ALL', 'OPEN', 'CLOSED'] as FilterStatus[]).map(status => {
            const count = status === 'ALL' 
              ? issues.length 
              : issues.filter(i => i.status === status).length;
            
            const isActive = statusFilter === status;

            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition duration-150 flex items-center gap-1.5 cursor-pointer ${
                  isActive 
                    ? 'bg-primary border-primary text-primary-foreground shadow-sm'
                    : 'bg-secondary border-border text-muted-foreground hover:text-foreground hover:bg-secondary/80'
                }`}
              >
                {status === 'ALL' && 'All Issues'}
                {status === 'OPEN' && 'Open'}
                {status === 'CLOSED' && 'Closed'}
                <span className={`text-[10px] px-1.5 py-0.2 rounded-md ${
                  isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
            <input
              type="text"
              placeholder="Search workspace issues..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-border bg-muted/30 focus:border-primary outline-none text-foreground placeholder:text-muted-foreground/30 transition"
            />
          </div>

          <button
            onClick={onAddIssueClick}
            className="px-4 py-2 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/90 shadow-md shadow-primary/10 transition flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <Plus size={14} /> New Issue
          </button>
        </div>
      </div>

      {/* Issues Grid layout */}
      {filteredIssues.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-dashed border-border rounded-2xl py-24 text-center gap-3">
          <Filter size={32} className="text-muted-foreground/35 stroke-[1.2]" />
          <div className="text-center">
            <h4 className="text-sm font-bold text-foreground">No issues found</h4>
            <p className="text-muted-foreground text-xs mt-1 max-w-xs leading-relaxed">
              {searchQuery.trim() !== '' 
                ? "We couldn't find any issues matching your search terms. Try refining your keywords." 
                : "No issues in this category. Click 'New Issue' above to create one."
              }
            </p>
          </div>
          {searchQuery.trim() !== '' && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-xs text-primary font-bold hover:underline cursor-pointer"
            >
              Clear Search Query
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col border border-border/80 bg-card/25 rounded-2xl overflow-hidden divide-y divide-border/60">
          {filteredIssues.map(issue => {
            const checklists = issue.checklists || []
            const totalSubIssues = checklists.length
            const completedSubIssues = checklists.filter(t => t.status === 'DONE').length
            const progressPct = totalSubIssues > 0 ? (completedSubIssues / totalSubIssues) * 100 : 0

            return (
              <div
                key={issue.id}
                onClick={() => setSelectedIssue(issue)}
                className="flex items-center justify-between p-4 hover:bg-muted/30 transition duration-150 cursor-pointer select-none group gap-4 text-left"
              >
                {/* Left side: Icon + Title + Meta info */}
                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                  {/* Status/Type Icon */}
                  <div className="mt-0.5 shrink-0">
                    {issue.status === 'CLOSED' ? (
                      <Check size={16} className="text-emerald-400" />
                    ) : issue.type === 'GITHUB_PR' ? (
                      <GitBranch size={16} className="text-purple-400" />
                    ) : (
                      <AlertCircle size={16} className="text-emerald-400" />
                    )}
                  </div>

                  {/* Title and metadata */}
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-xs font-bold text-foreground group-hover:text-primary transition truncate">
                        {issue.title}
                      </span>
                      {/* Source/Type badge */}
                      <span className={`text-[9px] px-2 py-0.2 rounded-full border font-semibold ${
                        issue.type === 'GITHUB_PR' 
                          ? 'text-purple-400 bg-purple-500/5 border-purple-500/20' 
                          : issue.type === 'GITHUB_ISSUE' 
                            ? 'text-emerald-400 bg-emerald-500/5 border-emerald-500/20' 
                            : 'text-indigo-400 bg-indigo-500/5 border-indigo-500/20'
                      }`}>
                        {issue.type === 'GITHUB_PR' ? 'PR' : issue.type === 'GITHUB_ISSUE' ? 'Issue' : 'Manual'}
                      </span>
                    </div>

                    {/* Metadata line */}
                    <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60 flex-wrap">
                      {issue.githubNumber ? (
                        <span className="font-semibold text-muted-foreground/85 flex items-center gap-0.5">
                          #{issue.githubNumber}
                        </span>
                      ) : (
                        <span>local</span>
                      )}
                      <span>•</span>
                      <span>updated {new Date(issue.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      {issue.description && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[300px] italic font-medium">{issue.description}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right side: Checklist progress & Status badge */}
                <div className="flex items-center gap-6 shrink-0">
                  {/* Checklist progress */}
                  {totalSubIssues > 0 ? (
                    <div className="flex flex-col items-end gap-1.5 w-28 md:w-36">
                      <div className="flex justify-between items-center text-[10px] text-muted-foreground/80 font-bold w-full">
                        <span className="flex items-center gap-1 text-2xs">
                          <ListTodo size={10} className="text-muted-foreground/60 shrink-0" />
                          {completedSubIssues}/{totalSubIssues} steps
                        </span>
                        <span>{Math.round(progressPct)}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-1 overflow-hidden border border-border/10">
                        <div
                          className="bg-primary h-full rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <span className="text-[10px] text-muted-foreground/45 italic font-medium hidden md:inline-flex items-center gap-1 w-28 md:w-36 justify-end">
                      No steps
                    </span>
                  )}

                  {/* Status Badge */}
                  <div className="w-20 flex justify-end">
                    {getStatusBadge(issue.status)}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Issue Detail Modal */}
      {activeIssue && (
        <IssueDetailModal
          issue={activeIssue}
          repoId={repoId}
          onClose={() => setSelectedIssue(null)}
        />
      )}
    </div>
  )
}
