export type CloudProvider = 'aws_iam' | 'azure_ad' | 'gcp';

export type AccessType =
  | 'access_key'
  | 'api_key'
  | 'aws_iam'
  | 'azure_ad'
  | 'gcp'
  | 'universal_identity'
  | 'jwt';

export interface DynamicSecretOptions {
  /** Full Akeyless path; overrides prefix + name resolution. */
  path?: string;
  timeout?: number;
  args?: string[];
  host?: string;
  dbname?: string;
  target?: string;
  json?: boolean;
  ignoreCache?: boolean;
}

export interface RotatedSecretOptions {
  path?: string;
  host?: string;
  version?: number;
  json?: boolean;
  ignoreCache?: boolean;
}

export interface GetSecretOptions {
  /** Full Akeyless path; overrides prefix + name resolution. */
  path?: string;
  version?: number;
  json?: boolean;
  ignoreCache?: boolean;
  /** When true, fall back to GetDynamicSecretValue if static secret is missing. */
  allowDynamicFallback?: boolean;
}

export interface AkeylessRuntimeConfig {
  gatewayUrl: string;
  /** Prepended to short secret names, e.g. `/fly/my-app/production`. */
  secretPrefix: string;
  accessType: AccessType;
  accessId?: string;
  accessKey?: string;
  uidToken?: string;
  jwt?: string;
  /** Pre-authenticated session token (skips /auth). */
  token?: string;
  /** For cloud IAM when ambient credentials are unavailable. */
  cloudId?: string;
  cloudProvider?: CloudProvider;
  /** In-memory cache TTL for secret values (default 5 minutes). */
  secretCacheTtlMs: number;
  /** Session token refresh margin before expiry (default 1 minute). */
  tokenExpiryMarginMs: number;
}

export type AkeylessRuntimeConfigInput = Partial<AkeylessRuntimeConfig>;
