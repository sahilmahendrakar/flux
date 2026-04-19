import { app } from 'electron';
import fs from 'node:fs/promises';
import path from 'node:path';
import type { Project } from '../types';

export class ProjectStore {
  private filePath: string;
  private project: Project | null = null;

  constructor() {
    this.filePath = path.join(app.getPath('userData'), 'project.json');
  }

  async init(): Promise<void> {
    try {
      const raw = await fs.readFile(this.filePath, 'utf8');
      let parsed: unknown;
      try {
        parsed = JSON.parse(raw) as unknown;
      } catch {
        this.project = null;
        return;
      }
      if (!parsed || typeof parsed !== 'object') {
        this.project = null;
        return;
      }
      const p = parsed as Partial<Project>;
      if (
        typeof p.id !== 'string' ||
        typeof p.name !== 'string' ||
        typeof p.rootPath !== 'string' ||
        typeof p.addedAt !== 'string'
      ) {
        this.project = null;
        return;
      }
      this.project = {
        id: p.id,
        name: p.name,
        rootPath: p.rootPath,
        addedAt: p.addedAt,
      };
    } catch (err: unknown) {
      const code =
        err && typeof err === 'object' && 'code' in err
          ? (err as NodeJS.ErrnoException).code
          : undefined;
      if (code === 'ENOENT') {
        this.project = null;
        return;
      }
      throw err;
    }
  }

  get(): Project | null {
    return this.project;
  }

  async set(project: Project): Promise<void> {
    this.project = project;
    const tmpPath = `${this.filePath}.tmp`;
    const payload = `${JSON.stringify(project, null, 2)}\n`;
    await fs.writeFile(tmpPath, payload, 'utf8');
    if (process.platform === 'win32') {
      try {
        await fs.unlink(this.filePath);
      } catch (e: unknown) {
        const code =
          e && typeof e === 'object' && 'code' in e
            ? (e as NodeJS.ErrnoException).code
            : undefined;
        if (code !== 'ENOENT') {
          throw e;
        }
      }
    }
    await fs.rename(tmpPath, this.filePath);
  }

  async clear(): Promise<void> {
    this.project = null;
    try {
      await fs.unlink(this.filePath);
    } catch (err: unknown) {
      const code =
        err && typeof err === 'object' && 'code' in err
          ? (err as NodeJS.ErrnoException).code
          : undefined;
      if (code !== 'ENOENT') {
        throw err;
      }
    }
  }
}
