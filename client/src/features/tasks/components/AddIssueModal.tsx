import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useCreateIssue } from '../api/useCreateIssue'

interface AddIssueModalProps {
  repoId: string
  onClose: () => void
}

export function AddIssueModal({ repoId, onClose }: AddIssueModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const createIssueMutation = useCreateIssue()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    try {
      await createIssueMutation.mutateAsync({
        repositoryId: repoId,
        title,
        description: description || '',
        type: 'GITHUB_ISSUE',
        status: 'OPEN'
      })
      setTitle('')
      setDescription('')
      onClose()
    } catch (error) {
      console.error('Error creating issue:', error)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl flex flex-col gap-4 text-left animate-slide-up">
        <div>
          <h4 className="text-sm font-bold text-foreground">Create New Issue</h4>
          <p className="text-muted-foreground text-[10px] mt-0.5">Define a new issue. It will be automatically created on GitHub and synced locally.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Issue Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Implement Clerk Auth flow"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/60 focus:border-primary outline-none text-xs text-foreground placeholder:text-muted-foreground/30 transition"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Description (Optional)</label>
            <textarea
              placeholder="Details, requirements, or links..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3.5 py-2.5 rounded-xl border border-border bg-muted/60 focus:border-primary outline-none text-xs text-foreground placeholder:text-muted-foreground/30 transition resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-border bg-transparent hover:bg-muted text-xs font-bold text-muted-foreground hover:text-foreground transition duration-150 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createIssueMutation.isPending || !title.trim()}
              className="px-4 py-2 rounded-xl text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/90 shadow-md shadow-primary/10 transition duration-150 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              {createIssueMutation.isPending ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Issue'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
