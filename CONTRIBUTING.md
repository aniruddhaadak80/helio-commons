# Contributing to Helio Commons

Thanks for helping make the research desk more useful and inspectable.

## Local setup

```bash
npm install
npm run dev
```

The app runs without environment variables locally. To exercise Neon-backed persistence, set `DATABASE_URL` to a PostgreSQL connection string and apply [`db/schema.sql`](db/schema.sql) through your preferred migration workflow.

## Before opening a pull request

- Run `npm run lint` and `npm run build`.
- Keep the deterministic engine explainable and update the factor descriptions when its behavior changes.
- Add or update a route/API example for any new user action.
- Do not add mock data that is presented as live. Use the dated fallback layer and label its source.
- Keep external feeds optional at build time and preserve the offline first paint.
- Do not commit secrets, `.env*` files, or database credentials.

## Design principles

1. Evidence before spectacle.
2. Every mutation leaves a replayable trail.
3. The browser, REST API, and agent surface share the same domain functions.
4. A fallback is a product state, not an error to hide.

## Reporting security issues

Please follow [SECURITY.md](SECURITY.md) instead of opening a public issue for a suspected vulnerability.
