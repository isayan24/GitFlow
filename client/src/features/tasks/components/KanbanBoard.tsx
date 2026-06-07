import { Plus, GitBranch, AlertCircle, Clock, MoveRight, Check } from 'lucide-react'
import { useUpdateTaskStatus } from '../api/useUpdateTaskStatus'

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: 'TODO' | 'IN_PROGRESS' | 'COMPLETED';
  type: 'GITHUB_ISSUE' | 'GITHUB_PR' | 'MANUAL';
  githubNumber: number | null;
  githubUrl: string | null;
  images: string[];
  createdAt: string;
  updatedAt: string;
}

interface KanbanBoardProps {
  repoId: string
  tasks: Task[]
  onAddTaskClick: () => void
}

export function KanbanBoard({ repoId, tasks = [], onAddTaskClick }: KanbanBoardProps) {
  const updateTaskStatusMutation = useUpdateTaskStatus()

  const todoTasks = tasks.filter(t => t.status === 'TODO')
  const inProgressTasks = tasks.filter(t => t.status === 'IN_PROGRESS')
  const completedTasks = tasks.filter(t => t.status === 'COMPLETED')

  const getTaskIcon = (type: string) => {
    if (type === 'GITHUB_PR') return <GitBranch size={12} className="text-purple-400" />
    if (type === 'GITHUB_ISSUE') return <AlertCircle size={12} className="text-emerald-400" />
    return <Plus size={12} className="text-indigo-400" />
  }

  const handleStatusChange = (taskId: string, newStatus: 'TODO' | 'IN_PROGRESS' | 'COMPLETED') => {
    updateTaskStatusMutation.mutate({
      taskId,
      status: newStatus,
      repoId,
    })
  }

  const columns = [
    { id: 'TODO' as const, title: 'To Do', tasks: todoTasks, badgeColor: 'bg-muted border border-border text-muted-foreground' },
    { id: 'IN_PROGRESS' as const, title: 'In Progress', tasks: inProgressTasks, badgeColor: 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-400' },
    { id: 'COMPLETED' as const, title: 'Completed', tasks: completedTasks, badgeColor: 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' }
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start mt-2">
      {columns.map(column => (
        <div key={column.id} className="p-4 rounded-2xl border border-border bg-card/25 flex flex-col gap-4 max-h-[70vh]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-foreground">{column.title}</h4>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${column.badgeColor}`}>
                {column.tasks.length}
              </span>
            </div>
            {column.id === 'TODO' && (
              <button
                onClick={onAddTaskClick}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent border border-transparent hover:border-border transition duration-150 cursor-pointer"
                title="Add Task"
              >
                <Plus size={14} />
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col gap-3 min-h-[150px]">
            {column.tasks.length === 0 ? (
              <div className="flex-1 flex items-center justify-center border border-dashed border-border rounded-xl py-10 text-muted-foreground/60 text-xs italic text-center">
                No tasks in this column
              </div>
            ) : (
              column.tasks.map(task => (
                <div
                  key={task.id}
                  className="p-4 rounded-xl border border-border bg-card flex flex-col gap-3 text-left hover:border-accent transition duration-150 group"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h5 className="text-xs font-bold text-foreground leading-snug group-hover:text-primary transition truncate">
                        {task.title}
                      </h5>
                      <div className="shrink-0 p-1 rounded bg-muted border border-border">
                        {getTaskIcon(task.type)}
                      </div>
                    </div>
                    {task.description && (
                      <p className="text-muted-foreground text-[10px] mt-1.5 line-clamp-2 leading-relaxed">
                        {task.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-border/60">
                    <span className="text-[10px] text-muted-foreground/60 font-medium">
                      {task.type === 'MANUAL' ? 'Manual Note' : `#${task.githubNumber}`}
                    </span>

                    <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition duration-150">
                      {column.id !== 'TODO' && (
                        <button
                          onClick={() => handleStatusChange(task.id, 'TODO')}
                          className="p-1 rounded bg-muted hover:bg-accent border border-border text-muted-foreground hover:text-foreground transition duration-150 cursor-pointer"
                          title="Move to Todo"
                        >
                          <Clock size={10} />
                        </button>
                      )}
                      {column.id !== 'IN_PROGRESS' && (
                        <button
                          onClick={() => handleStatusChange(task.id, 'IN_PROGRESS')}
                          className="p-1 rounded bg-muted hover:bg-accent border border-border text-muted-foreground hover:text-primary transition duration-150 cursor-pointer"
                          title="Move to In Progress"
                        >
                          <MoveRight size={10} />
                        </button>
                      )}
                      {column.id !== 'COMPLETED' && (
                        <button
                          onClick={() => handleStatusChange(task.id, 'COMPLETED')}
                          className="p-1 rounded bg-muted hover:bg-accent border border-border text-muted-foreground hover:text-emerald-400 transition duration-150 cursor-pointer"
                          title="Complete Task"
                        >
                          <Check size={10} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
