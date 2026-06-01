# Test Fixtures

## minimal-project

A minimal but complete Marbas project used as the shared base for integration tests
(build, preview, eject, reset, doctor).

The fixture was generated via `initProject()` and then manually extended with:
- `pages/about/index.md` — second page for navigation coverage
- `pages/_data/site.json` — enriched with a header action button

### Updating the fixture

If `marbas-project.json` or `site.json` schema changes, regenerate the fixture:

```js
import { initProject } from '../../src/init/index.js';
initProject({
  projectPath: 'test/fixtures/minimal-project',
  name: 'minimal-project',
  description: 'Minimal fixture project for integration tests',
  defaultEnvironment: 'development',
  force: true,
});
```

Then re-apply the manual additions from this README and run the smoke test.

### Stability contract

Changes to the fixture must be coordinated with all dependent tests.
Build artifacts (`build/`, `.marbas/build-context/`) are excluded via the
fixture's own `.gitignore`.
