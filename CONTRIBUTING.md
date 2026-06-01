# Contributing to marbas-site

Thank you for your interest in contributing.

## Reporting issues

Before opening an issue, check whether it has already been reported. When filing a bug, include:

- `marbas-site` version (`marbas-site --version`)
- Node.js version (`node --version`)
- Operating system
- Steps to reproduce
- Expected and actual behavior

## Pull requests

1. Fork the repository and create a branch from `main`.
2. Make your changes.
3. Add or update tests — see [Test conventions](#test-conventions) below.
4. Run `npm test` and confirm all tests pass.
5. Open a pull request with a clear description of what changes and why.

We review PRs on a best-effort basis. Small, focused changes are easier to review than large ones.

## Test conventions

- Framework: `node:test` with `node:assert/strict`. No additional test libraries.
- Temporary directories: `fs.mkdtempSync(path.join(os.tmpdir(), 'marbas-...'))`.
- Unit tests for any non-trivial logic. Integration tests for build/preview/deploy pipeline changes.
- Run tests with `npm test`.

## Code conventions

- ESM throughout (`import`/`export`, `"type": "module"` in `package.json`).
- No new runtime dependencies without a clear justification in the PR description.
- No comments explaining *what* code does — only *why* if the reason is non-obvious.
- Existing file structure and naming conventions take precedence over personal preference.

## Local development

```bash
git clone https://github.com/Crafted-Solutions/marbas-site.git
cd marbas-site
npm install
npm test
```

To run the CLI directly against a project:

```bash
node src/cli/bin.js build /path/to/my-project --env=development
```

## Questions

Open an issue or reach out at [hello@crafted.solutions](mailto:hello@crafted.solutions).
