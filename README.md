# Groove Composer

A web-based music composition tool built with React, TypeScript, Vite, and shadcn/ui.

## 🚀 Live Site

Deployed automatically to GitHub Pages on every push to `main`:

**https://lewis-rescuing-lovable.github.io/groove-composer/**

## ✨ Features

- Interactive step sequencer for building patterns
- Timeline-based arrangement
- Real-time spectrum analyzer
- Instrument sidebar
- Audio engine powered by the Web Audio API

## 🛠️ Tech Stack

- [Vite](https://vitejs.dev/) — build tool & dev server
- [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [shadcn/ui](https://ui.shadcn.com/) + [Tailwind CSS](https://tailwindcss.com/)
- [Vitest](https://vitest.dev/) + Testing Library — unit testing
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

| Command              | Description                                |
| -------------------- | ------------------------------------------ |
| `npm run dev`        | Start the development server               |
| `npm run build`      | Create a production build in `dist/`       |
| `npm run preview`    | Preview the production build locally       |
| `npm run lint`       | Run ESLint                                 |
| `npm run typecheck`  | Run TypeScript type checking               |
| `npm run test`       | Run tests once (Vitest)                    |
| `npm run test:watch` | Run tests in watch mode                    |

## 🔀 Git Workflow

This repository follows a simple GitHub Flow:

1. Create a feature branch from `main`.
2. Make your changes, commit, and push.
3. Open a Pull Request (a template is provided).
4. CI (lint, typecheck, tests, build) runs automatically on every PR.
5. Merge to `main` — the app is deployed to GitHub Pages automatically.

## ✅ Quality Checks

CI runs the following on every push and pull request:

- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript type checking
- `npm run test` — Vitest unit tests
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
