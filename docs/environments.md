# Environments & Deployment

Every Marbas project is described by a single JSON file at the project root: `marbas-project.json`. It defines the project identity, build paths, named environments, and optional FTP deploy targets.

---

## `marbas-project.json` reference

### Core fields

| Field | Type | Default | Description |
|---|---|---|---|
| `name` | string | project folder name | Human-readable project name. |
| `description` | string | `""` | Optional description. |
| `marbasSite` | string | — | The `@crafted.solutions/marbas-site` version this project requires (semver). |
| `defaultEnvironment` | string | first environment key | The environment used when no `--env` flag is passed to the CLI. |

### `paths`

| Field | Type | Default | Description |
|---|---|---|---|
| `paths.buildDir` | string | `"./build"` | Directory where built outputs are placed, relative to the project root. |
| `paths.pagesDir` | string | `"./pages"` | Directory containing Markdown page files. |

### `environments`

A map of named environments. Each key is the environment name (e.g. `"staging"`).

| Field | Type | Default | Description |
|---|---|---|---|
| `outputName` | string | environment key | Suffix for the output directory: `<buildDir>/public_<outputName>`. |
| `env` | object | `{}` | Static environment variables injected into the build for this environment. |
| `deployTarget` | string | — | Name of a `deployTargets` entry to use when deploying this environment. |

```json
"environments": {
  "development": {
    "outputName": "development",
    "env": {}
  },
  "staging": {
    "outputName": "staging",
    "env": {
      "SITE_URL": "https://staging.acme.example"
    },
    "deployTarget": "ftp-staging"
  },
  "production": {
    "outputName": "production",
    "env": {
      "SITE_URL": "https://acme.example"
    },
    "deployTarget": "ftp-production"
  }
}
```

### `deployTargets`

A map of FTP deploy target definitions. Each key is a target name referenced by `deployTarget` in an environment.

> FTP is currently the only supported deploy type.

```json
"deployTargets": {
  "ftp-staging": {
    "type": "ftp"
  },
  "ftp-production": {
    "type": "ftp"
  }
}
```

The actual FTP credentials (host, user, password, path) are **not** stored in `marbas-project.json`. They are loaded from environment-specific config files at deploy time.

---

## Output paths

Built output is placed at:

```
<buildDir>/public_<outputName>/
```

For the default setup (`buildDir: ./build`, `outputName: staging`):

```
my-project/
└── build/
    ├── public_development/
    ├── public_staging/
    └── public_production/
```

---

## Environment config files

Per-environment variables and FTP credentials are stored in config files, not in `marbas-project.json`. This keeps sensitive values out of source control.

```
my-project/
└── config/
    └── env/
        ├── .env.staging          ← committed (non-sensitive vars)
        ├── .env.staging.local    ← git-ignored (FTP credentials)
        ├── .env.production
        └── .env.production.local
```

The `.local` files are automatically excluded from git via the generated `.gitignore`.

### FTP variables

Place these in `.env.<environment>.local`:

```
FTP_HOST=ftp.acme.example
FTP_PORT=21
FTP_USER=deploy_user
FTP_PASSWORD=secret
FTP_ROOT_PATH=/public_html/
FTP_SECURE=false
FTP_USE_PASSIVE=true
FTP_TIMEOUT=30000
```

| Variable | Description |
|---|---|
| `FTP_HOST` | FTP server hostname or IP (required) |
| `FTP_PORT` | FTP port (default: `21`) |
| `FTP_USER` | FTP username (required) |
| `FTP_PASSWORD` | FTP password (required) |
| `FTP_ROOT_PATH` | Remote directory to deploy to (required) |
| `FTP_SECURE` | Use FTPS (`true`/`false`, default: `false`) |
| `FTP_USE_PASSIVE` | Use passive mode (`true`/`false`, default: `true`) |
| `FTP_TIMEOUT` | Connection timeout in ms (default: `30000`) |

---

## CLI commands

### Build

```bash
marbas-site build my-project --env=staging
```

Runs the Eleventy build for the given environment and writes output to `<buildDir>/public_<outputName>/`.

### Preview

```bash
marbas-site preview my-project --env=development
```

Starts a local preview server for the specified environment's build output.

### Deploy

```bash
marbas-site deploy my-project --env=staging
```

Uploads the built output to the FTP target configured for the environment. The deploy reads `deployTarget` from the environment entry, looks up the target in `deployTargets`, and loads credentials from `config/env/.env.<environment>.local`.

Add `--confirm` to skip the interactive production confirmation prompt:

```bash
marbas-site deploy my-project --env=production --confirm
```

### Doctor

```bash
marbas-site doctor my-project
```

Checks the project for configuration problems and version mismatches. The doctor reports:

- Whether the installed `marbas-site` version matches `marbasSite` in the project config
- Whether all defined environments have valid config files
- Whether ejected components are in sync with the library
- Whether `cssMode` is consistent with the available CSS assets
- Whether build output directories contain stale data from a previous version

Example output:

```
✓ marbas-site version matches (0.0.24)
✓ Environment: development — config found
⚠ Environment: production — .env.production.local not found (FTP credentials missing)
✓ Hero component — not ejected (using library version)
✓ CSS mode: marbas
```

Use `--json` to get machine-readable output:

```bash
marbas-site doctor my-project --json
```

---

## Complete example

```json
{
  "name": "acme-website",
  "description": "Acme Corp corporate website",
  "marbasSite": "0.0.24",
  "paths": {
    "buildDir": "./build"
  },
  "defaultEnvironment": "development",
  "environments": {
    "development": {
      "outputName": "development",
      "env": {
        "SITE_URL": "http://localhost:8080"
      }
    },
    "staging": {
      "outputName": "staging",
      "env": {
        "SITE_URL": "https://staging.acme.example"
      },
      "deployTarget": "ftp-staging"
    },
    "production": {
      "outputName": "production",
      "env": {
        "SITE_URL": "https://acme.example"
      },
      "deployTarget": "ftp-production"
    }
  },
  "deployTargets": {
    "ftp-staging": {
      "type": "ftp"
    },
    "ftp-production": {
      "type": "ftp"
    }
  }
}
```
