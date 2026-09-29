# Password Strength Analyzer & Security Suggestion Tool

> A privacy-focused defensive cybersecurity tool for evaluating password strength, detecting predictable patterns, and teaching safer authentication practices — without storing or transmitting passwords.

## Overview

Weak and reused passwords remain a major contributor to account compromise. This project demonstrates how an application can provide useful, immediate password guidance while applying a privacy-first design:

- Passwords are processed transiently in memory.
- Passwords are never stored, logged, returned by the API, or placed in URLs.
- Analytics contain only aggregate metadata such as score, length, classification, and weakness categories.
- Demonstrations use synthetic passwords only.
- The tool does not crack passwords, test credentials against accounts, or contact breach services by default.

This is an educational defensive-security project. Its score is a project-defined signal, not a universal security standard.

## Why This Project Matters

Password composition rules alone are not enough. A password such as `Password123!` includes uppercase letters, lowercase letters, numbers, and a symbol, but it is still predictable because it combines a common word with a short numeric suffix.

The analyzer weighs:

**Length + unpredictability + pattern resistance + common-password checks + context**

It also explains the limitations of entropy-style estimates, which assume random character selection and can overestimate the strength of human-created passwords.

## Features

### Password analysis

- Score from 0–100
- Classification: Very Weak, Weak, Moderate, Strong, or Very Strong
- Length band and character pool analysis
- Character diversity and unique-character ratio
- Educational entropy-style estimate
- Common-password detection
- Dictionary/common-word detection
- Repeated-character and repeated-substring detection
- Ascending and descending sequence detection
- Keyboard-walk detection
- Predictable word-plus-number/year detection
- Optional personal-context overlap check
- Specific, actionable security suggestions

### Secure demo generator

- 16, 20, or 24 character options
- Uppercase, lowercase, numbers, and symbols
- Cryptographically secure randomness using Node.js `crypto.randomInt`
- Generated values are not stored
- Clear “demo only” handling in the user interface

### Policy checker

Configurable policy checks are shown separately from the strength score:

- Minimum length
- Common-password rejection
- Personal-information check
- Space handling

This distinction matters because a password can pass a policy while still being predictable, or fail a policy while having other useful properties.

### Privacy-safe dashboard

The dashboard displays only:

- Total analyses
- Average score
- Average length
- Classification distribution
- Recent score movement
- Weakness-category frequency

No passwords, generated values, or personal context appear in analytics.

### Security learning center

The `/learn` page covers:

- Length and unpredictability
- Passwords versus passphrases
- Password managers
- Password hashing and salting
- MFA
- Rate limiting and abuse protection
- Phishing awareness
- Passwordless authentication concepts

## Architecture

```text
User
  |
  v
Secure Web Interface
  |
  v
POST /api/analyze
  |
  v
Transient In-Memory Analysis
  |
  +--> Length Analyzer
  +--> Character Analyzer
  +--> Common Password Checker
  +--> Dictionary Checker
  +--> Sequence Detector
  +--> Keyboard Pattern Detector
  +--> Repetition Detector
  +--> Context Checker
  +--> Entropy-Style Estimator
  |
  v
Strength + Policy Evaluation
  |
  v
Findings and Security Suggestions
```

The dashboard receives aggregate metadata only. There is intentionally no password column and no password hash analytics table.

## Technology Stack

- React
- Vite
- TypeScript
- Express 5
- Zod
- OpenAPI 3.1
- Orval-generated React Query hooks
- Tailwind CSS
- Recharts
- pnpm workspace monorepo

## Project Structure

```text
.
├── artifacts/
│   ├── api-server/
│   │   └── src/
│   │       ├── lib/password-analyzer.ts
│   │       └── routes/security.ts
│   └── password-analyzer/
│       └── src/App.tsx
├── lib/
│   ├── api-spec/openapi.yaml
│   ├── api-client-react/
│   └── api-zod/
├── screenshots/
├── README.md
├── replit.md
└── package.json
```

## Local Development

### Prerequisites

- Node.js 20+
- pnpm 9+

### Install

```bash
pnpm install
```

### Start the API server

```bash
pnpm --filter @workspace/api-server run dev
```

### Start the web app

```bash
pnpm --filter @workspace/password-analyzer run dev
```

The Replit workflows provide the required `PORT` and `BASE_PATH` values for the web preview.

### Validate the project

```bash
pnpm run typecheck
```

After changing the API contract, regenerate the typed client and Zod schemas:

```bash
pnpm --filter @workspace/api-spec run codegen
```

## API Endpoints

### `POST /api/analyze`

Analyzes a password transiently.

```json
{
  "password": "synthetic-demo-value",
  "personalContext": {
    "firstName": "Sam",
    "birthYear": "2002",
    "organization": "Northstar Labs"
  },
  "policy": {
    "minimumLength": 12,
    "rejectCommonPasswords": true,
    "checkPersonalInfo": true,
    "allowSpaces": true
  }
}
```

The response contains score, classification, findings, suggestions, and safe metrics. It never contains the submitted password.

### `POST /api/generate-password`

Generates a secure demo password from selected character sets.

```json
{
  "length": 20,
  "uppercase": true,
  "lowercase": true,
  "numbers": true,
  "symbols": true
}
```

### `GET /api/dashboard/stats`

Returns aggregate counts, averages, and recent scores.

### `GET /api/analytics/weaknesses`

Returns grouped weakness categories without password values or personal context.

### `GET /api/healthz`

Returns API service health.

## Safe Demonstration Cases

Use synthetic values only when taking screenshots or demonstrating the project:

| Example | Expected signal | Why |
| --- | --- | --- |
| `123456` | Very Weak | Common, short, numeric, sequential |
| `Password123!` | Weak or Moderate | Common word plus predictable number and symbol |
| `aaaaaaaaaaaaaaaa` | Weak | Long but highly repetitive |
| `qwerty2026!` | Weak | Keyboard pattern and predictable year |
| Runtime-generated 20-character value | Strong or Very Strong | Longer and less predictable |

Do not reuse demonstration values for real accounts.

## Security and Privacy Model

This project deliberately avoids several risky features:

- No password persistence
- No password logging
- No password hashing for analytics
- No password values in query parameters or URL paths
- No external breach lookup by default
- No credential testing
- No brute-force or password-cracking functionality

In a production authentication system, passwords should be verified using an appropriate password-hashing function such as Argon2id, bcrypt, scrypt, or PBKDF2 with a unique salt and an appropriate work factor. This analyzer is not a password-storage system.

## Limitations

- The scoring model is educational and project-defined.
- Entropy is theoretical and assumes random character selection.
- The common-password and dictionary lists are intentionally small educational lists.
- Analytics reset when the API service restarts.
- Pattern detection cannot identify every human or attacker strategy.
- A strong password cannot replace MFA, secure sessions, rate limiting, monitoring, or phishing protection.

## Future Improvements

- Replace the educational list with a properly licensed local corpus.
- Add configurable enterprise policies.
- Add privacy-preserving breach-corpus checks using k-anonymity or an approved local service.
- Add persistent aggregate analytics without storing password-derived identifiers.
- Add accessibility and localization improvements.
- Add password-manager and passkey education modules.
- Add automated security regression tests and CI checks.

## Learning Outcomes

This project demonstrates practical experience with:

- Cybersecurity fundamentals
- Application security
- Secure input handling
- Privacy-by-design
- IAM and authentication concepts
- Pattern detection
- API contract design
- React and TypeScript
- Express and Zod validation
- Secure random generation
- Security awareness communication

## GitHub Repository Description

Use this description when creating the repository:

> Privacy-focused cybersecurity tool for evaluating password strength using length, unpredictability, common-password checks, pattern analysis, entropy concepts, and personalized security recommendations.

Suggested topics:

```text
cybersecurity
password-security
password-strength
application-security
secure-coding
iam
authentication
defensive-security
typescript
react
express
```

## Resume Bullet Points

- Built a privacy-focused password strength analyzer with transient in-memory processing, pattern detection, policy evaluation, and actionable security recommendations.
- Designed a typed OpenAPI and Zod validation layer for password analysis, secure password generation, health checks, and privacy-safe aggregate analytics.
- Implemented defensive security controls including cryptographic random generation, common-password detection, keyboard and sequence analysis, and explicit no-storage guarantees.

## Security Disclaimer

This project is for defensive cybersecurity education and software engineering demonstration. Do not enter production credentials or sensitive personal information. Never use it to test credentials against accounts or to perform password cracking.

## License

This project is intended for educational and portfolio use. Add the license that matches your intended distribution before publishing publicly.