# Repository Guidelines

## Project Structure & Module Organization
- Root `index.html` links to individual mini-games stored in sibling directories (e.g., `bomb-topic`, `who-is-spy`, `two-player-quiz`).
- Each game keeps its own `index.html`, optional `script.js`/`styles.css`, and supporting assets like JSON word lists or audio files; keep new assets inside the same folder to stay self-contained.
- Shared configuration lives at the root (`package.json`, `vercel.json`). Update `README.md` when adding or renaming games so the catalog remains accurate.

## Build, Test, and Development Commands
- `npm run dev` launches a lightweight Python HTTP server on port 3000 so you can preview the static site locally.
- `npm run build` is a no-op placeholder; use it to confirm that no pre-processing is required before deploying.
- `npm start` delegates to `npm run dev` for hosting in development environments that expect `start`.

## Coding Style & Naming Conventions
- Use 4-space indentation for JavaScript and align HTML/CSS indentation with surrounding files; prefer single quotes in JS unless template literals add clarity.
- Keep functions and variables camelCase, reserve PascalCase for constructor-like utilities, and name asset files descriptively (`tick.mp3`, `questions_complete.js`).
- Favor inline comments only when logic is non-obvious; follow the existing Traditional Chinese tone when localizing UI copy.

## Testing Guidelines
- These games rely on manual browser testing. Before pushing, load each affected HTML file via `npm run dev`, exercise primary flows, and confirm console stays clean.
- When modifying word/question banks, double-check encoding and ensure randomization still reaches the new entries.
- Record edge-case scenarios (player counts, timers, mobile layout) in the PR description when they cannot be automated.

## Commit & Pull Request Guidelines
- Match the repository’s history: concise, present-tense summaries work well (many commits use Traditional Chinese). Include scope when helpful (e.g., “新增 who-is-spy 計時器”).
- Reference related issues or TODO items in commit bodies when relevant and attach screenshots or GIFs for UI changes.
- PRs should outline what changed, how it was tested, and any follow-up tasks so reviewers can verify the mini-game quickly.

## Asset & Deployment Notes
- Keep audio, images, and data lightweight—Vercel deploys the `main` branch as-is. Remove unused assets to avoid bloating the static bundle.
- Verify that any new game folder is linked from `index.html` and manually test the deployed preview before requesting production promotion.
