export { AkeylessRuntimeClient } from './client';
export { configFromEnv, validateConfig } from './config';
export {
  defaultFlySecretPrefix,
  formatStructuredResponse,
  joinSecretPath,
  normalizePath,
  pickSecretFromResponse,
  slugifySegment,
} from './paths';
export type {
  AccessType,
  AkeylessRuntimeConfig,
  AkeylessRuntimeConfigInput,
  CloudProvider,
  DynamicSecretOptions,
  GetSecretOptions,
  RotatedSecretOptions,
} from './types';

import { AkeylessRuntimeClient } from './client';
import type { AkeylessRuntimeConfigInput, GetSecretOptions } from './types';

let defaultClient: AkeylessRuntimeClient | undefined;

/**
 * Returns a process-wide client configured from Fly.io runtime variables.
 * Reused across requests on long-lived Fly Machines.
 */
export function getDefaultClient(
  overrides: AkeylessRuntimeConfigInput = {},
): AkeylessRuntimeClient {
  if (!defaultClient) {
    defaultClient = new AkeylessRuntimeClient(overrides);
  }
  return defaultClient;
}

/** Reset the singleton (useful in tests). */
export function resetDefaultClient(): void {
  defaultClient = undefined;
}

export function createClient(
  config: AkeylessRuntimeConfigInput = {},
): AkeylessRuntimeClient {
  return new AkeylessRuntimeClient(config);
}

export async function getSecret(
  name: string,
  options?: GetSecretOptions,
): Promise<string> {
  return getDefaultClient().getSecret(name, options);
}
