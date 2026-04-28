import * as pty from 'node-pty';
import type { IPty } from 'node-pty';
import { Terminal as HeadlessTerminal } from '@xterm/headless';
import type { AttachResult } from './protocol';

const DEFAULT_REPLAY_BYTES = 256 * 1024;

export interface SessionRuntimeSpawnSpec {
  command: string;
  args: string[];
  cwd: string;
  cols: number;
  rows: number;
  env?: NodeJS.ProcessEnv;
}

export interface SessionRuntimeCallbacks {
  /** Called on every raw PTY chunk. Daemon writes this to the stream socket. */
  onData: (data: string) => void;
  /** Called once when the PTY exits. */
  onExit: (info: { exitCode: number; signal?: number }) => void;
}

/**
 * One node-pty child + a headless xterm emulator + a bounded circular
 * buffer of recent raw output. The same shape is used for agent sessions,
 * free-form shells, and the planning PTY — the only difference between
 * them lives in the registry at the Daemon layer.
 *
 * Attach RPC returns `AttachResult`: legacy `replay` plus optional
 * `snapshot` (serialized headless state) once the daemon implements it.
 * Live bytes continue on the stream socket after the RPC response.
 */
export class SessionRuntime {
  readonly pty: IPty;
  readonly headless: HeadlessTerminal;
  private replay: string[] = [];
  private replayBytes = 0;
  private readonly replayCapBytes: number;
  private exited = false;
  private lastExitCode = 0;
  private cols: number;
  private rows: number;
  private cwd: string;

  constructor(
    spec: SessionRuntimeSpawnSpec,
    callbacks: SessionRuntimeCallbacks,
    opts: { replayCapBytes?: number } = {},
  ) {
    this.replayCapBytes = opts.replayCapBytes ?? DEFAULT_REPLAY_BYTES;
    this.cols = spec.cols;
    this.rows = spec.rows;
    this.cwd = spec.cwd;

    this.pty = pty.spawn(spec.command, spec.args, {
      name: 'xterm-color',
      cols: spec.cols,
      rows: spec.rows,
      cwd: spec.cwd,
      env: spec.env ?? { ...process.env },
    });

    this.headless = new HeadlessTerminal({
      cols: spec.cols,
      rows: spec.rows,
      scrollback: 5000,
      allowProposedApi: true,
    });

    this.pty.onData((chunk) => {
      this.appendReplay(chunk);
      this.headless.write(chunk);
      callbacks.onData(chunk);
    });

    this.pty.onExit(({ exitCode, signal }) => {
      this.exited = true;
      this.lastExitCode = exitCode;
      callbacks.onExit({ exitCode, signal });
    });
  }

  /** Append to the circular replay buffer, discarding oldest bytes. */
  private appendReplay(chunk: string): void {
    const bytes = Buffer.byteLength(chunk, 'utf8');
    this.replay.push(chunk);
    this.replayBytes += bytes;
    while (this.replayBytes > this.replayCapBytes && this.replay.length > 1) {
      const dropped = this.replay.shift();
      if (dropped !== undefined) {
        this.replayBytes -= Buffer.byteLength(dropped, 'utf8');
      }
    }
  }

  /** Attach payload: replay buffer today; optional `snapshot` added in SessionRuntime later. */
  snapshot(): AttachResult {
    return {
      replay: this.replay.join(''),
      cols: this.cols,
      rows: this.rows,
    };
  }

  write(data: string): void {
    if (this.exited) return;
    this.pty.write(data);
  }

  resize(cols: number, rows: number): void {
    if (this.exited) return;
    if (cols <= 0 || rows <= 0) return;
    this.cols = cols;
    this.rows = rows;
    try {
      this.pty.resize(cols, rows);
    } catch {
      // Child may have just exited between the check and the call.
    }
    try {
      this.headless.resize(cols, rows);
    } catch {
      // Ignore resize failures on the headless mirror.
    }
  }

  kill(): void {
    if (this.exited) return;
    try {
      this.pty.kill();
    } catch {
      // PTY already gone.
    }
  }

  dispose(): void {
    try {
      this.headless.dispose();
    } catch {
      // Ignore headless teardown failures.
    }
  }

  get isExited(): boolean {
    return this.exited;
  }

  get exitCode(): number {
    return this.lastExitCode;
  }

  get currentCwd(): string {
    return this.cwd;
  }
}
