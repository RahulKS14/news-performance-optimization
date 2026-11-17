# Newsroom Performance Optimization Interface

A resilient, accessible, and high-performance React application built for newsroom floor staff transitioning from paper logs and Excel spreadsheets to real-time digital monitoring.

Floor staff can track Core Web Vitals, editorial publishing velocity, headline CTR, and article read-through rates with instant computation, robust offline/flaky connection handling, and strict input sanitization.
**live link**  https://news-performance-optimization.vercel.app/

---

## 🛠️ Stack & Architecture

- **Framework**: React 18 (`react`, `react-dom`)
- **Build Tool**: Vite 5
- **Test Runner & Environment**: Vitest + JSDOM
- **Component Testing**: React Testing Library (`@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`)
- **Linting & Code Quality**: ESLint 9 (Flat Config) + React & React Hooks plugins
- **Design System**: Monochromatic corporate system using CSS Custom Properties with strict 16px / 32px spacing scales and zero random hex colors.

---

## 📋 Features

1. **Happy Path Data Ingestion & Live Analytics**:
   - Asynchronously loads performance records with visible loading indicators (`role="status"`).
   - Computes real-time average score across visible/filtered entries wrapped in `useMemo`.
   - Submitting a valid record persists the entry via the injected `api.save`, immediately updates the live average score, and resets the form.
2. **Resilient Empty State**:
   - Zero-data and zero-search states explicitly render `"No data found"` with guidance messaging—never presenting a blank screen or broken layout.
3. **Flaky Network & Connectivity Fault-Tolerance**:
   - Async calls trigger an active `role="status"` banner for assistive technology.
   - If initial data fetching fails, an accessible error alert (`role="alert"`) displays an inline **Retry** button that re-invokes the API.
   - If a record save fails, an error alert is shown and **all user-typed input values are preserved** in the form to prevent data loss.
4. **Accessible Validation & Focus Routing**:
   - Enforces field rules (staff name $\ge$ 2 characters, metric required, score bounded between 0 and 100).
   - Failed validation marks invalid controls with `aria-invalid="true"`, links inline error text via `aria-describedby`, highlights borders with `--color-error-red`, and programmatically routes keyboard focus to the first invalid field.
5. **Operational Telemetry**:
   - Logs `[Analytics] User interacted with Performance Optimization` upon each successful primary action (entry submission).
   - Suppresses analytics emission on validation failures or API errors.
6. **Pre-State XSS Sanitization**:
   - Sanitizes text inputs *before* writing to component state (`strip tags`, `<`, `>`, backticks `` ` ``, and `javascript:` pseudo-protocols).
   - Protects against malicious `<script>` and `<img onerror=...>` payloads.

---

## 🚀 Getting Started

### Prerequisites

- Node.js `v18+` or `v20+` (tested on Node `v24`)
- npm `v9+` or `v11+`

### Installation

```bash
# Navigate to the project root
cd C:\Users\Lenovo\.gemini\antigravity\scratch\news-performance-optimization

# Install dependencies
npm install
```

### Available Scripts

- **Start Dev Server**:
  ```bash
  npm run dev
  ```
  Launches Vite development server with Hot Module Replacement (HMR).

- **Execute Test Suite**:
  ```bash
  npm test
  ```
  Executes the 15-test Vitest suite covering happy paths, empty states, connectivity drops, validation rules, telemetry, and security sanitization.

- **Run Linter**:
  ```bash
  npm run lint
  ```
  Runs ESLint across all source and test files, enforcing zero warnings and zero unused imports.

- **Production Build**:
  ```bash
  npm run build
  ```
  Compiles and minifies assets to the `dist/` directory.

---

## 🧪 Manual Verification Guidelines

### 1. Slow 3G Network Throttling
1. Run `npm run dev` and open the local URL in Google Chrome.
2. Open Chrome DevTools (`F12` or `Ctrl+Shift+I`) and navigate to the **Network** tab.
3. In the throttling dropdown, select **Slow 3G**.
4. Refresh the page: observe the `role="status"` indicator `"Loading performance data..."` cleanly persisting while the mock API resolves.
5. To test failure recovery: select **Offline** in DevTools, click **Retry** or attempt saving an entry to observe the `role="alert"` container and verify typed form values are safely retained.

### 2. Lighthouse 100% Accessibility Audit
1. Open Chrome DevTools and switch to the **Lighthouse** tab.
2. Select **Desktop** mode and check **Accessibility**.
3. Click **Analyze page load**.
4. Confirm:
   - 100% score for Accessibility.
   - All interactive controls have accessible names and visible focus indicators.
   - Contrast ratio exceeds WCAG AA requirements ($\ge 4.5:1$ for normal text, $\ge 3:1$ for large text).
