# Repository Guidelines

## Project Structure & Module Organization
The gameplay source lives under `js/`, split into `engine`, `systems`, `entities`, `scenes`, `ui`, and `utils`; the entrypoint is `js/main.js`. Static HTML and CSS are in `index.html` and `styles/`. Tests sit in `tests/` with suite runners, while art placeholders reside in `assets/`; automation scripts like `generate-placeholders.js` and `generate-sprites.js` live at the repo root.

## Build, Test, and Development Commands
Run `npm run dev` to launch the Python web server on port 8000 and auto-open the game. Use `npm start` or `npm run serve` for a manual server, and `npm run setup` to regenerate placeholder sprites after asset changes. Execute `npm test` for the headless suite and `npm run test-browser` for Playwright-driven canvas checks; `npm run clean` removes generated screenshots before re-running captures.

## Coding Style & Naming Conventions
Stick to modern ES modules with named exports where practical and four-space indentation, matching existing files. Favor PascalCase for class files (`FarmScene.js`) and camelCase for variables/functions; keep test files suffixed with `Test.js`. Maintain succinct debug logging and group related helpers inside the relevant subdirectory (`utils/` for shared helpers, `systems/` for gameplay loops).

## Testing Guidelines
Primary unit and integration coverage runs through `tests/runAllTests.js`, which aggregates suites like `FarmingSystemTest`. Browser regression checks rely on Playwright via `npm run test-browser`; ensure assets load before capturing baselines in `tests/`. Add new suites using the `TestFramework` helper, and keep pass/fail reporting deterministic so CI exits non-zero on failures.

## Commit & Pull Request Guidelines
Commits in history use concise, imperative summaries (e.g., "Add initial game assets…"); follow that tone and scope each change set narrowly. Reference related issues in the description, note any gameplay regressions or saved-game migrations, and attach updated screenshots when the UI shifts. PRs should list test commands executed and call out asset or performance impacts so reviewers can reproduce results quickly.
