import { ipcMain, type BrowserWindow } from 'electron';
import {
  MCP_BRIDGE_READY_CHANNEL,
  MCP_BRIDGE_REQUEST_CHANNEL,
  MCP_BRIDGE_RESPONSE_CHANNEL,
  type McpBridgeErrorCode,
  type McpBridgeOp,
  type McpBridgeRequest,
  type McpBridgeResponse,
} from '../mcpBridge';
import type { ActiveProjectKey } from '../types';

const DEFAULT_REQUEST_TIMEOUT_MS = 8000;
const DEFAULT_READY_TIMEOUT_MS = 5000;

export type McpBridgeResult<T = unknown> =
  | { ok: true; data: T }
  | { ok: false; code: McpBridgeErrorCode; message: string };

interface PendingRequest {
  resolve: (resp: McpBridgeResponse) => void;
  timer: NodeJS.Timeout;
}

/**
 * Main-side request/response bridge to the renderer for MCP cloud-project
 * operations. The renderer holds the Firebase auth context and the active
 * TaskProvider, so all Firestore reads/writes for cloud projects go through
 * this RPC. Local projects do not use the bridge.
 */
export class McpRendererBridge {
  private getMainWindow: () => BrowserWindow | null;
  private rendererReady = false;
  private readyWaiters: Array<() => void> = [];
  private pending = new Map<string, PendingRequest>();
  private nextId = 0;
  private installed = false;

  constructor(getMainWindow: () => BrowserWindow | null) {
    this.getMainWindow = getMainWindow;
  }

  install(): void {
    if (this.installed) return;
    this.installed = true;
    ipcMain.on(MCP_BRIDGE_RESPONSE_CHANNEL, (_e, resp: McpBridgeResponse) => {
      const pending = this.pending.get(resp.id);
      if (!pending) return;
      clearTimeout(pending.timer);
      this.pending.delete(resp.id);
      pending.resolve(resp);
    });
    ipcMain.on(MCP_BRIDGE_READY_CHANNEL, () => {
      this.markReady();
    });
  }

  /** Renderer reload/navigate clears readiness; next signalReady flips it back. */
  markNotReady(): void {
    this.rendererReady = false;
  }

  isReady(): boolean {
    return this.rendererReady;
  }

  private markReady(): void {
    this.rendererReady = true;
    const waiters = this.readyWaiters.splice(0);
    for (const w of waiters) w();
  }

  private waitUntilReady(timeoutMs: number): Promise<boolean> {
    if (this.rendererReady) return Promise.resolve(true);
    return new Promise((resolve) => {
      let settled = false;
      const onReady = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        resolve(true);
      };
      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        const ix = this.readyWaiters.indexOf(onReady);
        if (ix !== -1) this.readyWaiters.splice(ix, 1);
        resolve(false);
      }, timeoutMs);
      this.readyWaiters.push(onReady);
    });
  }

  async request<T = unknown>(
    op: McpBridgeOp,
    expectedActiveKey: ActiveProjectKey,
    payload?: unknown,
    options?: { timeoutMs?: number; readyTimeoutMs?: number },
  ): Promise<McpBridgeResult<T>> {
    const win = this.getMainWindow();
    if (!win || win.isDestroyed()) {
      return {
        ok: false,
        code: 'RENDERER_NOT_READY',
        message: 'No main window available',
      };
    }

    const ready = await this.waitUntilReady(
      options?.readyTimeoutMs ?? DEFAULT_READY_TIMEOUT_MS,
    );
    if (!ready) {
      return {
        ok: false,
        code: 'RENDERER_NOT_READY',
        message: 'Renderer did not signal ready in time',
      };
    }

    const id = `mcp-bridge-${Date.now()}-${++this.nextId}`;
    const timeoutMs = options?.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS;

    const envelope = await new Promise<McpBridgeResponse>((resolve) => {
      const timer = setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          resolve({
            id,
            ok: false,
            code: 'RENDERER_TIMEOUT',
            message: `No response from renderer within ${timeoutMs}ms`,
          });
        }
      }, timeoutMs);
      this.pending.set(id, { resolve, timer });

      const req: McpBridgeRequest = { id, op, expectedActiveKey, payload };
      try {
        win.webContents.send(MCP_BRIDGE_REQUEST_CHANNEL, req);
      } catch (err) {
        const pending = this.pending.get(id);
        if (pending) {
          clearTimeout(pending.timer);
          this.pending.delete(id);
        }
        resolve({
          id,
          ok: false,
          code: 'INTERNAL',
          message: err instanceof Error ? err.message : String(err),
        });
      }
    });

    if (envelope.ok) {
      return { ok: true, data: envelope.data as T };
    }
    return { ok: false, code: envelope.code, message: envelope.message };
  }
}
