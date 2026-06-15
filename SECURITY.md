# Security

## Reporting vulnerabilities

If you discover a security issue in this package, please report it responsibly:

1. **Do not** open a public GitHub issue for exploitable vulnerabilities.
2. Email the maintainers via the contact on the [GitHub repository](https://github.com/akeyless-community/fly-runtime).
3. For issues in Akeyless itself, use [Akeyless security reporting](https://www.akeyless.io/trust-center/).

## Usage guidance

- Use a dedicated Akeyless auth method with **read-only** access to the paths your app needs.
- Prefer **AWS IAM** auth on Fly when your Machine has ambient cloud credentials.
- Never log secret values. This library returns secrets to your application — handle them carefully.
- Use `getSecret` only on server-side Machines; never expose secrets to client bundles.
- Treat bootstrap credentials (`AKEYLESS_ACCESS_KEY`) as sensitive Fly secrets.

## Scope

This repository is a community integration library. It is not covered by Akeyless's product security program.
