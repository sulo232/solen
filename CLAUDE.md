# Solen.ch Claude Code Configuration

## CRITICAL: Architectural Constraints
**DO NOT USE VITE, WEBPACK, OR NPM TO BUILD THIS PROJECT.**
The MacOS environment has severe NPM permission restrictions (`EPERM` / `EACCES` on `~/.npm`). We cannot compile code locally, and GitHub Actions is unavailable or hidden for this repository. 

Because of this, the application MUST remain structured as a **Vanilla HTML/CSS/JS Monolith**. All application logic, styling, and markup MUST be housed directly within `index.html`.

If you extract code into a `src/` folder that requires compilation, the live GitHub Pages site will ignore it because it only serves the root `index.html`.

### Your Rules:
1. **Delete the `src/` folder if you see it.** It is a dead-end that cannot be deployed.
2. **Work exclusively in the root `index.html` file.** Yes, the file is massive (13,000+ lines), but it is the *only* way the codebase can go live without a build pipeline.
3. **Never run `npm install` or `npm run build`.** It will crash the terminal and block your execution entirely.
4. **Push to `main`.** Whenever you finish a feature, simply commit and `git push origin main`. Because you are editing the root files natively, the changes will go live on `solen.ch` almost instantly via GitHub Pages.
