# Session Prompts & Engineering Log

This document records the exact sequence of user requests, development phases, and engineering decisions executed during the construction of the Newsroom Performance Optimization interface.

---

## 1. Initial Specification Prompt

```text
You are a senior React engineer. Build a complete project: "Performance Optimization" interface for a news blog's floor staff, who currently use paper and Excel. Stack: React 18 + Vite + Vitest + React Testing Library + ESLint. Follow this workflow STRICTLY, in order:

PHASE 1 - TESTS FIRST (do NOT write implementation yet)
Write src/PerformanceOptimization.test.jsx covering:
1. Happy path: shows a loading indicator, then the list of entries and the average score; a valid form submit adds an entry.
2. Empty state: empty list or empty search result shows "No data found" (never a blank screen).
3. Bad connectivity: loading indicator (role="status") during every async call; if loading fails show an alert with a Retry button; if saving fails keep the typed form values and show an error alert.
4. Invalid input: missing or malformed data (name < 2 chars, empty metric, score not 0-100) blocks submit, highlights fields in red with aria-invalid and an error message linked via aria-describedby.
5. Telemetry: after a successful primary action, console.log("[Analytics] User interacted with Performance Optimization").
6. Security: all text inputs are sanitized against XSS (strip tags, <, >, backticks, javascript:) BEFORE going into state; test <script> and <img onerror> payloads.
The API (list, save) must be injected via an `api` prop so tests can mock it. Run the tests and show they FAIL.

PHASE 2 - IMPLEMENTATION
Create src/PerformanceOptimization.jsx, src/sanitize.js, src/PerformanceOptimization.css, src/main.jsx, index.html so ALL tests pass.
- Fields: staff name, metric, score (0-100), notes (optional). Search box filters the list. Show average score of visible entries.
- Wrap computations (filtering, average) in useMemo; stabilize all handlers/functions with useCallback.
- Include a simulated default API with a short delay (no real keys, no PII).
- Accessibility: 100% Lighthouse score. Every input has a <label>, interactive elements have ARIA labels, fully keyboard navigable, visible focus outline, role="status"/"alert" for live messages, semantic <main>/<h1>, sufficient contrast.
- Design: clean monochromatic corporate look using only CSS variables (grays + black/white). The ONLY non-gray color is one red variable for error states. Spacing only in 16px/32px steps. No random hex colors.

PHASE 3 - QUALITY
- Run the tests until all pass. If something breaks, fix it by reverting and trying a different approach.
- Configure eslint.config.js and make `npm run lint` pass with zero warnings and no unused imports.
- Make sure `npm run dev`, `npm test` and `npm run build` all work.

PHASE 4 - DOCS
Create PROMPTS.md in the repo root documenting the exact sequence of prompts used in this session, and a README.md with setup/run instructions.

At the end, give a short summary: files created, test results, lint results, and anything I should verify manually (Slow 3G throttling, Lighthouse).
```

---

## 2. Engineering Execution Log

### Phase 1: Tests First
1. Initialized project directory: `C:\Users\Lenovo\.gemini\antigravity\scratch\news-performance-optimization`
2. Configured tooling dependencies in `package.json` (`react`, `react-dom`, `vite`, `vitest`, `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`, `jsdom`, `eslint`).
3. Set up Vitest in `vite.config.js` and `src/setupTests.js`.
4. Authored comprehensive test suite in `src/PerformanceOptimization.test.jsx` covering all 6 functional categories without writing component implementation files.
5. Executed `npm test` and verified the expected initial failure (exit code 1, missing module `./PerformanceOptimization`).

### Phase 2: Implementation
1. Authored `src/sanitize.js` to strip HTML tags, angle brackets (`<`, `>`), backticks (`` ` ``), and `javascript:` pseudo-protocols before state mutation.
2. Implemented `src/PerformanceOptimization.jsx`:
   - Memoized computations (`filteredEntries`, `averageScore`) with `useMemo`.
   - Stabilized handlers (`fetchEntries`, `handleInputChange`, `handleSearchChange`, `handleRetry`, `handleSubmit`) with `useCallback`.
   - Connected form inputs with programmatic labels, `aria-invalid`, `aria-describedby`, and focus routing on validation failure.
   - Preserved typed form values upon API failure.
   - Emitted `[Analytics] User interacted with Performance Optimization` on successful additions.
3. Designed monochromatic corporate stylesheet `src/PerformanceOptimization.css`:
   - Monochromatic palette with grays, black, and white.
   - Exactly one non-gray color: `--color-error-red`.
   - Strictly 16px/32px spacing scales (`--space-16`, `--space-32`, `--space-48`, `--space-64`).
   - High-contrast visible focus outline (`:focus-visible`).
4. Authored `src/main.jsx` and semantic, accessible `index.html`.

### Phase 3: Quality & Verification
1. Resolved query collisions in tests (avoided redundant `aria-label`s on elements that already possess visible semantic text).
2. Ran Vitest: 15/15 tests passed across all test groups.
3. Configured `eslint.config.js` with Flat Config: `npm run lint` passed with 0 warnings, 0 errors, and no unused imports.
4. Ran `npm run build`: successfully bundled production assets without errors.
5. Verified `npm run dev`: local dev server served HTTP 200 cleanly.

### Phase 4: Documentation
1. Authored `README.md` with complete setup instructions, architecture breakdown, and manual testing guides.
2. Authored `PROMPTS.md` documenting prompt sequences and engineering decisions.
