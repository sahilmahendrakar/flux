import { Draggable } from '@hello-pangea/dnd';
import { Task } from '../types';
import AgentBadge from './AgentBadge';

const STATUS_DOT: Record<Task['status'], string> = {
  'in-progress': 'bg-green-500',
  'needs-input': 'bg-amber-400',
  'backlog': 'bg-gray-500',
  'done': 'bg-gray-500',
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
          className={`group rounded-md bg-gray-800 shadow-sm transition hover:brightness-110 ${
            isNeedsInput ? 'border-l-2 border-amber-400' : ''
          } ${isDone ? 'opacity-50' : ''} ${
            snapshot.isDragging ? 'ring-2 ring-purple-500/60' : ''
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
                <p className="text-sm font-medium leading-snug text-gray-100 break-words">
                  {task.title}
                </p>
                <button
                  type="button"
                  onMouseDown={(e) => e.stopPropagation()}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(task.id);
                  }}
                  className="shrink-0 cursor-pointer rounded px-1 text-xs text-gray-500 opacity-0 transition hover:bg-gray-700 hover:text-gray-200 group-hover:opacity-100"
                  aria-label="Delete task"
                >
                  ×
                </button>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <AgentBadge agent={task.agent} />
                <span
                  className={`h-2 w-2 rounded-full ${STATUS_DOT[task.status]}`}
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
