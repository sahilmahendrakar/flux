import { useCallback, useEffect, useRef, useState } from 'react';
import { DropResult } from '@hello-pangea/dnd';
import { Task, TaskStatus, Agent } from './types';
import Board from './components/Board';
import TaskDetailPanel from './components/TaskDetailPanel';
import { AppShell } from './components/AppShell';
import { TopBar } from './components/TopBar';
import type { WorkspaceNavView } from './components/Sidebar';

type TaskPatch = Partial<Pick<Task, 'title' | 'status' | 'agent' | 'description'>>;

const UPDATE_DEBOUNCE_MS = 300;

export default function App() {
  const isMac = window.electronAPI.platform === 'darwin';
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [workspaceView, setWorkspaceView] = useState<WorkspaceNavView>('board');

  const selectedTask = tasks.find((t) => t.id === selectedTaskId) ?? null;

  useEffect(() => {
    let cancelled = false;
    window.electronAPI.tasks
      .getAll()
      .then((all) => {
        if (cancelled) return;
        setTasks(all);
        setLoaded(true);
      })
      .catch((err) => {
        console.error('[tasks.getAll] failed', err);
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const pendingRef = useRef<
    Map<string, { patch: TaskPatch; timer: ReturnType<typeof setTimeout> }>
  >(new Map());

  useEffect(() => {
    const pending = pendingRef.current;
    return () => {
      for (const { timer } of pending.values()) clearTimeout(timer);
      pending.clear();
    };
  }, []);

  const flushUpdate = useCallback(async (id: string) => {
    const pending = pendingRef.current.get(id);
    if (!pending) return;
    pendingRef.current.delete(id);
    try {
      const updated = await window.electronAPI.tasks.update(id, pending.patch);
      // Preserve any newer pending edits so a stale server result doesn't clobber them.
      const newer = pendingRef.current.get(id);
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...updated, ...(newer?.patch ?? {}) } : t)),
      );
    } catch (err) {
      console.error('[tasks.update] failed', err);
    }
  }, []);

  const handleUpdateTask = useCallback(
    (id: string, patch: Partial<Task>) => {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));

      const persistable: TaskPatch = {};
      if (patch.title !== undefined) persistable.title = patch.title;
      if (patch.description !== undefined) persistable.description = patch.description;
      if (patch.status !== undefined) persistable.status = patch.status;
      if (patch.agent !== undefined) persistable.agent = patch.agent;
      if (Object.keys(persistable).length === 0) return;

      const existing = pendingRef.current.get(id);
      if (existing) clearTimeout(existing.timer);
      const merged: TaskPatch = { ...existing?.patch, ...persistable };
      const timer = setTimeout(() => {
        void flushUpdate(id);
      }, UPDATE_DEBOUNCE_MS);
      pendingRef.current.set(id, { patch: merged, timer });
    },
    [flushUpdate],
  );

  const handleDragEnd = useCallback(async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }
    const nextStatus = destination.droppableId as TaskStatus;

    setTasks((prev) =>
      prev.map((t) => (t.id === draggableId ? { ...t, status: nextStatus } : t)),
    );

    try {
      const updated = await window.electronAPI.tasks.update(draggableId, {
        status: nextStatus,
      });
      const pending = pendingRef.current.get(draggableId);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === draggableId ? { ...updated, ...(pending?.patch ?? {}) } : t,
        ),
      );
    } catch (err) {
      console.error('[tasks.update] drag-end failed', err);
    }
  }, []);

  const handleCreateTask = useCallback(async (title: string, agent: Agent) => {
    try {
      const task = await window.electronAPI.tasks.create({ title, agent });
      setTasks((prev) => [...prev, task]);
    } catch (err) {
      console.error('[tasks.create] failed', err);
    }
  }, []);

  const handleDeleteTask = useCallback(async (id: string) => {
    const pending = pendingRef.current.get(id);
    if (pending) {
      clearTimeout(pending.timer);
      pendingRef.current.delete(id);
    }
    try {
      await window.electronAPI.tasks.delete(id);
      setTasks((prev) => prev.filter((t) => t.id !== id));
      setSelectedTaskId((sid) => (sid === id ? null : sid));
    } catch (err) {
      console.error('[tasks.delete] failed', err);
    }
  }, []);

  const inProgressCount = tasks.filter((t) => t.status === 'in-progress').length;
  const needsInputCount = tasks.filter((t) => t.status === 'needs-input').length;
  const statusLine = `${inProgressCount} in progress · ${needsInputCount} needs input`;

  const topBarTitle = workspaceView === 'board' ? 'Board' : 'Plan';

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-gray-950 text-white">
      {isMac ? (
        <div
          className="app-window-drag h-10 w-full shrink-0 bg-gray-950"
          aria-hidden
        />
      ) : null}
      <div className="app-window-no-drag flex min-h-0 flex-1 flex-col overflow-hidden">
        <AppShell workspaceView={workspaceView} onWorkspaceViewChange={setWorkspaceView}>
          <TopBar title={topBarTitle} statusLine={statusLine} />
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
            {workspaceView === 'board' ? (
              <div className="relative min-h-0 flex-1 overflow-hidden">
                {loaded ? (
                  <>
                    <Board
                      tasks={tasks}
                      onDragEnd={handleDragEnd}
                      onCreateTask={handleCreateTask}
                      onDeleteTask={handleDeleteTask}
                      onCardClick={(id) => setSelectedTaskId(id)}
                    />
                    <TaskDetailPanel
                      task={selectedTask}
                      onClose={() => setSelectedTaskId(null)}
                      onUpdate={handleUpdateTask}
                      onDelete={handleDeleteTask}
                    />
                  </>
                ) : null}
              </div>
            ) : (
              <div className="flex flex-1 items-center justify-center px-6 text-sm text-gray-500">
                Planning assistant coming soon
              </div>
            )}
          </div>
        </AppShell>
      </div>
    </div>
  );
}
