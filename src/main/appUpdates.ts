import { app, ipcMain } from 'electron';
import { autoUpdater } from 'electron-updater';

const GH_UPDATES_OWNER = 'sahilmahendrakar';
const GH_UPDATES_REPO = 'flux-web';

let macGithubUpdaterConfigured = false;

function configureMacGithubAutoUpdaterFeed(): void {
  if (
    macGithubUpdaterConfigured ||
    process.platform !== 'darwin' ||
    !app.isPackaged ||
    process.env.FLUX_DISABLE_GITHUB_UPDATES === '1'
  ) {
    return;
  }
  macGithubUpdaterConfigured = true;
  autoUpdater.autoDownload = false;
  autoUpdater.autoInstallOnAppQuit = false;
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: GH_UPDATES_OWNER,
    repo: GH_UPDATES_REPO,
  });
}

export type MacGithubUpdateCheckResult =
  | { ok: false; reason: 'not_supported' }
  | {
      ok: true;
      updateAvailable: boolean;
      latestVersion?: string;
      currentVersion?: string;
    }
  | { ok: false; reason: 'error'; message: string };

/** IPC for macOS packaged builds — checks GitHub Releases metadata only (`autoDownload` is disabled). */
export function registerMacGithubUpdateIpcs(): void {
  ipcMain.handle('app:updates:macGithubSupported', (): boolean =>
    Boolean(
      process.platform === 'darwin' &&
        app.isPackaged &&
        process.env.FLUX_DISABLE_GITHUB_UPDATES !== '1',
    ),
  );

  ipcMain.handle(
    'app:updates:checkGithubMac',
    async (): Promise<MacGithubUpdateCheckResult> => {
      if (
        process.platform !== 'darwin' ||
        !app.isPackaged ||
        process.env.FLUX_DISABLE_GITHUB_UPDATES === '1'
      ) {
        return { ok: false, reason: 'not_supported' };
      }
      try {
        configureMacGithubAutoUpdaterFeed();
        const currentVersion = autoUpdater.currentVersion.version;
        const result = await autoUpdater.checkForUpdates();
        const latestVersion = result?.updateInfo.version;
        return {
          ok: true,
          updateAvailable:
            result?.isUpdateAvailable ??
            Boolean(latestVersion && latestVersion !== currentVersion),
          latestVersion,
          currentVersion,
        };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return { ok: false, reason: 'error', message };
      }
    },
  );
}
