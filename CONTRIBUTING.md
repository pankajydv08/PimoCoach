# Contributing to Interview Coach

Thank you for your interest in contributing! This repository is participating in Hacktoberfest 2025 — contributions are welcome from developers of all skill levels.

Please read the short guide below to get started quickly.

## Quick Hacktoberfest note

- If you want your PR to count for Hacktoberfest, please make sure the PR follows the repository guidelines and contains meaningful code or documentation changes.
- Add `hacktoberfest-2025` (or `hacktoberfest`) to the PR title or mention it in the PR description if you want maintainers to easily identify it.

## Getting started (local)

The project uses Node.js, Vite and TypeScript. These commands assume you are using Windows PowerShell.

1. Clone the repository and install dependencies

```powershell
git clone <repo-url>
cd project
npm install
```

2. Start the dev server

```powershell
npm run dev
```

3. Run tests (if available)

```powershell
npm test
```

If you see any issues starting the project, open an issue describing the error and your environment.

## How to contribute

1. Pick an issue labeled `good first issue`, `help wanted`, or `hacktoberfest-2025`.
2. Fork the repository and create a descriptive branch name for your work:

```powershell
git checkout -b fix/clear-description
```

3. Make small, focused changes. Keep PRs scoped to a single purpose.
4. Write tests when adding or changing logic (if applicable).
5. Commit with a clear message and push to your fork:

```powershell
git add .
git commit -m "Fix: short description of change"
git push origin fix/clear-description
```

6. Open a Pull Request back to `main` with a clear description of what you changed and why.

## PR checklist (please include)

- A clear title and description explaining the change.
- Linked issue number (if applicable).
- Minimal, focused changes (avoid noisy formatting-only changes alongside logic changes).
- Passing tests / linting locally where possible.
- For Hacktoberfest PRs, include `hacktoberfest-2025` in the description or title so maintainers can find it quickly.

## Code style and quality

- Follow existing TypeScript and React patterns used in the repository.
- Keep code readable and well-commented where non-obvious logic exists.
- Use the existing linting rules (if configured). Run lint locally and fix issues before opening a PR.

## Good first contributions

- Documentation improvements (README, examples, small guides)
- Small bug fixes or UI tweaks
- Fixing typos, improving error messages

If you want, open an issue proposing a small task and tag it `good first issue` so maintainers can triage and approve it for Hacktoberfest.

## Security & sensitive data

- Never commit secrets, API keys, or credentials. Use environment variables and `.env` for local development (and add `.env` to `.gitignore`).

## Code of conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you agree to abide by its terms.

For more information, visit: https://www.contributor-covenant.org/

## License

All contributions are subject to the repository license. By opening a PR you confirm you have the right to contribute the code under the project's license.

## Need help?

If you're unsure where to start, open an issue with the label `question` or comment on an existing issue and we'll help you get set up.

Thanks for contributing — we appreciate your time and interest in making Interview Coach better!
