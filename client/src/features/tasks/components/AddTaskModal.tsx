import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { useCreateTask } from '../api/useCreateTask'

interface AddTaskModalProps {
  repoId: string
  onClose: () => void
}

export function AddTaskModal({ repoId, onClose }: AddTaskModalProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const createTaskMutation = useCreateTask()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    try {
      await createTaskMutation.mutateAsync({
        repoId,
        title,
        description: description || null,
        status: 'TODO'
      })
      setTitle('')
      setDescription('')
      onClose()
    } catch (error) {
      console.error('Error creating manual task:', error)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 shadow-2xl flex flex-col gap-4 text-left">
        <div>
          <h4 className="text-sm font-bold text-foreground">Create Manual Task</h4>
          <p className="text-muted-foreground text-[10px] mt-0.5">Add non-code notes like Figma designs, copy docs, or marketing checklists.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Task Title</label>
            <input
              type="text"
              required
              placeholder="e.g. Set up Figma wireframes"
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
              disabled={createTaskMutation.isPending || !title.trim()}
              className="px-4 py-2 rounded-xl text-xs font-bold text-primary-foreground bg-primary hover:bg-primary/90 shadow-md shadow-primary/10 transition duration-150 disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
            >
              {createTaskMutation.isPending ? (
                <>
                  <Loader2 size={12} className="animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Task'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
