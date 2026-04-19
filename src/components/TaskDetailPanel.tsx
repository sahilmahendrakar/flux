import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { Task, TaskStatus, COLUMNS, AGENTS, Agent } from '../types';
import AgentBadge from './AgentBadge';

interface TaskDetailPanelProps {
  task: Task | null;
  onClose: () => void;
  onUpdate: (id: string, patch: Partial<Task>) => void;
  onDelete: (id: string) => void;
}

const STATUS_BADGE: Record<TaskStatus, string> = {
  backlog: 'bg-gray-700 text-gray-300',
  'in-progress': 'bg-green-900/60 text-green-300',
  'needs-input': 'bg-amber-900/60 text-amber-300',
  done: 'bg-gray-700 text-gray-400',
};

function formatCreatedLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const formatted = d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  return `Created ${formatted}`;
}

function useAutosizeTextArea(value: string, minHeightPx = 0) {
  const ref = useRef<HTMLTextAreaElement>(null);

  const resize = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = '0px';
    const next = Math.max(minHeightPx, el.scrollHeight);
    el.style.height = `${next}px`;
  }, [minHeightPx]);

  useLayoutEffect(() => {
    resize();
  }, [value, resize]);

  return { ref, resize };
}

export default function TaskDetailPanel({
  task,
  onClose,
  onUpdate,
  onDelete,
}: TaskDetailPanelProps) {
  const titleArea = useAutosizeTextArea(task?.title ?? '');
  const descriptionArea = useAutosizeTextArea(task?.description ?? '', 120);

  useEffect(() => {
    if (!task) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [task, onClose]);

  const handleDelete = () => {
    if (!task) return;
    if (!window.confirm('Delete this task?')) return;
    onDelete(task.id);
    onClose();
  };

  if (!task) {
    return null;
  }

  const statusLabel = COLUMNS.find((c) => c.id === task.status)?.label ?? task.status;

  return (
    <>
      <button
        type="button"
        tabIndex={-1}
        aria-label="Close task details"
        className="absolute inset-0 z-10 bg-black/30"
        onClick={onClose}
      />
      <aside
        className="absolute inset-y-0 right-0 z-20 flex w-[420px] flex-col border-l border-gray-800 bg-gray-900 shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="task-detail-title"
      >
        <div className="flex shrink-0 flex-col gap-3 border-b border-gray-800 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span
                className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_BADGE[task.status]}`}
              >
                {statusLabel}
              </span>
              <p className="mt-1.5 text-xs text-gray-500">{formatCreatedLabel(task.createdAt)}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded p-1 text-gray-400 transition hover:bg-gray-800 hover:text-gray-200"
              aria-label="Close"
            >
              <span className="text-lg leading-none" aria-hidden>
                ×
              </span>
            </button>
          </div>
        </div>

        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4">
          <textarea
            id="task-detail-title"
            ref={titleArea.ref}
            value={task.title}
            rows={1}
            onChange={(e) => {
              onUpdate(task.id, { title: e.target.value });
              titleArea.resize();
            }}
            className="w-full resize-none bg-transparent text-2xl font-semibold leading-snug text-white outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-gray-900"
            placeholder="Title"
          />

          <div>
            <dl className="grid grid-cols-[minmax(0,7rem)_1fr] gap-x-3 gap-y-2 text-sm">
              <dt className="text-gray-500">Agent</dt>
              <dd className="min-w-0">
                <div className="relative inline-flex max-w-full">
                  <select
                    value={task.agent}
                    onChange={(e) => onUpdate(task.id, { agent: e.target.value as Agent })}
                    className="absolute inset-0 z-10 h-full min-h-[1.75rem] w-full max-w-full cursor-pointer opacity-0"
                    aria-label="Change agent"
                  >
                    {AGENTS.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.label}
                      </option>
                    ))}
                  </select>
                  <AgentBadge agent={task.agent} />
                </div>
              </dd>
              <dt className="text-gray-500">Status</dt>
              <dd>
                <select
                  value={task.status}
                  onChange={(e) => onUpdate(task.id, { status: e.target.value as TaskStatus })}
                  className="w-full max-w-[220px] cursor-pointer rounded-md border border-gray-700 bg-gray-800 px-2 py-1.5 text-sm text-gray-200 outline-none focus-visible:ring-2 focus-visible:ring-purple-500/50"
                  aria-label="Change status"
                >
                  {COLUMNS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.label}
                    </option>
                  ))}
                </select>
              </dd>
            </dl>
          </div>

          <div className="flex min-h-0 flex-1 flex-col">
            <label htmlFor="task-detail-description" className="mb-1.5 text-xs text-gray-500">
              Description
            </label>
            <textarea
              id="task-detail-description"
              ref={descriptionArea.ref}
              value={task.description ?? ''}
              onChange={(e) => {
                onUpdate(task.id, { description: e.target.value });
                descriptionArea.resize();
              }}
              placeholder="Add a description..."
              className="min-h-[120px] w-full resize-none rounded-md border border-gray-700 bg-gray-800 p-3 text-sm leading-relaxed text-gray-100 outline-none placeholder:text-gray-600 focus-visible:ring-2 focus-visible:ring-purple-500/50"
            />
          </div>
        </div>

        <div className="shrink-0 border-t border-gray-800 p-4">
          <button
            type="button"
            onClick={handleDelete}
            className="text-sm text-red-400 transition hover:text-red-300"
          >
            Delete task
          </button>
        </div>
      </aside>
    </>
  );
}
