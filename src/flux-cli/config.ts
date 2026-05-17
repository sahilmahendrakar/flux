import fs from 'node:fs';
import path from 'node:path';
import type { ActiveProjectKey } from '../types';
import {
  FLUXX_CLI_BRIDGE_CONFIG_REL,
  LEGACY_FLUX_CLI_BRIDGE_CONFIG_REL,
} from '../fluxCliBridgeConfig';
import {
  readFluxxAutomationExpectedActiveKeyFromEnv,
  readFluxxAutomationTokenFromEnv,
  readFluxxAutomationUrlFromEnv,
} from '../main/fluxAutomationEnv';

export interface FluxCliBridgeConfig {
  url: string;
  token: string;
  expectedActiveKey: ActiveProjectKey;
}

function parseConfigFile(raw: string): FluxCliBridgeConfig | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      typeof (parsed as { url?: unknown }).url !== 'string' ||
      typeof (parsed as { token?: unknown }).token !== 'string' ||
      !(parsed as { expectedActiveKey?: unknown }).expectedActiveKey ||
      typeof (parsed as { expectedActiveKey: ActiveProjectKey }).expectedActiveKey !== 'object'
    ) {
      return null;
    }
    const key = (parsed as { expectedActiveKey: ActiveProjectKey }).expectedActiveKey;
    if (typeof key.kind !== 'string' || typeof key.id !== 'string') {
      return null;
    }
    return {
      url: (parsed as { url: string }).url,
      token: (parsed as { token: string }).token,
      expectedActiveKey: key,
    };
  } catch {
    return null;
  }
}

function configFromEnv(): FluxCliBridgeConfig | null {
  const url = readFluxxAutomationUrlFromEnv();
  const token = readFluxxAutomationTokenFromEnv();
  const keyRaw = readFluxxAutomationExpectedActiveKeyFromEnv();
  if (!url || !token || !keyRaw) {
    return null;
  }
  try {
    const expectedActiveKey = JSON.parse(keyRaw) as ActiveProjectKey;
    if (typeof expectedActiveKey.kind !== 'string' || typeof expectedActiveKey.id !== 'string') {
      return null;
    }
    return { url, token, expectedActiveKey };
  } catch {
    return null;
  }
}

function configFromDiskAtPath(configPath: string): FluxCliBridgeConfig | null {
  if (!fs.existsSync(configPath)) {
    return null;
  }
  const raw = fs.readFileSync(configPath, 'utf8');
  return parseConfigFile(raw);
}

function configFromDisk(startDir: string): FluxCliBridgeConfig | null {
  let dir = path.resolve(startDir);
  for (let i = 0; i < 32; i += 1) {
    for (const rel of [FLUXX_CLI_BRIDGE_CONFIG_REL, LEGACY_FLUX_CLI_BRIDGE_CONFIG_REL]) {
      const parsed = configFromDiskAtPath(path.join(dir, rel));
      if (parsed) return parsed;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

/** Resolve bridge settings from planning-session env or project `.fluxx/cli-bridge.json`. */
export function loadFluxCliBridgeConfig(cwd = process.cwd()): FluxCliBridgeConfig | null {
  return configFromEnv() ?? configFromDisk(cwd);
}
