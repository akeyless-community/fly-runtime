declare module 'akeyless' {
  export class ApiClient {
    basePath: string;
  }

  export class V2Api {
    constructor(client: ApiClient);
    auth(body: unknown): Promise<{ token?: string; expiration?: string }>;
    getSecretValue(body: unknown): Promise<Record<string, unknown>>;
    getDynamicSecretValue(body: unknown): Promise<unknown>;
    getRotatedSecretValue(body: unknown): Promise<unknown>;
  }

  export const Auth: {
    constructFromObject: (obj: Record<string, unknown>) => unknown;
  };
  export const GetSecretValue: {
    constructFromObject: (obj: Record<string, unknown>) => unknown;
  };
  export const GetDynamicSecretValue: {
    constructFromObject: (obj: Record<string, unknown>) => unknown;
  };
  export const GetRotatedSecretValue: {
    constructFromObject: (obj: Record<string, unknown>) => unknown;
  };
}

declare module 'akeyless-cloud-id' {
  export function getCloudId(
    provider: string,
    param: string,
    callback: (err: Error | undefined, res: string | undefined) => void,
  ): void;
}
