/** Planning PTY + `fluxx` CLI read these to reach the local automation HTTP endpoint. */
export const FLUXX_AUTOMATION_URL_ENV = 'FLUXX_AUTOMATION_URL';
export const FLUXX_AUTOMATION_TOKEN_ENV = 'FLUXX_AUTOMATION_TOKEN';
export const FLUXX_AUTOMATION_EXPECTED_ACTIVE_KEY_ENV = 'FLUXX_AUTOMATION_EXPECTED_ACTIVE_KEY';

/** @deprecated Legacy env names; still read when FLUXX_* is unset. */
export const FLUX_AUTOMATION_URL_ENV = 'FLUX_AUTOMATION_URL';
export const FLUX_AUTOMATION_TOKEN_ENV = 'FLUX_AUTOMATION_TOKEN';
export const FLUX_AUTOMATION_EXPECTED_ACTIVE_KEY_ENV = 'FLUX_AUTOMATION_EXPECTED_ACTIVE_KEY';

export function readFluxxAutomationUrlFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): string | undefined {
  return env[FLUXX_AUTOMATION_URL_ENV]?.trim() || env[FLUX_AUTOMATION_URL_ENV]?.trim() || undefined;
}

export function readFluxxAutomationTokenFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): string | undefined {
  return env[FLUXX_AUTOMATION_TOKEN_ENV]?.trim() || env[FLUX_AUTOMATION_TOKEN_ENV]?.trim() || undefined;
}

export function readFluxxAutomationExpectedActiveKeyFromEnv(
  env: NodeJS.ProcessEnv = process.env,
): string | undefined {
  return (
    env[FLUXX_AUTOMATION_EXPECTED_ACTIVE_KEY_ENV]?.trim() ||
    env[FLUX_AUTOMATION_EXPECTED_ACTIVE_KEY_ENV]?.trim() ||
    undefined
  );
}
