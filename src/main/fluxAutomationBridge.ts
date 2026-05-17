import { randomBytes } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { app } from 'electron';
import { existsSync } from 'node:fs';
import type { ActiveProjectKey } from '../types';
import {
  FLUXX_CLI_BRIDGE_CONFIG_REL,
  LEGACY_FLUX_CLI_BRIDGE_CONFIG_REL,
} from '../fluxCliBridgeConfig';
import {
  FLUX_AUTOMATION_EXPECTED_ACTIVE_KEY_ENV,
  FLUX_AUTOMATION_TOKEN_ENV,
  FLUX_AUTOMATION_URL_ENV,
  FLUXX_AUTOMATION_EXPECTED_ACTIVE_KEY_ENV,
  FLUXX_AUTOMATION_TOKEN_ENV,
  FLUXX_AUTOMATION_URL_ENV,
} from './fluxAutomationEnv';

export interface FluxCliBridgeConfigFile {
  url: string;
  token: string;
  expectedActiveKey: ActiveProjectKey;
}

export function newFluxAutomationToken(): string {
  return randomBytes(32).toString('hex');
}

export function fluxAutomationPtyEnv(params: {
  baseUrl: string;
  token: string;
  expectedActiveKey: ActiveProjectKey;
  fluxCliBinDir?: string;
}): Record<string, string> {
  const keyJson = JSON.stringify(params.expectedActiveKey);
  const env: Record<string, string> = {
    [FLUXX_AUTOMATION_URL_ENV]: params.baseUrl,
    [FLUXX_AUTOMATION_TOKEN_ENV]: params.token,
    [FLUXX_AUTOMATION_EXPECTED_ACTIVE_KEY_ENV]: keyJson,
    [FLUX_AUTOMATION_URL_ENV]: params.baseUrl,
    [FLUX_AUTOMATION_TOKEN_ENV]: params.token,
    [FLUX_AUTOMATION_EXPECTED_ACTIVE_KEY_ENV]: keyJson,
  };
  if (params.fluxCliBinDir) {
    const sep = path.delimiter;
    const existing = process.env.PATH ?? '';
    env.PATH = existing ? `${params.fluxCliBinDir}${sep}${existing}` : params.fluxCliBinDir;
  }
  if (app.isPackaged) {
    env.FLUXX_ELECTRON_EXE = process.execPath;
    env.FLUX_ELECTRON_EXE = process.execPath;
  }
  return env;
}

function cliBundleExists(dir: string, bundleBasename: string): boolean {
  return existsSync(path.join(dir, bundleBasename));
}

/** Directory containing the `fluxx` shim (and legacy `flux` alias) plus the CLI bundle. */
export function resolveFluxCliBinDir(): string | undefined {
  const bundleNames = ['fluxx-cli.js', 'flux-cli.js'] as const;
  const candidates: string[] = [];
  if (app.isPackaged) {
    candidates.push(
      path.join(process.resourcesPath, 'fluxx-cli'),
      path.join(process.resourcesPath, 'flux-cli'),
    );
  }
  candidates.push(path.resolve(process.cwd(), '.vite/build'));
  for (const dir of candidates) {
    if (bundleNames.some((name) => cliBundleExists(dir, name))) {
      return dir;
    }
  }
  return undefined;
}

export async function writeFluxCliBridgeConfig(
  projectDir: string,
  config: FluxCliBridgeConfigFile,
): Promise<void> {
  const configPath = path.join(projectDir, FLUXX_CLI_BRIDGE_CONFIG_REL);
  await fs.mkdir(path.dirname(configPath), { recursive: true });
  const payload = `${JSON.stringify(config, null, 2)}\n`;
  await fs.writeFile(configPath, payload, 'utf8');
  const legacyPath = path.join(projectDir, LEGACY_FLUX_CLI_BRIDGE_CONFIG_REL);
  try {
    await fs.unlink(legacyPath);
  } catch (err: unknown) {
    if (!(err && typeof err === 'object' && 'code' in err && err.code === 'ENOENT')) {
      throw err;
    }
  }
}
