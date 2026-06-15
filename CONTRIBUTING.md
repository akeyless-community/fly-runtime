# Contributing

Thanks for contributing to `@akeyless-community/fly-runtime`.

## Development setup

Requires Node.js 22 (see `.nvmrc`).

```bash
git clone https://github.com/akeyless-community/fly-runtime.git
cd fly-runtime
npm install
npm run build
npm test
```

## Example app

```bash
npm run build
cd examples/express
npm install
export AKEYLESS_ACCESS_ID=...
export AKEYLESS_ACCESS_KEY=...
export AKEYLESS_SECRET_PREFIX=/fly/demo/development
export FLY_APP_NAME=demo
export FLY_ENV=development
npm start
```

## Pull requests

1. Fork and create a feature branch from `main`.
2. Add or update tests for behavior changes.
3. Run `npm run build && npm test` before opening the PR.
4. Keep changes focused — this package should stay small and dependency-light.

## Publishing (maintainers)

```bash
npm run build
npm test
npm publish --access public
```

Tag releases as `vX.Y.Z` on GitHub after publish.

## Code of conduct

Be respectful and constructive. This is a community project, not an official Akeyless product.
