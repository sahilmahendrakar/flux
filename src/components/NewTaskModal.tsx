import { useEffect, useRef, useState } from 'react';
import { Agent, AGENTS } from '../types';

interface Props {
  onClose: () => void;
  onCreate: (title: string, agent: Agent) => void;
}

export default function NewTaskModal({ onClose, onCreate }: Props) {
  const [title, setTitle] = useState('');
  const [agent, setAgent] = useState<Agent>('claude-code');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const trimmed = title.trim();
  const canSubmit = trimmed.length > 0;

  const submit = () => {
    if (!canSubmit) return;
    onCreate(trimmed, agent);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 backdrop-blur-[2px] dark:bg-black/50"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-[400px] rounded-lg border border-flux-line-strong bg-flux-elevated p-5 shadow-flux-modal"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 className="text-[15px] font-medium tracking-tight text-flux-fg">New task</h2>
        <p className="mt-1 text-[13px] text-flux-muted">Add a task to the backlog.</p>

        <label className="mt-5 block text-[11px] font-medium uppercase tracking-[0.12em] text-flux-subtle">
          Title
        </label>
        <input
          ref={inputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') submit();
          }}
          placeholder="What should the agent do?"
          className="mt-1.5 w-full rounded-md border border-flux-line-strong bg-flux-surface px-3 py-2 text-[13px] text-flux-fg placeholder:text-flux-subtle outline-none transition focus:border-flux-muted focus:ring-1 focus:ring-flux-tint/12"
        />

        <label className="mt-4 block text-[11px] font-medium uppercase tracking-[0.12em] text-flux-subtle">
          Agent
        </label>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {AGENTS.map((a) => {
            const active = a.id === agent;
            return (
              <button
                key={a.id}
                type="button"
                onClick={() => setAgent(a.id)}
                className={`rounded-md border px-2.5 py-1.5 text-[11px] font-medium transition ${
                  active
                    ? 'border-flux-line-strong bg-flux-tint/[0.08] text-flux-fg shadow-[inset_0_0_0_1px_rgb(var(--color-flux-tint)/0.06)]'
                    : 'border-transparent bg-flux-tint/[0.03] text-flux-muted hover:border-flux-line hover:bg-flux-tint/[0.06] hover:text-flux-fg-soft'
                }`}
              >
                {a.label}
              </button>
            );
          })}
        </div>

        <div className="mt-6 flex justify-end gap-2 border-t border-flux-line pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-3 py-1.5 text-[13px] text-flux-muted transition hover:bg-flux-tint/5 hover:text-flux-fg-soft"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className="rounded-md bg-flux-fg px-3 py-1.5 text-[13px] font-medium text-flux-bg shadow-sm transition hover:opacity-90 disabled:pointer-events-none disabled:opacity-45"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
