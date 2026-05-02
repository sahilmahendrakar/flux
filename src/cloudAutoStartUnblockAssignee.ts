import type { TaskPatch } from './renderer/tasks/TaskProvider';

export type CloudAutoStartUnblockProjectKind = 'cloud' | 'local';

/** Minimal patch fields used for assign-on-enable logic (MCP + TaskProvider patches). */
export type AutoStartUnblockAssigneePatchSlice = Pick<
  TaskPatch,
  'autoStartOnUnblock' | 'assigneeId'
>;

/**
 * Cloud only: enabling per-task auto-start when unblocked assigns the actor when the
 * task has no assignee, so unblock autostart has a clear owner. If the task is already
 * assigned (including to someone else), the patch is unchanged — the board locks the
 * control for non-assignees.
 *
 * Local projects do not persist `assigneeId` (see LocalTaskProvider); callers pass
 * `projectKind: 'local'` and this returns an empty object.
 */
export function assigneePatchForCloudAutoStartOnUnblock(params: {
  projectKind: CloudAutoStartUnblockProjectKind | undefined;
  actorUid: string | null | undefined;
  /** Assignee before applying `patch` (row snapshot or debounce baseline). */
  previousAssigneeId: string | null | undefined;
  patch: AutoStartUnblockAssigneePatchSlice;
}): Pick<TaskPatch, 'assigneeId'> | Record<string, never> {
  const { projectKind, actorUid, previousAssigneeId, patch } = params;
  if (projectKind !== 'cloud' || !actorUid) {
    return {};
  }
  if (patch.autoStartOnUnblock !== true) {
    return {};
  }
  if (previousAssigneeId?.trim()) {
    return {};
  }
  if (patch.assigneeId !== undefined) {
    return {};
  }
  return { assigneeId: actorUid };
}
