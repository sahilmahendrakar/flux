import { useCallback, useEffect, useMemo, useRef } from 'react';
import type { Task } from '../../types';
import { buildCloudGithubPrRefreshPatch } from './cloudGithubPrRefreshReconcile';
import type { TaskProvider } from './TaskProvider';

const DEBOUNCE_MS = 1800;
const POLL_MS = 7 * 60 * 1000;
const CONCURRENCY = 2;

async function runPool<T>(items: T[], concurrency: number, fn: (item: T) => Promise<void>): Promise<void> {
  let i = 0;
  const runNext = async (): Promise<void> => {
    for (;;) {
      const idx = i++;
      if (idx >= items.length) return;
      const item = items[idx];
      if (item === undefined) return;
      await fn(item);
    }
  };
  const n = Math.min(Math.max(1, concurrency), Math.max(1, items.length));
  await Promise.all(Array.from({ length: n }, () => runNext()));
}

/**
 * Refreshes linked GitHub PR metadata for board tasks (debounced). Local tasks
 * are persisted in the main process when the IPC row exists; cloud tasks get
 * `githubPr` updates when the view changes, and may get status-only writes when
 * metadata already matches GitHub but merge/review prefs still require a move.
 */
export function useGithubPrBoardRefresh(input: {
  projectId: string | undefined;
  projectKind: 'local' | 'cloud' | undefined;
  provider: TaskProvider | null;
  tasks: Task[];
  enabled: boolean;
  /** When true, merged PR metadata may move cloud tasks to Done (see `shouldAutoMarkDoneAfterPrMergeRefresh`). */
  autoMarkDoneWhenPrMerged: boolean;
  /** When true, open PR metadata may move cloud tasks from backlog/in-progress to Review. */
  autoMoveToReviewWhenPrOpen: boolean;
  /**
   * After a cloud task is written as Done from merged PR metadata, run the same
   * follow-up as an explicit Done transition (unblock autostart, optional cleanup).
   */
  onCloudPrMergedAutoDone?: (args: { previous: Task; updated: Task }) => Promise<void>;
}): void {
  const {
    projectId,
    projectKind,
    provider,
    tasks,
    enabled,
    autoMarkDoneWhenPrMerged,
    autoMoveToReviewWhenPrOpen,
    onCloudPrMergedAutoDone,
  } = input;
  const generationRef = useRef(0);
  const tasksRef = useRef(tasks);
  tasksRef.current = tasks;
  const providerRef = useRef(provider);
  providerRef.current = provider;
  const kindRef = useRef(projectKind);
  kindRef.current = projectKind;
  const autoMarkDoneRef = useRef(autoMarkDoneWhenPrMerged);
  autoMarkDoneRef.current = autoMarkDoneWhenPrMerged;
  const autoMoveReviewRef = useRef(autoMoveToReviewWhenPrOpen);
  autoMoveReviewRef.current = autoMoveToReviewWhenPrOpen;
  const onCloudPrMergedAutoDoneRef = useRef(onCloudPrMergedAutoDone);
  onCloudPrMergedAutoDoneRef.current = onCloudPrMergedAutoDone;

  const tasksGithubPrKey = useMemo(() => {
    return tasks
      .map((t) => {
        const g = t.githubPr;
        const url = g?.url?.trim();
        return `${t.id}:${url ?? ''}:${g?.state ?? ''}:${g?.mergedAt ?? ''}:${g?.number ?? ''}`;
      })
      .sort()
      .join('|');
  }, [tasks]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const execute = useCallback(async () => {
    const prov = providerRef.current;
    const kind = kindRef.current;
    if (!enabled || !projectId || !kind || !prov) return;
    const list = tasksRef.current.filter((t) => t.githubPr?.url?.trim() || !t.workspaceCleanedAt);
    if (list.length === 0) return;
    const gen = generationRef.current;
    await runPool(list, CONCURRENCY, async (task) => {
      if (generationRef.current !== gen) return;
      const pr = task.githubPr;
      try {
        const result = await window.electronAPI.tasks.refreshPullRequest({
          taskId: task.id,
          githubPr: pr,
        });
        if (generationRef.current !== gen) return;
        if (!result.ok) {
          if (result.code === 'NO_OPEN_PR' || result.code === 'NO_WORKTREE' || result.code === 'NO_PR_URL') {
            return;
          }
          console.warn('[githubPrRefresh]', task.id, result.code, result.message);
          return;
        }
        const snapshot = tasksRef.current;
        const live = snapshot.find((t) => t.id === task.id) ?? task;
        const refreshed = result.githubPr;

        if (kind !== 'cloud') {
          return;
        }

        const patch = buildCloudGithubPrRefreshPatch({
          live,
          refreshed,
          snapshot,
          autoMarkDoneWhenPrMerged: autoMarkDoneRef.current,
          autoMoveToReviewWhenPrOpen: autoMoveReviewRef.current,
        });
        if (patch) {
          const updated = await prov.update(task.id, patch);
          if (patch.status === 'done' && onCloudPrMergedAutoDoneRef.current) {
            await onCloudPrMergedAutoDoneRef.current({ previous: live, updated });
          }
        }
      } catch (err) {
        console.warn('[githubPrRefresh] error', task.id, err);
      }
    });
  }, [enabled, projectId]);

  const schedule = useCallback(() => {
    if (!enabled || !projectId || !projectKind || !provider) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      void execute();
    }, DEBOUNCE_MS);
  }, [enabled, projectId, projectKind, provider, execute]);

  // Invalidate in-flight refresh only when project/provider identity changes — not when
  // `tasksGithubPrKey` changes mid-sweep (that would abort other tasks in the same run).
  useEffect(() => {
    if (!enabled || !projectId || !projectKind || !provider) return;
    schedule();
    return () => {
      generationRef.current += 1;
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [enabled, projectId, projectKind, provider, schedule]);

  useEffect(() => {
    if (!enabled || !projectId || !projectKind || !provider) return;
    schedule();
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
    };
  }, [tasksGithubPrKey, enabled, projectId, projectKind, provider, schedule]);

  useEffect(() => {
    if (!enabled || !projectId) return;
    const onFocus = () => schedule();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [enabled, projectId, schedule]);

  useEffect(() => {
    if (!enabled || !projectId) return;
    const onVisible = () => {
      if (document.visibilityState === 'visible') schedule();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [enabled, projectId, schedule]);

  useEffect(() => {
    if (!enabled || !projectId) return;
    const id = window.setInterval(() => schedule(), POLL_MS);
    return () => clearInterval(id);
  }, [enabled, projectId, schedule]);
}
