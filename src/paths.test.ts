import {
  defaultFlySecretPrefix,
  joinSecretPath,
  normalizePath,
  pickSecretFromResponse,
  slugifySegment,
} from './paths';

describe('paths', () => {
  it('normalizes duplicate slashes', () => {
    expect(normalizePath('//fly//app//')).toBe('/fly/app');
  });

  it('joins prefix and short name', () => {
    expect(joinSecretPath('/fly/my-app/production', 'DATABASE_URL')).toBe(
      '/fly/my-app/production/DATABASE_URL',
    );
  });

  it('picks secret value by path key variants', () => {
    const value = pickSecretFromResponse('/foo/bar', {
      '/foo/bar': 'secret-value',
    });
    expect(value).toBe('secret-value');
  });

  it('slugifies Fly app names', () => {
    expect(slugifySegment('My Cool App')).toBe('my-cool-app');
  });

  it('builds default Fly prefix from app name and environment', () => {
    delete process.env.AKEYLESS_ENV;
    delete process.env.FLY_ENV;
    delete process.env.AKEYLESS_INCLUDE_PROCESS_GROUP_IN_PREFIX;
    process.env.FLY_APP_NAME = 'checkout-api';
    expect(defaultFlySecretPrefix()).toBe('/fly/checkout-api/production');
  });
});
