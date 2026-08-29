# Testing JanGrievance

This document outlines how to run automated tests for the application. We use a combination of **Vitest** for fast unit/component testing and **Playwright** for end-to-end (E2E) testing.

## Prerequisites
To run tests locally, you need a local database. Running tests against the production remote database is **strongly discouraged** as it will pollute production with test data.

1. Install Docker Desktop if you haven't already.
2. Ensure you have the Supabase CLI installed.
3. Start the local Supabase instance:
   ```bash
   npx supabase start
   ```

## Running Unit Tests (Vitest)
Unit tests cover isolated logic such as workflow transitions and utility functions. They are very fast.

```bash
# Run tests once
npx vitest run

# Run in watch mode (recommended during active development)
npx vitest
```

## Running End-to-End Tests (Playwright)
Playwright tests simulate real user journeys in a headless browser.

**Before running E2E tests**, ensure your local Next.js server is running (`npm run dev`) or Playwright will start it automatically (as configured in `playwright.config.ts`).

```bash
# Run all E2E tests headlessly
npx playwright test

# Run tests with the UI mode (highly recommended for debugging)
npx playwright test --ui
```

## Continuous Integration
Tests are automatically run on every push and pull request via GitHub Actions (`.github/workflows/test.yml`). 
The CI environment automatically spins up a local Supabase instance, applies migrations, builds the Next.js app, and executes both Vitest and Playwright suites.

## Known Limitations
- The E2E tests currently focus strictly on the critical path (Auth, Citizen Grievance Submission, Officer Assignments). 
- Load testing and performance testing are not currently covered in this suite.
- Security and RLS verification is managed via the initial Phase 15 review, though critical data boundaries (e.g. citizens only seeing their own grievances) are verified in E2E.
