import { describe, expect, it } from 'vitest';
import { assigneePatchForCloudAutoStartOnUnblock } from './cloudAutoStartUnblockAssignee';

const me = 'uid-me';
const other = 'uid-other';

describe('assigneePatchForCloudAutoStartOnUnblock', () => {
  it('adds assignee on cloud when enabling auto-start and task has no assignee', () => {
    expect(
      assigneePatchForCloudAutoStartOnUnblock({
        projectKind: 'cloud',
        actorUid: me,
        previousAssigneeId: undefined,
        patch: { autoStartOnUnblock: true },
      }),
    ).toEqual({ assigneeId: me });
  });

  it('adds assignee when previous assignee is blank', () => {
    expect(
      assigneePatchForCloudAutoStartOnUnblock({
        projectKind: 'cloud',
        actorUid: me,
        previousAssigneeId: '  ',
        patch: { autoStartOnUnblock: true },
      }),
    ).toEqual({ assigneeId: me });
  });

  it('does nothing on local projects', () => {
    expect(
      assigneePatchForCloudAutoStartOnUnblock({
        projectKind: 'local',
        actorUid: me,
        previousAssigneeId: undefined,
        patch: { autoStartOnUnblock: true },
      }),
    ).toEqual({});
  });

  it('does nothing without actor uid', () => {
    expect(
      assigneePatchForCloudAutoStartOnUnblock({
        projectKind: 'cloud',
        actorUid: null,
        previousAssigneeId: undefined,
        patch: { autoStartOnUnblock: true },
      }),
    ).toEqual({});
  });

  it('does not reassign when task already has an assignee', () => {
    expect(
      assigneePatchForCloudAutoStartOnUnblock({
        projectKind: 'cloud',
        actorUid: me,
        previousAssigneeId: other,
        patch: { autoStartOnUnblock: true },
      }),
    ).toEqual({});
  });

  it('does not override when patch already sets assigneeId', () => {
    expect(
      assigneePatchForCloudAutoStartOnUnblock({
        projectKind: 'cloud',
        actorUid: me,
        previousAssigneeId: undefined,
        patch: { autoStartOnUnblock: true, assigneeId: other },
      }),
    ).toEqual({});
  });

  it('does not add assignee when explicitly clearing assignee in same patch', () => {
    expect(
      assigneePatchForCloudAutoStartOnUnblock({
        projectKind: 'cloud',
        actorUid: me,
        previousAssigneeId: undefined,
        patch: { autoStartOnUnblock: true, assigneeId: null },
      }),
    ).toEqual({});
  });

  it('does nothing when not enabling auto-start', () => {
    expect(
      assigneePatchForCloudAutoStartOnUnblock({
        projectKind: 'cloud',
        actorUid: me,
        previousAssigneeId: undefined,
        patch: { autoStartOnUnblock: false },
      }),
    ).toEqual({});
  });
});
