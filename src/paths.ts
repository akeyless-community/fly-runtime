export function normalizePath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed) {
    return '/';
  }
  const withLeading = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  return withLeading.replace(/\/+/g, '/').replace(/\/$/, '') || '/';
}

export function joinSecretPath(prefix: string, name: string): string {
  const base = normalizePath(prefix);
  const segment = name.trim().replace(/^\/+/, '');
  if (!segment) {
    return base;
  }
  if (base === '/') {
    return `/${segment}`;
  }
  return `${base}/${segment}`;
}

export function pickSecretFromResponse(
  requestedPath: string,
  data: Record<string, unknown> | null | undefined,
): string {
  if (!data || typeof data !== 'object') {
    throw new Error('Akeyless returned an empty secret payload');
  }

  const trimmed = requestedPath.trim();
  const candidates = [
    trimmed,
    normalizePath(trimmed),
    trimmed.replace(/^\//, ''),
  ];

  for (const key of candidates) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      return stringifySecretValue(data[key]);
    }
  }

  throw new Error(`No value for "${requestedPath}" in Akeyless response`);
}

export function stringifySecretValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return JSON.stringify(value);
}

export function formatStructuredResponse(data: unknown): string {
  if (data === null || data === undefined) {
    throw new Error('Akeyless returned an empty response');
  }
  if (typeof data === 'string') {
    return data;
  }
  return JSON.stringify(data);
}

/** Normalize Fly app/process names for stable Akeyless path segments. */
export function slugifySegment(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function truthyEnv(name: string): boolean {
  const raw = process.env[name]?.trim().toLowerCase();
  return raw === '1' || raw === 'true' || raw === 'yes';
}

export function defaultFlySecretPrefix(): string | undefined {
  const appName = process.env.FLY_APP_NAME?.trim();
  if (!appName) {
    return undefined;
  }

  const environment =
    process.env.AKEYLESS_ENV?.trim() ||
    process.env.FLY_ENV?.trim() ||
    'production';
  const appSegment = slugifySegment(appName);
  const environmentSegment = slugifySegment(environment);

  const processGroup = process.env.FLY_PROCESS_GROUP?.trim();
  if (processGroup && truthyEnv('AKEYLESS_INCLUDE_PROCESS_GROUP_IN_PREFIX')) {
    const processSegment = slugifySegment(processGroup);
    return `/fly/${appSegment}/${environmentSegment}/${processSegment}`;
  }

  return `/fly/${appSegment}/${environmentSegment}`;
}
