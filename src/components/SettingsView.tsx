import { ThemeAppearanceSwitch } from './ThemeAppearanceSwitch';

export function SettingsView() {
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto">
      <div className="mx-auto w-full max-w-lg px-6 py-8">
        <section>
          <h2 className="text-[11px] font-medium uppercase tracking-[0.12em] text-flux-subtle">
            Appearance
          </h2>
          <p className="mt-1 max-w-md text-[13px] leading-relaxed text-flux-muted">
            Use a light or dark interface, or match your system setting.
          </p>
          <div className="mt-5 max-w-[220px]">
            <ThemeAppearanceSwitch showLabel />
          </div>
        </section>
      </div>
    </div>
  );
}
