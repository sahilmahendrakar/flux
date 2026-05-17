import path from 'node:path';
import type { Agent, AgentSessionModelDefaults, RepoConfig } from './types';
import {
  deriveRepoIdForRootPath,
  deriveStablePrimaryRepoIdForProject,
  normalizeRepoRootPathForIdentity,
} from './repoIdentity';

/** Single creation payload for local-only and team-synced projects. */
export interface ProjectCreateInput {
  name: string;
  repos: ProjectCreateRepoInput[];
  primaryRepoId?: string;
  syncMode: 'local-only' | 'team-synced';
  teamInvites?: string[];
  planningDefaults?: ProjectPlanningDefaultsInput;
}

export interface ProjectCreateRepoInput {
  rootPath: string;
  name?: string;
  baseBranch?: string;
}

export interface ProjectPlanningDefaultsInput {
  planningAgent?: Agent;
  defaultTaskAgent?: Agent;
  planningModels?: AgentSessionModelDefaults;
  planningAgentYolo?: boolean;
  taskDefaultModels?: AgentSessionModelDefaults;
  defaultTaskAgentYolo?: boolean;
  autoStartSessionOnInProgress?: boolean;
  autoRespondToTrustPrompts?: boolean;
  autoStartWhenUnblocked?: boolean;
  autoCleanupWorkspaceWhenDone?: boolean;
  autoMarkDoneWhenPrMerged?: boolean;
  autoMoveToReviewWhenPrOpen?: boolean;
}

export type ProjectCreateResult =
  | { ok: true; project: import('./types').LocalProject; projectDir: string }
  | { ok: false; error: ProjectCreateError; message?: string };

export type ProjectCreateError =
  | 'NAME_REQUIRED'
  | 'NAME_TOO_LONG'
  | 'NOT_GIT_REPO'
  | 'DUPLICATE_REPO_PATH'
  | 'PRIMARY_REPO_REQUIRED'
  | 'AUTH_REQUIRED'
  | 'INVITE_INVALID_EMAIL'
  | 'CREATE_FAILED';

export const PROJECT_NAME_MAX_LENGTH = 80;

export type ValidatedLocalProjectCreate = {
  name: string;
  repos: RepoConfig[];
  planningDefaults?: ProjectPlanningDefaultsInput;
};

export function validateProjectName(name: string): 'NAME_REQUIRED' | 'NAME_TOO_LONG' | { ok: true; name: string } {
  const trimmed = name.trim();
  if (trimmed.length === 0) return 'NAME_REQUIRED';
  if (trimmed.length > PROJECT_NAME_MAX_LENGTH) return 'NAME_TOO_LONG';
  return { ok: true, name: trimmed };
}

/**
 * Assigns stable repo ids for create and orders the primary repo first.
 * {@link deriveStablePrimaryRepoIdForProject} for primary; {@link deriveRepoIdForRootPath} for others.
 */
export function assignRepoIdsForCreate(params: {
  projectId: string;
  repos: ProjectCreateRepoInput[];
  primaryRepoId?: string;
}):
  | { ok: true; repos: RepoConfig[]; primaryRepoId: string }
  | { ok: false; error: 'PRIMARY_REPO_REQUIRED' } {
  if (params.repos.length === 0) {
    return { ok: false, error: 'PRIMARY_REPO_REQUIRED' };
  }

  const resolved = params.repos.map((r) => {
    const rootPath = path.resolve(r.rootPath);
    const base = path.basename(rootPath);
    return {
      rootPath,
      name: (r.name?.trim() || (base && base !== '.' ? base : `repo`)).slice(0, 200),
      baseBranch: (r.baseBranch?.trim() || 'main').slice(0, 200),
      stablePrimaryId: deriveStablePrimaryRepoIdForProject({
        projectId: params.projectId,
        rootPath,
      }),
    };
  });

  let primaryIdx = 0;
  if (params.repos.length === 1) {
    primaryIdx = 0;
  } else if (params.primaryRepoId?.trim()) {
    const want = params.primaryRepoId.trim();
    const idx = resolved.findIndex((r) => r.stablePrimaryId === want);
    if (idx === -1) {
      return { ok: false, error: 'PRIMARY_REPO_REQUIRED' };
    }
    primaryIdx = idx;
  } else {
    return { ok: false, error: 'PRIMARY_REPO_REQUIRED' };
  }

  const primary = resolved[primaryIdx];
  const primaryRepoId = primary.stablePrimaryId;
  const seenExtraIds = new Set<string>([primaryRepoId]);
  const extras: RepoConfig[] = [];

  for (let i = 0; i < resolved.length; i += 1) {
    if (i === primaryIdx) continue;
    const r = resolved[i];
    let salt = '';
    let extraId = deriveRepoIdForRootPath({
      projectId: params.projectId,
      rootPath: r.rootPath,
      salt,
    });
    while (seenExtraIds.has(extraId) || extraId === primaryRepoId) {
      salt = salt ? `${salt}-dup` : 'dup';
      extraId = deriveRepoIdForRootPath({
        projectId: params.projectId,
        rootPath: r.rootPath,
        salt,
      });
    }
    seenExtraIds.add(extraId);
    extras.push({
      id: extraId,
      name: r.name,
      rootPath: r.rootPath,
      baseBranch: r.baseBranch,
    });
  }

  const repos: RepoConfig[] = [
    {
      id: primaryRepoId,
      name: primary.name,
      rootPath: primary.rootPath,
      baseBranch: primary.baseBranch,
    },
    ...extras,
  ];

  return { ok: true, repos, primaryRepoId };
}

export function validateLocalProjectCreateInput(
  input: ProjectCreateInput,
  options?: { isGitRepo: (rootPath: string) => boolean | Promise<boolean> },
): Promise<
  | { ok: true; value: ValidatedLocalProjectCreate & { projectId: string } }
  | { ok: false; error: ProjectCreateError }
> {
  return Promise.resolve().then(async () => {
    if (input.syncMode === 'team-synced') {
      return { ok: false as const, error: 'AUTH_REQUIRED' as const };
    }

    const nameResult = validateProjectName(input.name);
    if (nameResult === 'NAME_REQUIRED') return { ok: false, error: 'NAME_REQUIRED' };
    if (nameResult === 'NAME_TOO_LONG') return { ok: false, error: 'NAME_TOO_LONG' };

    const repoInputs = input.repos ?? [];
    const seenPaths = new Set<string>();
    const normalizedPaths: string[] = [];

    for (const r of repoInputs) {
      if (typeof r.rootPath !== 'string' || !r.rootPath.trim()) {
        return { ok: false, error: 'NOT_GIT_REPO' };
      }
      const resolved = path.resolve(r.rootPath);
      const key = normalizeRepoRootPathForIdentity(resolved);
      if (seenPaths.has(key)) {
        return { ok: false, error: 'DUPLICATE_REPO_PATH' };
      }
      seenPaths.add(key);
      normalizedPaths.push(resolved);

      const isGit = options?.isGitRepo
        ? await options.isGitRepo(resolved)
        : await defaultIsGitRepo(resolved);
      if (!isGit) {
        return { ok: false, error: 'NOT_GIT_REPO' };
      }
    }

    if (repoInputs.length === 0) {
      if (input.primaryRepoId != null && String(input.primaryRepoId).trim() !== '') {
        return { ok: false, error: 'PRIMARY_REPO_REQUIRED' };
      }
      const { randomUUID } = await import('node:crypto');
      return {
        ok: true,
        value: {
          projectId: randomUUID(),
          name: nameResult.name,
          repos: [],
          planningDefaults: input.planningDefaults,
        },
      };
    }

    const { stableLocalProjectIdForRoot } = await import('./main/projectDirLayout');

    const resolvePrimaryRootForId = (): string | 'PRIMARY_REPO_REQUIRED' => {
      if (repoInputs.length === 1) {
        return normalizedPaths[0];
      }
      const want = input.primaryRepoId?.trim();
      if (!want) {
        return 'PRIMARY_REPO_REQUIRED';
      }
      for (const resolved of normalizedPaths) {
        const candidateProjectId = stableLocalProjectIdForRoot(resolved);
        const candidatePrimaryId = deriveStablePrimaryRepoIdForProject({
          projectId: candidateProjectId,
          rootPath: resolved,
        });
        if (candidatePrimaryId === want) {
          return resolved;
        }
      }
      return 'PRIMARY_REPO_REQUIRED';
    };

    const primaryRootForId = resolvePrimaryRootForId();
    if (primaryRootForId === 'PRIMARY_REPO_REQUIRED') {
      return { ok: false, error: 'PRIMARY_REPO_REQUIRED' };
    }

    const projectId = stableLocalProjectIdForRoot(primaryRootForId);

    const assigned = assignRepoIdsForCreate({
      projectId,
      repos: repoInputs,
      primaryRepoId: input.primaryRepoId,
    });
    if (!assigned.ok) {
      return { ok: false, error: assigned.error };
    }

    return {
      ok: true,
      value: {
        projectId,
        name: nameResult.name,
        repos: assigned.repos,
        planningDefaults: input.planningDefaults,
      },
    };
  });
}

async function defaultIsGitRepo(rootPath: string): Promise<boolean> {
  const fs = await import('node:fs/promises');
  try {
    await fs.access(path.join(rootPath, '.git'));
    return true;
  } catch {
    return false;
  }
}
