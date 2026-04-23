import path from 'node:path';
import fs from 'node:fs/promises';
import type { DaemonClient } from './DaemonClient';
import type { WorktreeService } from './WorktreeService';

/**
 * Stop a daemon session, close its shells, and remove its git worktree — same
 * side effects as the `session:delete` IPC handler (workspace delete).
 */
export async function deleteSessionWorkspaceAndStop(
  daemonClient: DaemonClient,
  worktreeService: WorktreeService,
  sessionId: string,
): Promise<void> {
  const sessions = await daemonClient.listSessions();
  const target = sessions.find((s) => s.id === sessionId);
  await daemonClient.closeShellsForSession(sessionId);
  await daemonClient.stopSession(sessionId);
  if (target?.worktreePath) {
    try {
      await worktreeService.remove(target.worktreePath);
    } catch (err: unknown) {
      console.error('[deleteSessionWorkspaceAndStop] worktree remove failed', {
        sessionId,
        err,
      });
    }
  }
}

/**
 * Tear down every daemon session and worktree tied to `taskId`, then remove a
 * possible orphan worktree directory (e.g. after archive left the folder).
 * Does not touch the task record.
 */
export async function teardownEphemeralResourcesForTask(
  daemonClient: DaemonClient,
  worktreeService: WorktreeService,
  taskId: string,
): Promise<string[]> {
  const errors: string[] = [];
  let sessionIds: string[] = [];
  try {
    const sessions = await daemonClient.listSessions();
    sessionIds = sessions.filter((s) => s.taskId === taskId).map((s) => s.id);
  } catch (err) {
    errors.push(
      `Could not list sessions: ${err instanceof Error ? err.message : String(err)}`,
    );
    return errors;
  }

  for (const id of sessionIds) {
    try {
      await deleteSessionWorkspaceAndStop(daemonClient, worktreeService, id);
    } catch (err) {
      errors.push(`Session ${id}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  const projectDir = worktreeService.getProjectDir();
  const rootPath = worktreeService.getRootPath();
  if (projectDir && rootPath) {
    const orphanPath = path.join(projectDir, 'worktrees', taskId);
    try {
      await fs.access(orphanPath);
      try {
        await worktreeService.remove(orphanPath);
      } catch (err) {
        errors.push(
          `Worktree cleanup: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    } catch {
      // no directory at expected path
    }
  }

  return errors;
}
