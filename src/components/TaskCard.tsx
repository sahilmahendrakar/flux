import { Draggable } from '@hello-pangea/dnd';
import { Task } from '../types';
import AgentBadge from './AgentBadge';

const STATUS_DOT: Record<Task['status'], string> = {
  'in-progress': 'bg-emerald-600/90 dark:bg-emerald-400/80',
  'needs-input': 'bg-amber-600/90 dark:bg-amber-400/80',
  backlog: 'bg-flux-muted',
  done: 'bg-flux-muted',
};

interface Props {
  task: Task;
  index: number;
  onDelete: (id: string) => void;
  onCardClick: (id: string) => void;
}

export default function TaskCard({ task, index, onDelete, onCardClick }: Props) {
  const isNeedsInput = task.status === 'needs-input';
  const isDone = task.status === 'done';

  return (
    <Draggable draggableId={task.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`group rounded-md border border-flux-line bg-flux-card shadow-sm transition-colors ${
            isNeedsInput ? 'border-l-[3px] border-l-amber-600/70 dark:border-l-amber-400/65' : ''
          } ${isDone ? 'opacity-55' : ''} ${
            snapshot.isDragging
              ? 'border-flux-line-strong bg-flux-card-active shadow-lg ring-1 ring-flux-tint/10'
              : 'hover:border-flux-line-strong hover:bg-flux-card-hover'
          }`}
        >
          <div
            {...provided.dragHandleProps}
            className="cursor-grab rounded-md p-3 active:cursor-grabbing"
          >
            <div
              role="presentation"
              onClick={() => onCardClick(task.id)}
              className="cursor-grab"
            >
              <div className="flex items-start justify-between gap-2">
                <p
                  className={`text-[13px] font-medium leading-snug tracking-tight break-words ${
                    isDone
                      ? 'text-flux-muted line-through decoration-flux-line-strong'
                      : 'text-flux-fg-soft'
                  }`}
                >
                  {task.title}
                </p>
                <button
                  type="button"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(task.id);
                  }}
                  className="shrink-0 cursor-pointer rounded px-1.5 py-0.5 text-[13px] leading-none text-flux-subtle opacity-0 transition hover:bg-flux-tint/[0.08] hover:text-flux-fg-soft group-hover:opacity-100"
                  aria-label="Delete task"
                >
                  ×
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <AgentBadge agent={task.agent} />
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[task.status]}`}
                  aria-hidden
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
