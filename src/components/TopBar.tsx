import type { Project } from '../types';

interface TopBarProps {
  project: Project;
  title: string;
  statusLine: string;
}

export function TopBar({ project, title, statusLine }: TopBarProps) {
  return (
    <header
      className="flex shrink-0 items-center justify-between border-b border-flux-line bg-flux-bg/80 px-5 py-2.5 backdrop-blur-md"
      aria-label={`Project: ${project.name}`}
    >
      <div className="flex min-w-0 items-baseline gap-2">
        <h1 className="text-[13px] font-medium tracking-tight text-flux-fg-soft">{title}</h1>
        <span className="hidden text-flux-muted sm:inline" aria-hidden>
          ·
        </span>
        <span className="hidden truncate text-[13px] text-flux-muted sm:inline" title={project.name}>
          {project.name}
        </span>
      </div>
      <p className="shrink-0 pl-4 text-[11px] tabular-nums text-flux-subtle">{statusLine}</p>
    </header>
  );
}
