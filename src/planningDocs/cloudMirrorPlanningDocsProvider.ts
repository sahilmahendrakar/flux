import type { PlanningDocsProvider } from './FilesystemPlanningDocsProvider';
import type { PlanningDocsBackendKind, PlanningDocsListResult, PlanningDocsReadResult } from './types';

/**
 * Cloud workspaces use the same on-disk `planning/` tree as agents; the renderer
 * hydrates Firestore `planningDocs` into that folder so list/read stay file-based.
 */
export class CloudMirrorPlanningDocsProvider implements PlanningDocsProvider {
  readonly backendKind: PlanningDocsBackendKind = 'cloud-workspace-mirror-disk';

  constructor(private readonly disk: PlanningDocsProvider) {}

  list(): Promise<PlanningDocsListResult> {
    return this.disk.list();
  }

  read(relativePath: string): Promise<PlanningDocsReadResult> {
    return this.disk.read(relativePath);
  }
}
