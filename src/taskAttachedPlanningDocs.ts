import {
  MAX_PLANNING_RELATIVE_PATH_UTF8_BYTES,
  normalizePlanningDocRelativePath,
  isPlanningMarkdownRelativePathForbiddenForUserWrite,
} from './planningDocs/path';
import type { TaskAttachedPlanningDoc } from './types';

/** Matches Firestore rules cap on `tasks.attachedPlanningDocs` list length. */
export const MAX_TASK_ATTACHED_PLANNING_DOCS = 32;

/**
 * Normalizes, dedupes, caps, and drops invalid planning-doc paths for task storage.
 * Invalid entries are skipped (never throws). Forbidden sync paths are excluded.
 */
export function sanitizeTaskAttachedPlanningDocsInput(raw: unknown): TaskAttachedPlanningDoc[] {
  if (!Array.isArray(raw)) {
    return [];
  }
  const seen = new Set<string>();
  const out: TaskAttachedPlanningDoc[] = [];
  for (const item of raw) {
    if (out.length >= MAX_TASK_ATTACHED_PLANNING_DOCS) {
      break;
    }
    const rel =
      item &&
      typeof item === 'object' &&
      typeof (item as { relativePath?: unknown }).relativePath === 'string'
        ? (item as { relativePath: string }).relativePath
        : null;
    if (rel == null) {
      continue;
    }
    const norm = normalizePlanningDocRelativePath(rel);
    if (!norm || isPlanningMarkdownRelativePathForbiddenForUserWrite(norm)) {
      continue;
    }
    if (new TextEncoder().encode(norm).length > MAX_PLANNING_RELATIVE_PATH_UTF8_BYTES) {
      continue;
    }
    if (seen.has(norm)) {
      continue;
    }
    seen.add(norm);
    out.push({ relativePath: norm });
  }
  return out;
}

/** Firestore / disk read: omit field when nothing valid remains. */
export function parsePersistedTaskAttachedPlanningDocs(
  val: unknown,
): TaskAttachedPlanningDoc[] | undefined {
  const s = sanitizeTaskAttachedPlanningDocsInput(val);
  return s.length > 0 ? s : undefined;
}
