/**
 * Task **source** branch (see `Task.sourceBranch`) vs the generated Flux work
 * branch on `Session.branch` (`flux/task-<id>`). Helpers normalize user/MCP
 * input and classify presence against local + remote short-name sets.
 */

import type { GitBranchPresence, RepoBranchDiscovery, Task } from './types';

export type { GitBranchPresence } from './types';

/**
 * Decide persisted `sourceBranch` + `createSourceBranchIfMissing` for a newly
 * created task, given a discovery snapshot from git (main process) and optional
 * caller overrides (UI / MCP).
 */
export function planTaskSourceBranchFieldsForCreate(
  discovery: RepoBranchDiscovery,
  input?: { sourceBranch?: string; createSourceBranchIfMissing?: boolean },
): { sourceBranch: string; createSourceBranchIfMissing: boolean } {
  const defaultShort = normalizeGitBranchShortName(discovery.defaultBranchShort) || 'main';
  const raw =
    input?.sourceBranch != null && input.sourceBranch.trim().length > 0
      ? input.sourceBranch
      : discovery.defaultBranchShort;
  const { normalizedShort, presence } = classifyGitBranchPresence(
    raw,
    discovery.localBranches,
    discovery.remoteBranches,
  );
  const branchToStore =
    normalizedShort.length > 0 ? normalizedShort : defaultShort;
  const createMissing =
    input?.createSourceBranchIfMissing !== undefined
      ? input.createSourceBranchIfMissing
      : presence === 'missing';
  return {
    sourceBranch: branchToStore,
    createSourceBranchIfMissing: createMissing,
  };
}

const ORIGIN_PREFIX = 'origin/';

/**
 * Normalizes branch input to a short branch name: trims whitespace, strips
 * optional `refs/heads/`, maps `origin/foo` → `foo`, rejects empty.
 */
export function normalizeGitBranchShortName(raw: string): string {
  let s = raw.trim();
  if (s.startsWith('refs/heads/')) {
    s = s.slice('refs/heads/'.length).trim();
  }
  if (s.startsWith('refs/remotes/')) {
    s = s.slice('refs/remotes/'.length).trim();
  }
  if (s.startsWith(ORIGIN_PREFIX)) {
    s = s.slice(ORIGIN_PREFIX.length).trim();
  }
  return s;
}

function branchSet(names: readonly string[]): Set<string> {
  const out = new Set<string>();
  for (const n of names) {
    const k = normalizeGitBranchShortName(n);
    if (k.length > 0) out.add(k);
  }
  return out;
}

export function classifyGitBranchPresence(
  rawRequested: string,
  localBranches: readonly string[],
  remoteBranches: readonly string[],
): { normalizedShort: string; presence: GitBranchPresence } {
  const normalizedShort = normalizeGitBranchShortName(rawRequested);
  if (!normalizedShort) {
    return { normalizedShort: '', presence: 'missing' };
  }
  const L = branchSet(localBranches);
  const R = branchSet(remoteBranches);
  const loc = L.has(normalizedShort);
  const rem = R.has(normalizedShort);
  let presence: GitBranchPresence;
  if (loc && rem) presence = 'both';
  else if (loc) presence = 'local';
  else if (rem) presence = 'remote';
  else presence = 'missing';
  return { normalizedShort, presence };
}

/**
 * Effective stored source branch for a task. Missing/blank `task.sourceBranch`
 * → `projectDefaultBranchShort` (from `RepoConfig.baseBranch` / detected default).
 */
export function effectiveTaskSourceBranchShort(
  task: Pick<Task, 'sourceBranch'>,
  projectDefaultBranchShort: string,
): string {
  const fromTask = (task.sourceBranch ?? '').trim();
  if (!fromTask) {
    return normalizeGitBranchShortName(projectDefaultBranchShort);
  }
  return normalizeGitBranchShortName(fromTask);
}

/** When starting a session: honor explicit flag; if absent and branch is missing, default permissive `true`. */
export function resolveCreateSourceBranchIfMissingForStart(
  task: Pick<Task, 'createSourceBranchIfMissing'>,
  presence: GitBranchPresence,
): boolean {
  if (presence !== 'missing') {
    return false;
  }
  if (task.createSourceBranchIfMissing === false) {
    return false;
  }
  if (task.createSourceBranchIfMissing === true) {
    return true;
  }
  return true;
}
