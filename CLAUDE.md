# Solen.ch Claude Code Configuration

## Architecture: Micro-Frontend (Vanilla + React/Vite)
Solen is currently being migrated from a **Vanilla JS/HTML Monolith** to a modern **React + Vite + Tailwind** stack. Because of existing macOS permission limitations (`EPERM` / `EACCES` on `~/.npm`), local `tsc` and `vite` commands often fail.

Therefore, we have established a **Micro-Frontend** approach where React components compiled via Vercel are mounted directly into the `index.html` structure.

### Your Rules:
1. **Never run `npm install` without a local cache.** If forced to run NPM locally for testing, use `--cache ./.npm-cache` to bypass the system root locks.
2. **Work seamlessly across `index.html` and `src/`.** The massive `index.html` contains the core app shell, while the `src/` directory holds the modern React components (`ActionSearchBar`, `ExpandableTabs`, `SlidingNumber`).
3. **React components are injected dynamically.** Look at `src/react-entry.tsx` to see how React elements are mounted to `<div id="react-*">` targets in the DOM.
4. **Deploy via Vercel, not GitHub Pages.** Our deployment relies on the `vercel.json` config mapping back to `index.html`. Always commit to `main` and let the cloud builders compile the TypeScript and Tailwind CSS styles, instead of relying on the broken macOS build pipeline.
