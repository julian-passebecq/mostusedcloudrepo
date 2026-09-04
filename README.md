# Cloud Repo Radar

A lightweight React + D3 GitHub explorer for modern data, BI and cloud engineering.

This repository was rebuilt from the old StarryLines backend snapshot. The previous Kotlin/MongoDB/Cloudflare architecture depended on external components that were not present here, so this version is intentionally self-contained and deployable as a static site.

## Filters

**Content type ribbon**
- Repositories
- Projects
- Libraries
- Tools
- Samples
- Templates
- Learning

**Code & query**
- Python
- PySpark
- PowerShell
- SQL

**Platforms & services**
- Power BI
- Microsoft Fabric
- SQL Server
- Databricks

The app queries GitHub's public repository search API, caches query results in the browser for 15 minutes, and falls back to an illustrative local data set if GitHub is unavailable or rate-limited.

> GitHub does not publish a literal repository usage metric. Stars, forks and recent activity are used as discovery/ranking signals instead.

## Stack

- React 19
- Vite
- D3
- Lucide icons
- Vitest
- GitHub REST API

No application backend or database is required.

## Run locally

```bash
npm install
npm run dev
```

## Test and build

```bash
npm test
npm run build
```

## Deploy

### Netlify

Connect the repository. `netlify.toml` already defines:

- Build command: `npm run build`
- Publish directory: `dist`
- Node: 20

### Vercel

Use Vite defaults:

- Framework preset: Vite
- Build command: `npm run build`
- Output directory: `dist`

## API limits

The public GitHub Search API is rate-limited. This app deliberately makes one request per filter state, cancels stale requests, caches successful responses, and has a no-secret fallback mode. For a high-traffic production application, move GitHub authentication to a server-side function or GitHub App; do not expose a personal access token in Vite client code.

## Attribution

The repository originally contained a snapshot of [PabloLec/StarryLines](https://github.com/PabloLec/StarryLines). That backend has been removed in this rebuild. The repository retains its existing GPL license.
