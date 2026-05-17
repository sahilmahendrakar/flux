/** Board columns vs flat list layout for the task board. */
export type TaskBoardViewMode = 'board' | 'list';

export const DEFAULT_TASK_BOARD_VIEW_MODE: TaskBoardViewMode = 'board';

const STORAGE_KEY = 'flux.taskBoardViewMode.v1';

type StoreV1 = {
  v: 1;
  byProject: Record<string, TaskBoardViewMode>;
};

function isTaskBoardViewMode(value: unknown): value is TaskBoardViewMode {
  return value === 'board' || value === 'list';
}

function readStore(): StoreV1 {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { v: 1, byProject: {} };
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object' || (parsed as { v?: unknown }).v !== 1) {
      return { v: 1, byProject: {} };
    }
    const byProject = (parsed as { byProject?: unknown }).byProject;
    if (!byProject || typeof byProject !== 'object') {
      return { v: 1, byProject: {} };
    }
    const cleaned: Record<string, TaskBoardViewMode> = {};
    for (const [projectId, mode] of Object.entries(byProject)) {
      if (isTaskBoardViewMode(mode)) {
        cleaned[projectId] = mode;
      }
    }
    return { v: 1, byProject: cleaned };
  } catch {
    return { v: 1, byProject: {} };
  }
}

function writeStore(store: StoreV1): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    /* quota / private mode */
  }
}

export function readTaskBoardViewModeForProject(projectId: string): TaskBoardViewMode {
  const mode = readStore().byProject[projectId];
  return isTaskBoardViewMode(mode) ? mode : DEFAULT_TASK_BOARD_VIEW_MODE;
}

export function writeTaskBoardViewModeForProject(
  projectId: string,
  mode: TaskBoardViewMode,
): void {
  const store = readStore();
  store.byProject[projectId] = mode;
  writeStore(store);
}
