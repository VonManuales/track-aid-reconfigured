# Security Policy

## Reporting a vulnerability

If you discover a security issue, please report it privately to your project maintainer or course instructor. Do not open a public issue for sensitive findings.

## Secrets and configuration

- Never commit `.env`, `.env.local`, or files containing API keys.
- Use `.env.example` as a template only (no real values).
- Rotate any key that was accidentally committed and remove it from git history before pushing again.

## Dependencies

Keep dependencies updated with `npm audit` and apply patches for high-severity issues when possible.
