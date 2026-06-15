import * as akeyless from 'akeyless';
import { authenticate } from './auth';
import { TtlCache } from './cache';
import { configFromEnv, validateConfig } from './config';
import {
  formatStructuredResponse,
  joinSecretPath,
  normalizePath,
  pickSecretFromResponse,
} from './paths';
import type {
  AkeylessRuntimeConfig,
  AkeylessRuntimeConfigInput,
  DynamicSecretOptions,
  GetSecretOptions,
  RotatedSecretOptions,
} from './types';

function isNotFoundError(error: unknown): boolean {
  const status = (error as { status?: number }).status;
  if (status === 404) {
    return true;
  }
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
  return message.includes('not found') || message.includes('404');
}

export class AkeylessRuntimeClient {
  private readonly config: AkeylessRuntimeConfig;
  private readonly api: akeyless.V2Api;
  private session: { token: string; expiresAtMs: number } | null = null;
  private readonly secretCache = new TtlCache<string>();

  constructor(config: AkeylessRuntimeConfigInput = {}) {
    this.config = configFromEnv(config);
    validateConfig(this.config);

    const client = new akeyless.ApiClient();
    client.basePath = this.config.gatewayUrl.replace(/\/$/, '');
    this.api = new akeyless.V2Api(client);
  }

  static fromEnv(overrides: AkeylessRuntimeConfigInput = {}): AkeylessRuntimeClient {
    return new AkeylessRuntimeClient(overrides);
  }

  getConfig(): Readonly<AkeylessRuntimeConfig> {
    return this.config;
  }

  resolvePath(nameOrPath: string): string {
    const trimmed = nameOrPath.trim();
    if (trimmed.startsWith('/')) {
      return normalizePath(trimmed);
    }
    return joinSecretPath(this.config.secretPrefix, trimmed);
  }

  clearCache(): void {
    this.secretCache.clear();
    this.session = null;
  }

  private async getToken(): Promise<string> {
    const now = Date.now();
    if (this.session && now < this.session.expiresAtMs) {
      return this.session.token;
    }

    this.session = await authenticate(this.api, this.config);
    return this.session.token;
  }

  private cacheKey(path: string, kind: string, extra = ''): string {
    return `${kind}:${path}:${extra}`;
  }

  private readCached(path: string, kind: string, ignoreCache?: boolean): string | undefined {
    if (ignoreCache) {
      return undefined;
    }
    return this.secretCache.get(this.cacheKey(path, kind));
  }

  private writeCached(path: string, kind: string, value: string): void {
    this.secretCache.set(
      this.cacheKey(path, kind),
      value,
      this.config.secretCacheTtlMs,
    );
  }

  async getSecretAtPath(
    path: string,
    options: Omit<GetSecretOptions, 'path'> = {},
  ): Promise<string> {
    const resolved = normalizePath(path);
    const cached = this.readCached(resolved, 'static', options.ignoreCache);
    if (cached !== undefined) {
      return cached;
    }

    const token = await this.getToken();
    const body: Record<string, unknown> = {
      names: [resolved],
      token,
    };

    if (options.version !== undefined) {
      body.version = options.version;
    }
    if (options.json) {
      body.json = true;
    }
    if (options.ignoreCache) {
      body['ignore-cache'] = 'true';
    }

    try {
      const raw = (await this.api.getSecretValue(
        akeyless.GetSecretValue.constructFromObject(body),
      )) as Record<string, unknown>;
      const value = pickSecretFromResponse(resolved, raw);
      this.writeCached(resolved, 'static', value);
      return value;
    } catch (error) {
      if (options.allowDynamicFallback && isNotFoundError(error)) {
        return this.getDynamicSecretAtPath(resolved, {
          ignoreCache: options.ignoreCache,
        });
      }
      throw error;
    }
  }

  async getSecret(name: string, options: GetSecretOptions = {}): Promise<string> {
    const path = options.path ?? this.resolvePath(name);
    return this.getSecretAtPath(path, options);
  }

  async getDynamicSecretAtPath(
    path: string,
    options: Omit<DynamicSecretOptions, 'path'> = {},
  ): Promise<string> {
    const resolved = normalizePath(path);
    const shouldCache =
      !options.args?.length &&
      options.timeout === undefined &&
      !options.host &&
      !options.dbname &&
      !options.target;

    const cached = shouldCache
      ? this.readCached(resolved, 'dynamic', options.ignoreCache)
      : undefined;
    if (cached !== undefined) {
      return cached;
    }

    const token = await this.getToken();
    const body: Record<string, unknown> = {
      name: resolved,
      token,
    };

    if (options.timeout !== undefined) {
      body.timeout = options.timeout;
    }
    if (options.args?.length) {
      body.args = options.args;
    }
    if (options.host) {
      body.host = options.host;
    }
    if (options.dbname) {
      body.dbname = options.dbname;
    }
    if (options.target) {
      body.target = options.target;
    }
    if (options.json) {
      body.json = true;
    }
    if (options.ignoreCache) {
      body['ignore-cache'] = 'true';
    }

    const raw = await this.api.getDynamicSecretValue(
      akeyless.GetDynamicSecretValue.constructFromObject(body),
    );
    const value = formatStructuredResponse(raw);

    if (shouldCache) {
      this.writeCached(resolved, 'dynamic', value);
    }

    return value;
  }

  async getDynamicSecret(
    name: string,
    options: DynamicSecretOptions = {},
  ): Promise<string> {
    const path = options.path ?? this.resolvePath(name);
    return this.getDynamicSecretAtPath(path, options);
  }

  async getRotatedSecretAtPath(
    path: string,
    options: Omit<RotatedSecretOptions, 'path'> = {},
  ): Promise<string> {
    const resolved = normalizePath(path);
    const cached = this.readCached(resolved, 'rotated', options.ignoreCache);
    if (cached !== undefined) {
      return cached;
    }

    const token = await this.getToken();
    const body: Record<string, unknown> = {
      names: resolved,
      token,
    };

    if (options.host) {
      body.host = options.host;
    }
    if (options.version !== undefined) {
      body.version = options.version;
    }
    if (options.json) {
      body.json = true;
    }
    if (options.ignoreCache) {
      body['ignore-cache'] = 'true';
    }

    const raw = await this.api.getRotatedSecretValue(
      akeyless.GetRotatedSecretValue.constructFromObject(body),
    );
    const value = formatStructuredResponse(raw);
    this.writeCached(resolved, 'rotated', value);
    return value;
  }

  async getRotatedSecret(
    name: string,
    options: RotatedSecretOptions = {},
  ): Promise<string> {
    const path = options.path ?? this.resolvePath(name);
    return this.getRotatedSecretAtPath(path, options);
  }
}
