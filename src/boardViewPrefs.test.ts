import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEFAULT_TASK_BOARD_VIEW_MODE,
  readTaskBoardViewModeForProject,
  writeTaskBoardViewModeForProject,
} from './boardViewPrefs';

describe('boardViewPrefs', () => {
  const store = new Map<string, string>();

  beforeEach(() => {
    store.clear();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
      removeItem: (key: string) => {
        store.delete(key);
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('defaults to board when unset', () => {
    expect(readTaskBoardViewModeForProject('p1')).toBe(DEFAULT_TASK_BOARD_VIEW_MODE);
  });

  it('persists per project', () => {
    writeTaskBoardViewModeForProject('p1', 'list');
    writeTaskBoardViewModeForProject('p2', 'board');
    expect(readTaskBoardViewModeForProject('p1')).toBe('list');
    expect(readTaskBoardViewModeForProject('p2')).toBe('board');
  });
});
