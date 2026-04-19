import { contextBridge, ipcRenderer } from 'electron';
import type { Agent, Project, Task } from './types';

contextBridge.exposeInMainWorld('electronAPI', {
  platform: process.platform,
  project: {
    get: () => ipcRenderer.invoke('project:get') as Promise<Project | null>,
    open: () =>
      ipcRenderer.invoke('project:open') as Promise<
        Project | { error: string } | null
      >,
    clear: () => ipcRenderer.invoke('project:clear') as Promise<void>,
  },
  tasks: {
    getAll: () => ipcRenderer.invoke('tasks:getAll') as Promise<Task[]>,
    create: (input: { title: string; agent: Agent }) =>
      ipcRenderer.invoke('tasks:create', input) as Promise<Task>,
    update: (
      id: string,
      patch: Partial<Pick<Task, 'title' | 'status' | 'agent' | 'description'>>,
    ) => ipcRenderer.invoke('tasks:update', id, patch) as Promise<Task>,
    delete: (id: string) =>
      ipcRenderer.invoke('tasks:delete', id) as Promise<void>,
  },
});
