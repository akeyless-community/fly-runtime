import { configFromEnv, validateConfig } from './config';
import { defaultFlySecretPrefix } from './paths';

describe('configFromEnv', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('reads access key settings from env', () => {
    process.env.AKEYLESS_ACCESS_ID = 'p-123';
    process.env.AKEYLESS_ACCESS_KEY = 'key-456';
    process.env.AKEYLESS_SECRET_PREFIX = '/fly/demo/production';

    const config = configFromEnv();
    expect(config.accessId).toBe('p-123');
    expect(config.accessKey).toBe('key-456');
    expect(config.secretPrefix).toBe('/fly/demo/production');
    expect(() => validateConfig(config)).not.toThrow();
  });

  it('derives secret prefix from Fly metadata', () => {
    delete process.env.AKEYLESS_SECRET_PREFIX;
    delete process.env.AKEYLESS_INCLUDE_PROCESS_GROUP_IN_PREFIX;
    process.env.FLY_APP_NAME = 'My Shop';
    process.env.FLY_ENV = 'staging';

    const config = configFromEnv();
    expect(config.secretPrefix).toBe('/fly/my-shop/staging');
  });

  it('prefers AKEYLESS_ENV over FLY_ENV', () => {
    delete process.env.AKEYLESS_SECRET_PREFIX;
    process.env.FLY_APP_NAME = 'checkout';
    process.env.FLY_ENV = 'staging';
    process.env.AKEYLESS_ENV = 'production';

    const config = configFromEnv();
    expect(config.secretPrefix).toBe('/fly/checkout/production');
  });

  it('includes process group in prefix when opted in', () => {
    delete process.env.AKEYLESS_SECRET_PREFIX;
    process.env.FLY_APP_NAME = 'checkout';
    process.env.FLY_ENV = 'production';
    process.env.FLY_PROCESS_GROUP = 'worker';
    process.env.AKEYLESS_INCLUDE_PROCESS_GROUP_IN_PREFIX = 'true';

    const config = configFromEnv();
    expect(config.secretPrefix).toBe('/fly/checkout/production/worker');
  });

  it('requires credentials when token is absent', () => {
    delete process.env.AKEYLESS_TOKEN;
    delete process.env.AKEYLESS_ACCESS_ID;
    delete process.env.AKEYLESS_ACCESS_KEY;

    const config = configFromEnv();
    expect(() => validateConfig(config)).toThrow(/accessId and accessKey/);
  });
});

describe('defaultFlySecretPrefix', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns undefined without Fly app metadata', () => {
    delete process.env.FLY_APP_NAME;
    expect(defaultFlySecretPrefix()).toBeUndefined();
  });

  it('falls back to production when no environment is set', () => {
    delete process.env.AKEYLESS_ENV;
    delete process.env.FLY_ENV;
    process.env.FLY_APP_NAME = 'my-api';

    expect(defaultFlySecretPrefix()).toBe('/fly/my-api/production');
  });
});
