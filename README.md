# man / table-widget

## Installation

```bash
$ npm install
```

## Running the app

| Command | Description |
|---|---|
| `npm start` | Starts the development server |
| `npm run build` | Creates the production build |
| `npm run build:watch` | Creates the production build and watch for changes |
| `npm run test` | Runs the unit tests |
| `npm run test:watch` | Runs the unit tests and watches for changes |
| `npm run type-check` | Checks the codebase on type errors |
| `npm run type-check:watch` | Checks the codebase on type errors and watches for changes |
| `npm run lint` | Checks the codebase on style issues |
| `npm run lint:fix` | Fixes style issues in the codebase |

## Release and installation

| Command | Description |
|---|---|
| `scripts/release.sh` | Verifies, builds, commits, tags and publishes the next release candidate |
| `scripts/release.sh final` | Promotes the open candidate line to a final release |
| `scripts/release.sh rc --install` | Same, and installs the new version into Staffbase right away |
| `scripts/install.sh` | Installs the latest release into Staffbase (replaces the registered widget) |
| `scripts/install.sh 1.4.0-rc.12 --dry-run` | Shows what installing that version would change |

`scripts/install.sh` reads its configuration from a gitignored `.env` — copy
`.env.example` and fill in `STAFFBASE_API_URL`, `STAFFBASE_API_TOKEN` and the
widgets to install by default (`STAFFBASE_WIDGETS`).


## Building the form for configuration

This project uses [react-jsonschema-form](https://rjsf-team.github.io/react-jsonschema-form/) for configuring the widget properties. For more information consult their [documentation](https://rjsf-team.github.io/react-jsonschema-form/docs/) 
