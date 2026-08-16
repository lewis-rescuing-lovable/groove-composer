# Groove Composer

A web-based music composition tool with a step sequencer, timeline arranger, and real-time spectrum analyzer.

![Groove Composer](docs/user-guide/hero.png)

> 📖 New here? Read the **[User Guide](docs/user-guide/README.md)** for a tour of every panel and how to make your first groove.

## 🚀 Live Site

Deployed automatically to GitHub Pages on every push to `main`:

**https://lewis-rescuing-lovable.github.io/groove-composer/**

## ✨ Features

- Interactive step sequencer for building patterns
- Timeline-based arrangement
- Real-time spectrum analyzer
- Instrument sidebar
- Audio engine powered by the Web Audio API
- **Inline pattern renaming** — rename patterns directly in the sidebar or sequencer
- **Project persistence** — autosaves to browser storage; save / load / reset controls in the top bar

## 🛠️ Tech Stack

- [Vite](https://vitejs.dev/) — build tool & dev server
- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [shadcn/ui](https://ui.shadcn.com/) + [Tailwind CSS](https://tailwindcss.com/)
- [Vitest](https://vitest.dev/) + Testing Library — unit testing
- [Playwright](https://playwright.dev/) — end-to-end testing
- [npm](https://www.npmjs.com/) — package manager

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) ≥ 18 (npm comes bundled)

## 🏗️ Getting Started

```sh
# 1. Clone the repository
git clone git@github.com:lewis-rescuing-lovable/groove-composer.git
cd groove-composer

# 2. Install dependencies
npm install

# 3. Start the development server with auto-reloading
npm run dev
```

Open http://localhost:8080 to view the app in your browser.

## 📜 Available Scripts

| Command                     | Description                                       |
| --------------------------- | ------------------------------------------------- |
| `npm run dev`               | Start the development server                      |
| `npm run build`             | Create a production build in `dist/`              |
| `npm run preview`           | Preview the production build locally              |
| `npm run lint`              | Run ESLint                                        |
| `npm run typecheck`         | Run TypeScript type checking                      || `npm run knip`              | Find dead code (unused files, exports, deps)      || `npm run test`              | Run unit tests once (Vitest)                      |
| `npm run test:watch`        | Run unit tests in watch mode                      |
| `npm run test:coverage`     | Run unit tests with coverage report               |
| `npm run test:e2e`          | Run Playwright E2E tests (dev server auto-starts) |
| `npm run test:e2e:ui`       | Run Playwright with the interactive UI            |
| `npm run test:e2e:debug`    | Run Playwright step-by-step in the inspector      |
| `npm run test:e2e:headed`   | Run Playwright headed (visible browser)           |
| `npm run test:e2e:build`    | Build, then run E2E against the production build  |
| `npm run test:e2e:build:debug` | Build, then debug E2E against production build |

## 🔒 Pre-commit hooks

The project uses [pre-commit](https://pre-commit.com/) to run the full quality
suite (lint, typecheck, unit tests, build, E2E, knip, coverage) before every
commit. It is a Python tool installed **outside** the project — it is **not** an
npm dependency.

### Install (one-time, per machine)

```sh
uv tool install pre-commit   # installs the `pre-commit` command
pre-commit install           # wires it into this repo's git hooks
```

> Requires [uv](https://docs.astral.sh/uv/). If you don't use uv, `brew install
> pre-commit` or `pipx install pre-commit` work too.

### Usage

- Hooks run automatically on `git commit`. If any check fails, the commit is
  blocked until you fix the issue and re-stage.
- Run the hooks manually without committing:

  ```sh
  pre-commit run --all-files
  ```

- Skip the hooks for a single commit (e.g. a WIP commit):

  ```sh
  git commit --no-verify
  # or: SKIP=lint,typecheck,test,build,test:e2e,test:e2e:build,knip,test:coverage git commit
  ```

The hook definitions live in [`.pre-commit-config.yaml`](.pre-commit-config.yaml).

## 🧪 Testing

### Unit tests (Vitest + Testing Library)

```sh
npm run test            # once
npm run test:watch      # watch mode
npm run test:coverage   # with coverage report (thresholds enforced)
```

Coverage thresholds are enforced in `vitest.config.ts` (lines/functions/statements
≥ 70%, branches ≥ 70%). The coverage report is written to `coverage/`.

### End-to-end tests (Playwright)

```sh
npm run test:e2e        # full suite against the dev server
```

The E2E suite lives in [`e2e/`](e2e/) and covers:

- **`e2e/daw.spec.ts`** — functional flows: loading the DAW, adding tracks &
  patterns (making music), renaming tracks, toggling mute/solo, switching panels,
  editing BPM, transport (play/stop), duplicating clips, renaming patterns, and
  saving / reloading / resetting a project.
- **`e2e/performance.spec.ts`** — performance & memory monitoring: FPS,
  long-task count, and JS heap usage during idle, playback, and heavy pattern
  toggling. Thresholds are tuned for a real-time DAW (smooth ~60fps, minimal
  long tasks, no heap growth) and metrics are logged inline.
- **`e2e/build.spec.ts`** — smoke tests against the production build.

First-time setup (downloads the Chromium browser):

```sh
npx playwright install chromium
```

### Debugging / ejecting the Playwright build

Playwright ships an inspector + UI for stepping through and debugging tests:

```sh
npm run test:e2e:debug    # step through tests in the inspector
npm run test:e2e:ui       # interactive UI runner
```

To "eject" and debug issues against the **production bundle** (not the dev
server), the dedicated build config `playwright.build.config.ts` serves the
built app via `vite preview`:

```sh
npm run test:e2e:build         # run build smoke tests
npm run test:e2e:build:debug   # debug them headed with the inspector
```

On failure, Playwright writes a trace, screenshot, and error context under
`test-results/`. Open a trace with:

```sh
npx playwright show-trace test-results/<test-dir>/trace.zip
```

## 🔀 Git Workflow

This repository follows a simple GitHub Flow:

1. Create a feature branch from `main`.
2. Make your changes, commit, and push.
3. Open a Pull Request (a template is provided).
4. CI (lint, typecheck, tests, coverage, E2E, build) runs automatically on every PR.
5. Merge to `main` — the app is deployed to GitHub Pages automatically.

## ✅ Quality Checks

CI (`.github/workflows/ci.yml`) runs the following on every push and pull request:

- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript type checking
- `npm run test` — Vitest unit tests
- `npm run knip` — dead-code detection
- `npm run test:coverage` — unit tests with coverage; a coverage report is posted
  as a PR comment for reviewers
- `npm run test:e2e` — Playwright E2E against the dev server
- `npm run test:e2e:build` — Playwright E2E against the production build
- `npm run build` — production build

You can run these locally before pushing to keep CI green.

## 🌐 Deploying to GitHub Pages

Deployment is fully automated via GitHub Actions (`.github/workflows/deploy-pages.yml`). Every push to `main` builds the app and publishes it to GitHub Pages.

### One-time setup (required before the first deploy)

1. Go to **Settings → Pages** for the repository.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**.
3. Your site will then be available at:
   `https://<username>.github.io/groove-composer/`

### Adding a custom domain (optional)

1. In **Settings → Pages**, enter your domain under **Custom domain**.
2. Configure the DNS record at your domain provider.
3. After enabling a custom domain, add a `CNAME` file containing your domain at `public/CNAME` so it persists across deployments.

## 📁 Project Structure

```
groove-composer/
├── .github/
│   ├── workflows/          # CI & GitHub Pages deployment
│   ├── ISSUE_TEMPLATE/     # Bug report & feature request templates
│   └── pull_request_template.md
├── public/                 # Static assets
├── src/
│   ├── components/
│   │   ├── daw/            # DAW UI (sequencer, timeline, analyzer, etc.)
│   │   └── ui/             # shadcn/ui components
│   ├── hooks/              # Custom React hooks
│   ├── lib/                # Audio engine & utilities
│   ├── pages/              # Route pages
│   ├── stores/             # State management (Zustand store)
│   └── test/               # Test setup
├── index.html
├── vite.config.ts          # Vite config (base set for GitHub Pages)
├── vitest.config.ts        # Vitest config
└── package.json
```

## 🐛 Reporting Issues

- **Bugs** — use the [Bug Report](https://github.com/lewis-rescuing-lovable/groove-composer/issues/new?assignees=&labels=bug%2Ctriage&template=bug_report.yml) template.
- **Feature requests** — use the [Feature Request](https://github.com/lewis-rescuing-lovable/groove-composer/issues/new?assignees=&labels=enhancement&template=feature_request.yml) template.

Both templates are available under **Issues → New issue**.
