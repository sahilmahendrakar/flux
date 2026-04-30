import { getBlockingTasks, getBlockedTasks, isTaskBlocked } from './taskDependencies';
import type { Task } from './types';

/** Per-project and per-task toggles, plus the existing “in progress” auto-start. */
export type UnblockAutostartPolicy = {
  autoStartSessionOnInProgress: boolean;
  autoStartWhenUnblocked: boolean;
};

export function shouldAutostartUnblockedTask(
  task: Task,
  policy: UnblockAutostartPolicy,
): boolean {
  if (task.status === 'done') return false;
  return (
    policy.autoStartWhenUnblocked === true ||
    task.autoStartOnUnblock === true ||
    policy.autoStartSessionOnInProgress === true
  );
}

/**
 * True if `dependent` has at least one non-done dependency in `before`, and
 * none in `after` (fully unblocked).
 */
export function isFullUnblockTransition(dependent: Task, before: Task[], after: Task[]): boolean {
  return getBlockingTasks(dependent, before).length > 0 && getBlockingTasks(dependent, after).length === 0;
}

/**
 * When `completedBlocker` transitions to done, return dependents that should
 * be considered for auto-start (eligibility: backlog / in-progress, not done, fully unblocked).
 * Policy is applied by the caller; this only finds structural matches.
 */
export function findDependentsForUnblockAutostart(
  completedBlocker: Task,
  beforeBlocker: Task,
  allBefore: Task[],
  allAfter: Task[],
): Task[] {
  if (beforeBlocker.status === 'done' || completedBlocker.status !== 'done') {
    return [];
  }
  const fromAfter = getBlockedTasks(completedBlocker.id, allAfter);
  return fromAfter.filter((d) => {
    if (d.id === completedBlocker.id) return false;
    if (d.status === 'done') return false;
    if (d.status !== 'backlog' && d.status !== 'in-progress') return false;
    if (!isFullUnblockTransition(d, allBefore, allAfter)) return false;
    if (isTaskBlocked(d, allAfter)) return false;
    return true;
  });
}
