# Password Strength Analyzer

Privacy-focused defensive tool for evaluating password strength, explaining predictable patterns, generating secure demo passwords, and teaching safer authentication practices.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/password-analyzer run typecheck` — check the web app
- `pnpm --filter @workspace/api-server run typecheck` — check the API

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for analysis, generator, dashboard, and health endpoints.
- `artifacts/api-server/src/lib/password-analyzer.ts` — transient analysis engine and secure generator.
- `artifacts/api-server/src/routes/security.ts` — API routes and in-memory aggregate metadata.
- `artifacts/password-analyzer/src/App.tsx` — analyzer, dashboard, and learning center UI.
- `artifacts/password-analyzer/src/index.css` — shared visual language and responsive styling.

## Architecture decisions

- Passwords are analyzed in memory and never returned, logged, placed in URLs, or persisted.
- Analytics retains only score, length, classification, and weakness categories for the current service lifetime.
- The entropy value is educational and is shown alongside pattern detection rather than used as a standalone verdict.
- Password generation uses Node's cryptographic random source and never stores generated values.
- Policy compliance is presented separately from the project-defined strength score.

## Product

- Live analyzer with hidden/revealed input, contextual checks, pattern findings, suggestions, entropy-style estimate, and policy evaluation.
- Secure demo generator with configurable length and character sets.
- Aggregate-only dashboard with score movement, classification mix, and weakness frequency.
- Learning center covering length, predictability, password managers, hashing, MFA, and defensive login security.

## User preferences

The project brief prioritizes beginner-friendly explanations, defensive security, synthetic demonstration inputs, and GitHub/LinkedIn-ready proof of work.

## Gotchas

- Demo analytics reset when the API service restarts; this keeps the first version storage-free and privacy-preserving.
- Run API codegen after changing `lib/api-spec/openapi.yaml` before using generated hooks or Zod schemas.
- Do not add database columns or logs containing submitted or generated passwords.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
