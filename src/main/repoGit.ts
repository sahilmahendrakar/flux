import { execFile as execFileCallback } from 'node:child_process';
import { promisify } from 'node:util';
import type { RepoBranchDiscovery } from '../types';
import { normalizeGitBranchShortName } from '../taskBranches';

const execFile = promisify(execFileCallback);

/**
 * Repo-config `baseBranch` when set, else remote `origin/HEAD` short name, else `main`.
 * Does not fetch; only reads refs and config.
 */
export async function readDefaultBranchShortName(
  cwd: string,
  configuredBaseFromRepoConfig: string,
): Promise<string> {
  const trimmed = configuredBaseFromRepoConfig.trim();
  if (trimmed.length > 0) {
    return normalizeGitBranchShortName(trimmed);
  }
  try {
    const { stdout } = await execFile(
      'git',
      ['symbolic-ref', '--short', 'refs/remotes/origin/HEAD'],
      { cwd, encoding: 'utf8' },
    );
    const ref = stdout.trim();
    if (ref.startsWith('origin/')) {
      return normalizeGitBranchShortName(ref.slice('origin/'.length));
    }
    return normalizeGitBranchShortName(ref);
  } catch {
    return 'main';
  }
}

export async function listLocalBranchShortNames(cwd: string): Promise<string[]> {
  try {
    const { stdout } = await execFile(
      'git',
      ['for-each-ref', 'refs/heads/', '--format=%(refname:short)'],
      { cwd, encoding: 'utf8' },
    );
    return splitRefLines(stdout);
  } catch {
    return [];
  }
}

export async function listRemoteOriginBranchShortNames(cwd: string): Promise<string[]> {
  try {
    const { stdout } = await execFile(
      'git',
      ['for-each-ref', 'refs/remotes/origin/', '--format=%(refname:short)'],
      { cwd, encoding: 'utf8' },
    );
    return splitRefLines(stdout).filter(
      (n) => n.length > 0 && n !== 'HEAD' && !n.endsWith('/HEAD'),
    );
  } catch {
    return [];
  }
}

function splitRefLines(stdout: string): string[] {
  const out: string[] = [];
  for (const line of stdout.split('\n')) {
    const t = line.trim();
    if (t.length > 0) out.push(t);
  }
  return out;
}

/** Best-effort `git fetch origin <branch>`. */
export async function collectRepoBranchDiscovery(
  cwdForGit: string,
  configuredBaseFromRepoConfig: string,
): Promise<RepoBranchDiscovery> {
  const [defaultBranchShort, localBranches, remoteBranches] = await Promise.all([
    readDefaultBranchShortName(cwdForGit, configuredBaseFromRepoConfig),
    listLocalBranchShortNames(cwdForGit),
    listRemoteOriginBranchShortNames(cwdForGit),
  ]);
  return { defaultBranchShort, localBranches, remoteBranches };
}

export async function fetchOriginBranchBestEffort(cwd: string, branchShort: string): Promise<void> {
  const b = normalizeGitBranchShortName(branchShort);
  if (!b) return;
  try {
    await execFile('git', ['fetch', 'origin', b], { cwd });
  } catch {
    // best-effort
  }
}

/**
 * Returns a rev-parse-able ref for `branchShort` (local `refs/heads/X` or
 * `refs/remotes/origin/X`), or null if neither exists.
 */
export async function resolveLocalOrOriginRef(
  cwd: string,
  branchShort: string,
): Promise<string | null> {
  const short = normalizeGitBranchShortName(branchShort);
  if (!short) return null;
  try {
    await execFile('git', ['rev-parse', '--verify', '--quiet', `refs/heads/${short}`], {
      cwd,
    });
    return short;
  } catch {
    /* try remote */
  }
  try {
    await execFile(
      'git',
      ['rev-parse', '--verify', '--quiet', `refs/remotes/origin/${short}`],
      { cwd },
    );
    return `origin/${short}`;
  } catch {
    return null;
  }
}
