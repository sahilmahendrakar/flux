import { describe, expect, it } from 'vitest';
import { PLANNING_CLOUD_UNSYNCED_PREFIX } from './planningDocs/cloudPlanningDocsMigration';
import { PLANNING_DOCS_DISK_SYNC_REL_PREFIX } from './planningDocs/path';
import {
  MAX_TASK_ATTACHED_PLANNING_DOCS,
  parsePersistedTaskAttachedPlanningDocs,
  sanitizeTaskAttachedPlanningDocsInput,
} from './taskAttachedPlanningDocs';

describe('sanitizeTaskAttachedPlanningDocsInput', () => {
  it('normalizes slashes, dedupes, and keeps .md paths', () => {
    expect(
      sanitizeTaskAttachedPlanningDocsInput([
        { relativePath: 'Spec\\\\foo.md' },
        { relativePath: '/Spec/foo.md' },
        { relativePath: 'other.md' },
      ]),
    ).toEqual([{ relativePath: 'Spec/foo.md' }, { relativePath: 'other.md' }]);
  });

  it('drops traversal, non-markdown, and malformed entries', () => {
    expect(
      sanitizeTaskAttachedPlanningDocsInput([
        { relativePath: '../escape.md' },
        { relativePath: 'readme.txt' },
        { relativePath: '' },
        'not-an-object' as unknown as { relativePath: string },
        { relativePath: 'ok.md' },
      ]),
    ).toEqual([{ relativePath: 'ok.md' }]);
  });

  it('drops .flux-docs-sync and _flux_unsynced trees', () => {
    expect(
      sanitizeTaskAttachedPlanningDocsInput([
        { relativePath: `${PLANNING_DOCS_DISK_SYNC_REL_PREFIX}/x.md` },
        { relativePath: `${PLANNING_CLOUD_UNSYNCED_PREFIX}/y.md` },
        { relativePath: 'plans/z.md' },
      ]),
    ).toEqual([{ relativePath: 'plans/z.md' }]);
  });

  it('caps list length to MAX_TASK_ATTACHED_PLANNING_DOCS (aligns with Firestore rules)', () => {
    expect(MAX_TASK_ATTACHED_PLANNING_DOCS).toBe(32);
    const raw = Array.from({ length: 40 }, (_, i) => ({
      relativePath: `f${i}.md`,
    }));
    expect(sanitizeTaskAttachedPlanningDocsInput(raw)).toHaveLength(32);
  });

  it('parsePersistedTaskAttachedPlanningDocs returns undefined when nothing survives', () => {
    expect(parsePersistedTaskAttachedPlanningDocs([{ relativePath: 'nope.txt' }])).toBeUndefined();
    expect(parsePersistedTaskAttachedPlanningDocs([{ relativePath: 'y.md' }])).toEqual([
      { relativePath: 'y.md' },
    ]);
  });
});
