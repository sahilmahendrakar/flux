import { LayoutGrid, LayoutList } from 'lucide-react';
import type { TaskBoardViewMode } from '../boardViewPrefs';

const MODES: { id: TaskBoardViewMode; label: string; Icon: typeof LayoutGrid }[] = [
  { id: 'board', label: 'Board', Icon: LayoutGrid },
  { id: 'list', label: 'List', Icon: LayoutList },
];

interface BoardViewToggleProps {
  value: TaskBoardViewMode;
  onChange: (mode: TaskBoardViewMode) => void;
}

export function BoardViewToggle({ value, onChange }: BoardViewToggleProps) {
  return (
    <div
      role="group"
      aria-label="Task view"
      className="flex rounded-md border border-gray-700 p-0.5"
    >
      {MODES.map(({ id, label, Icon }) => {
        const active = value === id;
        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-pressed={active}
            aria-label={label}
            title={label}
            className={[
              'flex h-7 w-7 items-center justify-center rounded transition-colors',
              active
                ? 'bg-gray-800 text-gray-200'
                : 'text-gray-500 hover:bg-gray-800/50 hover:text-gray-300',
            ].join(' ')}
          >
            <Icon className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
