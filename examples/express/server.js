const express = require('express');
const { getSecret } = require('@akeyless-community/fly-runtime');

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (_req, res) => {
  res.type('text/plain').send(
    'Akeyless Fly.io runtime example\n\nGET /secret?name=DATABASE_URL\nGET /health\n',
  );
});

app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    app: process.env.FLY_APP_NAME ?? 'local',
    environment: process.env.AKEYLESS_ENV ?? process.env.FLY_ENV ?? 'development',
    processGroup: process.env.FLY_PROCESS_GROUP ?? null,
    region: process.env.FLY_REGION ?? 'local',
    prefix: process.env.AKEYLESS_SECRET_PREFIX ?? '(derived from FLY_*)',
  });
});

app.get('/secret', async (req, res) => {
  const name = String(req.query.name ?? 'DATABASE_URL');
  try {
    const value = await getSecret(name);
    res.json({ name, fetched: true, length: value.length });
  } catch (error) {
    res.status(500).json({
      name,
      error: error instanceof Error ? error.message : String(error),
    });
  }
});

app.listen(port, () => {
  console.log(`Example listening on http://localhost:${port}`);
});
