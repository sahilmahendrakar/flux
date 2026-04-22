import type { ThemePreference } from '../renderer/theme';
import { useTheme } from '../renderer/useTheme';

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={16}
      height={16}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <circle cx="8" cy="8" r="3.25" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M8 1.25v1.5M8 13.25v1.5M1.25 8h1.5M13.25 8h1.5M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M12.95 3.05l-1.06 1.06M4.11 11.89l-1.06 1.06"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={16}
      height={16}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M8.75 1.5a5.5 5.5 0 1 0 6.75 6.75 4.25 4.25 0 1 1-6.75-6.75Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MonitorIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={16}
      height={16}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect x="2" y="3" width="12" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <path d="M6 13.5h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M8 11v2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function segmentClass(active: boolean) {
  return [
    'flex flex-1 items-center justify-center rounded py-1.5 transition-colors',
    active
      ? 'bg-flux-tint/10 text-flux-fg shadow-[inset_0_0_0_1px_rgb(var(--color-flux-tint)/0.08)]'
      : 'text-flux-muted hover:bg-flux-tint/5 hover:text-flux-fg-soft',
  ].join(' ');
}

interface ThemeAppearanceSwitchProps {
  /** When set, the "Appearance" label is shown (sidebar). Omit for compact header placement. */
  showLabel?: boolean;
  className?: string;
}

export function ThemeAppearanceSwitch({
  showLabel = false,
  className = '',
}: ThemeAppearanceSwitchProps) {
  const { preference, setPreference } = useTheme();

  const pick = (mode: ThemePreference) => () => setPreference(mode);

  return (
    <div className={className}>
      {showLabel ? (
        <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-flux-subtle">
          Appearance
        </div>
      ) : null}
      <div
        className={`flex rounded-md border border-flux-line bg-flux-bg/40 p-0.5 ${showLabel ? 'mt-1.5' : ''}`}
        role="group"
        aria-label="Theme"
      >
        <button
          type="button"
          aria-pressed={preference === 'light'}
          className={segmentClass(preference === 'light')}
          onClick={pick('light')}
          title="Light"
        >
          <SunIcon className="opacity-90" />
        </button>
        <button
          type="button"
          aria-pressed={preference === 'dark'}
          className={segmentClass(preference === 'dark')}
          onClick={pick('dark')}
          title="Dark"
        >
          <MoonIcon className="opacity-90" />
        </button>
        <button
          type="button"
          aria-pressed={preference === 'system'}
          className={segmentClass(preference === 'system')}
          onClick={pick('system')}
          title="Match system"
        >
          <MonitorIcon className="opacity-90" />
        </button>
      </div>
    </div>
  );
}
