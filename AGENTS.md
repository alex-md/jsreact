# Repository Guidelines

## Project Structure & Module Organization
- `src/`: Vite multi-page app sources. Each tool lives in its own folder (e.g., `src/minify/`, `src/clean/`) with an `index.html` and page JS/TS.
- `src/components/`: shared UI helpers (navbar, footer, headers, page shell).
- `src/utils/`: shared utilities (e.g., `toolData.js`).
- `public/`: static assets served as-is. Global styles live in `public/assets/styles/global.css` and page-specific additions in `public/assets/styles/pages.css`. Tool metadata is in `public/data/tools.json`.
- `dist/`: build output (generated).

## Build, Test, and Development Commands
- `npm run dev`: start the Vite dev server.
- `npm run build`: production build into `dist/`.
- `npm run preview`: serve the production build locally.
- `npm run generate-sitemap`: generate sitemap data.

## Coding Style & Naming Conventions
- JavaScript/TypeScript uses ES modules (`import`/`export`).
- Indentation: 4 spaces in JS/HTML/CSS to match existing files.
- Prefer `src/components/` for shared UI and `src/utils/` for shared logic.
- New tools: add a folder under `src/<tool>/` and register in `public/data/tools.json` (include `category`, `icon`, `color`, `link`).

## Testing Guidelines
- No automated test framework is configured. Validate changes by running `npm run dev` and spot-checking affected pages. If you add tests, document how to run them here.

## Commit & Pull Request Guidelines
- Commit messages are short, imperative summaries (e.g., “Update index.js”, “Revamp theme and styles…”). Follow that style.
- PRs should include a concise summary, list of impacted pages, and screenshots for UI changes.

## Security & Configuration Tips
- Don’t commit API keys or secrets. The speech tool expects an API key at runtime; keep local-only configuration out of the repo.
