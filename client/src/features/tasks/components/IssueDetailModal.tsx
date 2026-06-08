import { useState } from 'react'
import { X, Plus, Trash2, GitBranch, AlertCircle, Check, ExternalLink, ListTodo, Loader2, Image as ImageIcon } from 'lucide-react'
import { useUpdateIssueStatus } from '../api/useUpdateIssueStatus'
import { useCreateChecklistItem, useUpdateChecklistItem, useDeleteChecklistItem } from '../api/useChecklist'

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

interface IssueDetailModalProps {
  issue: Issue
  repoId: string
  onClose: () => void
}

export function IssueDetailModal({ issue, repoId, onClose }: IssueDetailModalProps) {
  const updateStatusMutation = useUpdateIssueStatus()
  const createChecklistItemMutation = useCreateChecklistItem()
  const updateChecklistItemMutation = useUpdateChecklistItem()
  const deleteChecklistItemMutation = useDeleteChecklistItem()

  const [newSubIssueTitle, setNewSubIssueTitle] = useState('')
  const [newSubIssueImageUrl, setNewSubIssueImageUrl] = useState('')
  const [showImageUrlField, setShowImageUrlField] = useState(false)
  const [submittingSubIssue, setSubmittingSubIssue] = useState(false)

  const checklists = issue.checklists || []
  const totalSubIssues = checklists.length
  const completedSubIssues = checklists.filter(t => t.status === 'DONE').length

  const handleStatusChange = (newStatus: 'OPEN' | 'CLOSED') => {
    updateStatusMutation.mutate({
      issueId: issue.id,
      status: newStatus,
      repoId,
    })
  }

  const handleAddSubIssue = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSubIssueTitle.trim() || submittingSubIssue) return

    setSubmittingSubIssue(true)
    try {
      await createChecklistItemMutation.mutateAsync({
        issueId: issue.id,
        title: newSubIssueTitle.trim(),
        imageUrl: newSubIssueImageUrl.trim() || undefined,
        repoId,
      })
      setNewSubIssueTitle('')
      setNewSubIssueImageUrl('')
      setShowImageUrlField(false)
    } catch (err) {
      console.error('Failed to create checklist item:', err)
    } finally {
      setSubmittingSubIssue(false)
    }
  }

  const handleToggleSubIssue = (subIssueId: string, currentStatus: 'PENDING' | 'DONE') => {
    const newStatus = currentStatus === 'DONE' ? 'PENDING' : 'DONE'
    updateChecklistItemMutation.mutate({
      checklistId: subIssueId,
      status: newStatus,
      repoId,
    })
  }

  const handleDeleteSubIssue = (subIssueId: string) => {
    if (confirm('Are you sure you want to delete this checklist item?')) {
      deleteChecklistItemMutation.mutate({
        checklistId: subIssueId,
        repoId,
      })
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-fade-in">
      <div 
        className="w-full max-w-2xl bg-card border border-border rounded-2xl shadow-xl flex flex-col max-h-[85vh] text-left animate-slide-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between p-6 border-b border-border">
          <div className="flex items-start gap-3.5">
            <div className="mt-1 p-2 rounded-xl bg-muted border border-border">
              {issue.type === 'GITHUB_PR' ? (
                <GitBranch size={18} className="text-purple-400" />
              ) : issue.type === 'GITHUB_ISSUE' ? (
                <AlertCircle size={18} className="text-emerald-400" />
              ) : (
                <ListTodo size={18} className="text-indigo-400" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground leading-snug pr-4">{issue.title}</h3>
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${
                  issue.type === 'GITHUB_PR' 
                    ? 'text-purple-400 bg-purple-500/5 border-purple-500/20' 
                    : issue.type === 'GITHUB_ISSUE' 
                      ? 'text-emerald-400 bg-emerald-500/5 border-emerald-500/20' 
                      : 'text-indigo-400 bg-indigo-500/5 border-indigo-500/20'
                }`}>
                  {issue.type === 'GITHUB_PR' ? 'PR' : issue.type === 'GITHUB_ISSUE' ? 'Issue' : 'Manual'}
                </span>
                {issue.githubNumber && (
                  <a 
                    href={issue.githubUrl || '#'} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-[10px] text-muted-foreground hover:text-primary flex items-center gap-1 border border-border bg-muted/50 px-2 py-0.5 rounded-full font-medium"
                  >
                    #{issue.githubNumber}
                    <ExternalLink size={10} />
                  </a>
                )}
              </div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent hover:border-border transition duration-150 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-6 flex flex-col gap-6">
          {/* Description */}
          {issue.description && (
            <div>
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Description</h4>
              <div className="p-4 rounded-xl border border-border bg-muted/30 text-sm text-foreground/80 leading-relaxed max-h-36 overflow-y-auto no-scrollbar">
                {issue.description}
              </div>
            </div>
          )}

          {/* Status Settings */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border bg-muted/20">
            <div>
              <h5 className="text-sm font-bold text-foreground">Issue Status</h5>
              <p className="text-xs text-muted-foreground mt-0.5">Select the current progress status</p>
            </div>
            <select
              value={issue.status}
              onChange={(e) => handleStatusChange(e.target.value as any)}
              className="bg-card border border-border text-foreground text-xs rounded-xl font-bold px-3 py-2 focus:border-primary outline-none cursor-pointer"
            >
              <option value="OPEN">Open</option>
              <option value="CLOSED">Closed (Close Issue)</option>
            </select>
          </div>

          {/* Sub-issues Checklist */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <ListTodo size={13} />
                Steps Checklist
              </h4>
              <span className="text-xs text-muted-foreground font-semibold">
                {completedSubIssues}/{totalSubIssues} completed
              </span>
            </div>

            {/* Checklist Progress Bar */}
            {totalSubIssues > 0 && (
              <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden border border-border/10 mb-4">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${(completedSubIssues / totalSubIssues) * 100}%` }}
                />
              </div>
            )}

            {/* Add SubIssue Input Form */}
            <form onSubmit={handleAddSubIssue} className="flex flex-col gap-2.5 mb-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newSubIssueTitle}
                  onChange={(e) => setNewSubIssueTitle(e.target.value)}
                  placeholder="Add a new checklist step..."
                  className="flex-1 bg-card border border-border text-xs rounded-xl px-4 py-2.5 outline-none focus:border-primary placeholder:text-muted-foreground/50 transition duration-150"
                />
                <button
                  type="button"
                  onClick={() => setShowImageUrlField(!showImageUrlField)}
                  className={`p-2.5 border rounded-xl hover:bg-muted transition duration-150 flex items-center justify-center cursor-pointer ${
                    showImageUrlField || newSubIssueImageUrl ? 'text-primary border-primary/30 bg-primary/5' : 'text-muted-foreground border-border'
                  }`}
                  title="Add Image URL"
                >
                  <ImageIcon size={14} />
                </button>
                <button
                  type="submit"
                  disabled={!newSubIssueTitle.trim() || submittingSubIssue}
                  className="px-4 py-2.5 bg-primary text-primary-foreground text-xs font-bold rounded-xl hover:bg-primary/95 disabled:opacity-50 disabled:cursor-not-allowed transition duration-150 flex items-center justify-center cursor-pointer"
                >
                  {submittingSubIssue ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                </button>
              </div>

              {showImageUrlField && (
                <div className="animate-slide-up flex gap-2">
                  <input
                    type="url"
                    value={newSubIssueImageUrl}
                    onChange={(e) => setNewSubIssueImageUrl(e.target.value)}
                    placeholder="Paste screenshot/image URL here..."
                    className="flex-1 bg-card border border-border text-2xs rounded-xl px-4 py-2 outline-none focus:border-primary placeholder:text-muted-foreground/40 transition duration-150"
                  />
                </div>
              )}
            </form>

            {/* Checklist items list */}
            {checklists.length === 0 ? (
              <div className="text-center py-10 border border-dashed border-border rounded-xl text-muted-foreground/60 text-xs italic">
                No checklist steps added yet. Break this issue down into smaller steps.
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {checklists.map(task => (
                  <div 
                    key={task.id}
                    className="flex items-start justify-between p-3.5 rounded-xl border border-border/70 hover:border-border bg-card/65 transition group"
                  >
                    <div 
                      onClick={() => handleToggleSubIssue(task.id, task.status)}
                      className="flex items-start gap-3 cursor-pointer flex-1"
                    >
                      <div className={`mt-0.5 w-5 h-5 rounded-lg border flex items-center justify-center transition duration-150 shrink-0 ${
                        task.status === 'DONE' 
                          ? 'bg-emerald-500 border-emerald-600 text-white shadow-emerald-500/10' 
                          : 'border-border bg-muted/40 hover:border-primary'
                      }`}>
                        {task.status === 'DONE' && <Check size={12} strokeWidth={3} className="animate-fade-in" />}
                      </div>
                      
                      <div className="flex flex-col gap-1.5 text-left flex-1">
                        <span className={`text-xs font-semibold select-none transition ${
                          task.status === 'DONE' 
                            ? 'text-muted-foreground/60 line-through' 
                            : 'text-foreground hover:text-foreground/90'
                        }`}>
                          {task.title}
                        </span>
                        
                        {task.imageUrl && (
                          <div className="mt-1" onClick={(e) => e.stopPropagation()}>
                            <a 
                              href={task.imageUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-block relative rounded-lg border border-border overflow-hidden hover:border-primary transition duration-150 group/img bg-muted/20"
                            >
                              <img 
                                src={task.imageUrl} 
                                alt={task.title} 
                                className="h-12 max-w-[200px] object-cover hover:scale-105 transition duration-150"
                                onError={(e) => {
                                  // Hide on load error
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteSubIssue(task.id)}
                      className="p-1 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 border border-transparent hover:border-destructive/10 transition opacity-0 group-hover:opacity-100 cursor-pointer shrink-0 ml-2 mt-0.5"
                      title="Delete step"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
