# Security Policy

## Supported versions

The `main` branch receives security fixes for the current public release.

## Reporting a vulnerability

Please do not open a public issue for a suspected vulnerability. Use GitHub’s private security advisory form for this repository and include:

- affected route or component;
- reproduction steps;
- impact and expected behavior;
- whether any credentials or hosted data are involved.

## Scope notes

Helio Commons is a public research board with no account system. The app does not request secrets, and production persistence is expected to use a server-side `DATABASE_URL`. Do not place credentials in client components, public JSON, README examples, or issue attachments.

The SHA-384 audit chain is an integrity receipt for this application’s mutation history. It is not a cryptographic identity system, a digital signature, or a substitute for authenticated authorization.
