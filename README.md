# @akeyless-community/fly-runtime

Fetch [Akeyless](https://www.akeyless.io) secrets at **runtime** on [Fly.io](https://fly.io) Machines (Node.js). Application secrets stay in Akeyless — only bootstrap auth variables are stored on Fly.

**Repository:** [github.com/akeyless-community/fly-runtime](https://github.com/akeyless-community/fly-runtime)

## Install

```bash
npm install @akeyless-community/fly-runtime
```

Requires **Node.js 18+**.

## Quick start

### 1. Set bootstrap secrets on Fly.io

Store read-only Akeyless credentials as Fly secrets (or in `[env]` in `fly.toml` for non-sensitive bootstrap values):

```bash
fly secrets set \
  AKEYLESS_ACCESS_ID=p-xxxxx \
  AKEYLESS_ACCESS_KEY=your-access-key \
  AKEYLESS_SECRET_PREFIX=/fly/my-app/production
```

| Variable | Required | Example |
|----------|----------|---------|
| `AKEYLESS_ACCESS_ID` | Yes* | `p-xxxxx` |
| `AKEYLESS_ACCESS_KEY` | Yes* | access key secret |
| `AKEYLESS_SECRET_PREFIX` | Recommended | `/fly/my-app/production` |
| `AKEYLESS_GATEWAY_URL` | No | `https://api.akeyless.io` |
| `FLY_ENV` or `AKEYLESS_ENV` | No | `staging` (used when prefix is derived) |

\* Or use another [auth method](#authentication) below.

If `AKEYLESS_SECRET_PREFIX` is omitted, the library derives it from Fly metadata:

```
/fly/{FLY_APP_NAME}/{FLY_ENV or AKEYLESS_ENV or production}
```

Fly sets `FLY_APP_NAME`, `FLY_REGION`, and `FLY_PROCESS_GROUP` automatically on every Machine. See the [Fly runtime environment](https://fly.io/docs/machines/runtime-environment/).

### 2. Store application secrets in Akeyless

```
/fly/my-app/production/DATABASE_URL
/fly/my-app/production/STRIPE_SECRET_KEY
```

For multi-process apps, either use a shared app/env prefix or opt into per-process-group prefixes:

```bash
fly secrets set AKEYLESS_INCLUDE_PROCESS_GROUP_IN_PREFIX=true
# → /fly/my-app/production/worker/DATABASE_URL
```

### 3. Fetch secrets in your app

```javascript
const express = require('express');
const { getSecret } = require('@akeyless-community/fly-runtime');

const app = express();

app.get('/health', async (_req, res) => {
  const dbUrl = await getSecret('DATABASE_URL');
  res.json({ ok: true, hasDb: Boolean(dbUrl) });
});

app.listen(process.env.PORT || 3000);
```

Use `getSecret` only in **server** code. Never expose fetched secrets to the browser.

## Per-environment prefixes

| Fly environment | Typical prefix |
|-----------------|----------------|
| production | `/fly/my-app/production` |
| staging | `/fly/my-app/staging` |
| development | `/fly/my-app/development` |

Set `FLY_ENV` or `AKEYLESS_ENV` on each Fly app, or set `AKEYLESS_SECRET_PREFIX` explicitly when you need a custom layout.

Many teams use separate Fly apps per environment (`my-app-staging`, `my-app-prod`) with the default `production` segment — both patterns work.

## API

### Convenience (singleton, replica-friendly)

```javascript
const { getSecret, getDefaultClient } = require('@akeyless-community/fly-runtime');

const dbUrl = await getSecret('DATABASE_URL');
```

### Explicit client

```javascript
const { createClient } = require('@akeyless-community/fly-runtime');

const client = createClient({
  gatewayUrl: 'https://api.akeyless.io',
  secretPrefix: '/fly/my-app/production',
  accessId: process.env.AKEYLESS_ACCESS_ID,
  accessKey: process.env.AKEYLESS_ACCESS_KEY,
});

await client.getSecret('DATABASE_URL');
await client.getSecretAtPath('/custom/full/path');
await client.getDynamicSecret('db-creds');
await client.getRotatedSecret('rotated-api-key');
```

## Authentication

Configure via Fly secrets / `[env]` or `createClient({ ... })`.

| Method | `AKEYLESS_ACCESS_TYPE` | Additional variables |
|--------|------------------------|----------------------|
| Access key (default) | `access_key` | `AKEYLESS_ACCESS_ID`, `AKEYLESS_ACCESS_KEY` |
| API key | `api_key` | `AKEYLESS_ACCESS_ID`, `AKEYLESS_ACCESS_KEY` |
| Universal Identity | `universal_identity` | `AKEYLESS_UID_TOKEN` |
| JWT | `jwt` | `AKEYLESS_ACCESS_ID`, `AKEYLESS_JWT` |
| AWS IAM | `aws_iam` | `AKEYLESS_ACCESS_ID`, optional `AKEYLESS_CLOUD_ID` |
| Pre-authenticated | — | `AKEYLESS_TOKEN` |

Use a dedicated Akeyless auth method with **read-only** access to your `/fly/...` path.

## Local development with Fly CLI

Run your app locally with the same secrets as your Fly app:

```bash
fly secrets list
fly secrets import < .env.local   # optional: sync local env file
fly proxy 3000:3000               # if your app needs Fly-internal services
```

Or export variables manually:

```bash
export AKEYLESS_ACCESS_ID=p-xxxxx
export AKEYLESS_ACCESS_KEY=your-key
export AKEYLESS_SECRET_PREFIX=/fly/my-app/development
export FLY_APP_NAME=my-app
export FLY_ENV=development
```

## Caching

- **Auth tokens** refresh before expiry (default margin: 1 minute).
- **Secret values** cache in memory for **5 minutes** by default (`AKEYLESS_SECRET_CACHE_TTL_MS`).
- Long-lived Fly Machines reuse the module singleton.

Lower TTL or use `ignoreCache: true` for frequently rotated secrets.

## Push sync vs runtime pull

| Pattern | When to use |
|---------|-------------|
| **Runtime pull** (this package) | Akeyless stays source of truth; only bootstrap creds on Fly |
| **Push sync** | Copy secrets into Fly secrets (future Akeyless Destination Sync or CI) |

Runtime pull works today without any Fly marketplace listing.

## Example app

```bash
npm run build
cd examples/express && npm install
npm start
```

Set `AKEYLESS_*` env vars before starting.

## Publishing

This package is Apache-2.0 and published as `@akeyless-community/fly-runtime` on npm.

To publish from a standalone clone:

```bash
npm ci
npm test
npm publish --access public
```

## Related community projects

- [@akeyless-community/vercel-runtime](https://github.com/akeyless-community/vercel-runtime) — Vercel runtime secrets
- [@akeyless-community/netlify-runtime](https://github.com/akeyless-community/netlify-runtime) — Netlify runtime secrets
- [@akeyless-community/heroku-runtime](https://github.com/akeyless-community/heroku-runtime) — Heroku runtime secrets
- [@akeyless-community/railway-runtime](https://github.com/akeyless-community/railway-runtime) — Railway runtime secrets
- [buildkite-akeyless-plugin](https://github.com/akeyless-community/buildkite-akeyless-plugin) — CI secret injection

## License

Apache-2.0
