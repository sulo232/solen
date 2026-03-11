# Solen.ch Roadmap (Claude Code Hand-off)

# Solen.ch Roadmap & Architecture (Claude Code Hand-off)

## The Core Architecture Constraint (CRITICAL)
Recently, there was an attempt to refactor this application from a monolith into a modular Vite application. **This approach failed and must be abandoned.**

The user's local MacOS environment has severe NPM permission restrictions (`EPERM` / `EACCES` under `~/.npm`), which means **we cannot compile code locally via NPM.** Furthermore, we do not have an automated GitHub Actions pipeline available for deployment.

Because we cannot build the site, any code extracted into a `src/` folder is completely invisible to the live website, which strictly serves the root `index.html` file via GitHub Pages.

## Instructions for Claude Code (Going Forward):

1. **Delete the `src/` folder.** It is a dead-end that cannot be deployed.
2. **Work exclusively in the root `index.html` file.** Yes, the file is massive (13,000+ lines), but it is the *only* way the user's codebase can go live without a build pipeline. Do not attempt to abstract the CSS, HTML, or JavaScript into separate module files unless you are simply linking them via `<script src="...">` directly in the root directory.
3. **Push to `main`.** Whenever you finish a feature, simply commit and `git push origin main`. Because you are editing the root files natively, the changes will go live on `solen.ch` almost instantly.
4. **Never try to run `npm install` or `npm run build`.** It will crash the user's terminal and block your execution entirely.
