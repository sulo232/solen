# Solen.ch Roadmap (Claude Code Hand-off)

# Solen.ch Roadmap & Architecture (Claude Code Hand-off)

## The Core Problem: Why Changes Weren't Going Live
Recently, Claude Code refactored the application from a 13,000-line monolithic `index.html` file into a modular Vite application (inside the `src/` directory). 

However, **the live website (GitHub Pages) was still serving the uncompiled `index.html` file in the root directory.** 
Because `npm install` and `npm run build` were failing locally due to NPM permission errors on the host machine, the Vite application was never actually compiled into a format the browser could read. Therefore, all of the clean, modular code inside `src/` was completely ignored by the live site, which continued to run the legacy inline code.

## The Solution: Automated Deployments via GitHub Actions

To permanently fix this so that Claude's code *actually goes live*:
1. **GitHub Actions pipeline created:** A `.github/workflows/deploy.yml` file has been pushed to the `main` branch.
2. **Automated Vite Build:** This action listens for any push to the `main` branch. It automatically spins up an Ubuntu server in the cloud, installs dependencies, runs `npm run build`, and deploys the resulting `dist/` folder to GitHub Pages.

### Immediate Action Required by the USER:
To make this work, the USER must change how GitHub Pages hosts the site:
1. Go to your GitHub Repository -> **Settings** -> **Pages**.
2. Under **Build and deployment**, change the **Source** dropdown from "Deploy from a branch" to **"GitHub Actions"**.

---

### Instructions for Claude Code (Going Forward):

1. **Stop editing `index.html`'s massive inline `<style>` and `<script>` tags.** 
   The root `index.html` should only be treated as a Vite entrypoint. Delete the legacy 13,000 lines of inline CSS/JS from it once you are confident the Vite modules in `src/` have fully replaced their functionality.
2. **Write code in `src/`.** All future features, UI tweaks, and CSS changes should be done inside the `src/` directory.
3. **Push to `main`.** Whenever you finish a feature, simply commit and `git push origin main`. The newly created GitHub Action will automatically compile the Vite app and deploy it live to `solen.ch`!
4. **Fix NPM locally (if required):** If you need to test the Vite build locally using `npm run dev`, you must fix the NPM permission error on the User's Mac by running: `sudo chown -R 501:20 "/Users/sulo/.npm"`.
