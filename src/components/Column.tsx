import type { ReactNode } from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Task, TaskStatus } from '../types';
import TaskCard from './TaskCard';

interface Props {
  id: TaskStatus;
  label: string;
  tasks: Task[];
  onNewTask?: () => void;
  onDeleteTask: (id: string) => void;
  onCardClick: (id: string) => void;
  emptyState?: ReactNode;
}

export default function Column({
  id,
  label,
  tasks,
  onNewTask,
  onDeleteTask,
  onCardClick,
  emptyState,
}: Props) {
  const isNeedsInput = id === 'needs-input';
  const isDone = id === 'done';

  const headerTint = isNeedsInput
    ? 'text-amber-800 dark:text-amber-400/90'
    : isDone
      ? 'text-flux-muted'
      : 'text-flux-muted';

  const countClass = isNeedsInput
    ? 'bg-amber-500/10 text-amber-900 dark:text-amber-400/90 ring-1 ring-amber-500/15'
    : isDone
      ? 'bg-flux-pill text-flux-muted ring-1 ring-flux-tint/10'
      : 'bg-flux-pill text-flux-muted ring-1 ring-flux-tint/10';

  return (
    <div className="flex min-w-[272px] flex-1 flex-col rounded-lg border border-flux-line bg-flux-column/80">
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <h2
            className={`truncate text-[11px] font-semibold uppercase tracking-[0.14em] ${headerTint}`}
          >
            {label}
          </h2>
          <span
            className={`inline-flex min-w-[1.25rem] shrink-0 items-center justify-center rounded-md px-1.5 py-0.5 text-[11px] font-medium tabular-nums ${countClass}`}
          >
            {tasks.length}
          </span>
        </div>
        {onNewTask ? (
          <button
            type="button"
            onClick={onNewTask}
            className="shrink-0 rounded-md px-2 py-1 text-[11px] font-medium text-flux-muted transition hover:bg-flux-tint/[0.06] hover:text-flux-fg-soft"
          >
            + New
          </button>
        ) : null}
      </div>
      <Droppable droppableId={id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex flex-1 flex-col gap-1.5 overflow-y-auto px-2 pb-3 transition-colors ${
              snapshot.isDraggingOver ? 'bg-flux-tint/[0.03]' : ''
            }`}
          >
            {tasks.map((task, index) => (
              <TaskCard
                key={task.id}
                task={task}
                index={index}
                onDelete={onDeleteTask}
                onCardClick={onCardClick}
              />
            ))}
            {provided.placeholder}
            {tasks.length === 0 && emptyState ? (
              <div className="flex flex-1 items-center justify-center px-3 py-10 text-center text-[13px] leading-relaxed text-flux-subtle">
                {emptyState}
              </div>
            ) : null}
          </div>
        )}
      </Droppable>
    </div>
  );
}
