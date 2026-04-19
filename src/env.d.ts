// eslint-disable-next-line @typescript-eslint/no-unused-vars -- mirrors shared Task shape (status uses TaskStatus)
import type { Task, Agent, TaskStatus, Project } from './types';

declare global {
  interface Window {
    electronAPI: {
      platform: string;
      project: {
        get: () => Promise<Project | null>;
        open: () => Promise<Project | { error: string } | null>;
        clear: () => Promise<void>;
      };
      tasks: {
        getAll: () => Promise<Task[]>;
        create: (input: { title: string; agent: Agent }) => Promise<Task>;
        update: (
          id: string,
          patch: Partial<Pick<Task, 'title' | 'status' | 'agent' | 'description'>>,
        ) => Promise<Task>;
        delete: (id: string) => Promise<void>;
      };
    };
  }
}

export {};
