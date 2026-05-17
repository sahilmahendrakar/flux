import fs from 'node:fs/promises';
import path from 'node:path';

export type PlanningInitStatus = 'pending' | 'dismissed' | 'completed';

export interface ProjectOnboardingFile {
  planningInit: PlanningInitStatus;
  planningInitUpdatedAt: string;
  createdWithOnboardingV2: boolean;
}

export async function writeOnboardingPending(projectDir: string): Promise<void> {
  const payload: ProjectOnboardingFile = {
    planningInit: 'pending',
    planningInitUpdatedAt: new Date().toISOString(),
    createdWithOnboardingV2: true,
  };
  await fs.writeFile(
    path.join(projectDir, 'onboarding.json'),
    `${JSON.stringify(payload, null, 2)}\n`,
    'utf8',
  );
}
