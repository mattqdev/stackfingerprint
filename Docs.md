# Stack Fingerprint — Documentation

Technical reference for the Stack Fingerprint API, configuration system, signal database, and GitHub Action integration.

---

## Table of contents

1. [Concepts & terminology](#concepts--terminology)
2. [API reference](#api-reference)
3. [Configuration file — `.stackfingerprint.json`](#configuration-file-stackfingerprintjson)
4. [Themes](#themes)
5. [Layouts](#layouts)
6. [Signal categories](#signal-categories)
7. [Dev-only signals & filtering](#dev-only-signals--filtering)
8. [Monorepo support](#monorepo-support)
9. [GitHub Action](#github-action)
10. [Adding a signal](#adding-a-signal)
11. [Self-hosting](#self-hosting)
12. [Architecture overview](#architecture-overview)
13. [Troubleshooting](#troubleshooting)

---

## Concepts & terminology

### Signal

A **signal** is a single piece of detected technology — one row in the `src/data/signals.js` database. Each signal has:

| Field       | Type      | Description                                                                             |
| ----------- | --------- | --------------------------------------------------------------------------------------- |
| `id`        | `string`  | Unique, lowercase, hyphen-separated identifier (e.g. `nextjs`, `vitest`)                |
| `label`     | `string`  | Human-readable display name shown on the card pill (e.g. `Next.js`)                     |
| `category`  | `string`  | Logical grouping — see [Signal categories](#signal-categories)                          |
| `iconSlug`  | `string`  | Simple Icons slug used to fetch the brand icon                                          |
| `color`     | `string`  | Hex colour used for the pill background / icon tint                                     |
| `match`     | `object`  | Detection rules — `files`, `deps`, `devDeps`, `dirs`, `content`                         |
| `isDevOnly` | `boolean` | Set automatically by `detect.js` when evidence comes exclusively from `devDependencies` |

### Pill

The visual chip rendered inside the SVG card for each detected signal. A pill displays the signal's icon and label. Dev-only pills are rendered at **55 % opacity** in `all` filter mode so the production stack stays visually dominant.

### Theme

A named colour palette applied to the card background, borders, text, and pill styles. Themes do not affect detection — only presentation.

### Layout

A structural template that controls how pills are arranged inside the card (grid, row, terminal prompt, banner strip, etc.).

### Category filter (`categoryFilter`)

A query parameter that controls which signals reach the SVG renderer:

| Value             | Behaviour                                                                                                       |
| ----------------- | --------------------------------------------------------------------------------------------------------------- |
| `all` _(default)_ | All detected signals. Dev-only pills are dimmed.                                                                |
| `prodonly`        | Only signals sourced from `dependencies`, config files, or directory structures — never from `devDependencies`. |
| `top`             | Only signals in the `lang` and `framework` categories, capped at 5. Ideal for a concise, honest badge.          |

### Detection signal vs. false positive

A **false positive** is a signal that appears on the card but does not reflect a technology the team actively uses. Common causes:

- A package appears in `devDependencies` only (e.g. Babel used by a build tool internally).
- A lockfile contains a transitive dependency whose config file happens to match a detection rule.
- The `.stackfingerprint.json` `ignore` list is the correct remedy for persistent false positives.

---

## API reference

### `GET /api/card`

Returns a self-contained SVG card for the requested repository.

#### Query parameters

| Parameter        | Required | Type                           | Default   | Description                                               |
| ---------------- | -------- | ------------------------------ | --------- | --------------------------------------------------------- |
| `repo`           | ✅       | `owner/repo`                   | —         | GitHub repository to scan                                 |
| `theme`          |          | `string`                       | `ocean`   | Card colour theme                                         |
| `layout`         |          | `string`                       | `classic` | Card layout template                                      |
| `size`           |          | `sm` \| `md` \| `lg`           | `md`      | Card size                                                 |
| `iconStyle`      |          | `color` \| `mono` \| `outline` | `color`   | Icon rendering style                                      |
| `pillShape`      |          | `round` \| `square`            | `round`   | Pill corner radius                                        |
| `categoryFilter` |          | `all` \| `prodonly` \| `top`   | `all`     | Signal filter                                             |
| `path`           |          | `string`                       | _(root)_  | Sub-path to scan within the repository                    |
| `devOnly`        |          | `0` \| `1`                     | `1`       | `0` hides all dev-only signals (equivalent to `prodonly`) |

#### Example requests

```
# Minimal — scan from root, all defaults
GET /api/card?repo=vercel/next.js

# Monorepo — scan apps/web only
GET /api/card?repo=myorg/monorepo&path=apps/web

# Production-only signals, compact layout, dark theme
GET /api/card?repo=myorg/myrepo&categoryFilter=prodonly&layout=compact&theme=obsidian

# Top 5 signals only — cleanest possible badge
GET /api/card?repo=myorg/myrepo&categoryFilter=top&size=sm
```

#### Response

`Content-Type: image/svg+xml`

A fully self-contained SVG. Brand icons are inlined as base64, making the card render correctly in all environments including GitHub READMEs.

#### Error responses

| HTTP code | Meaning                                           |
| --------- | ------------------------------------------------- |
| `400`     | Missing or malformed `repo` parameter             |
| `404`     | Repository not found or not public                |
| `422`     | Repository found but no signals detected          |
| `500`     | Internal error (GitHub API failure, render error) |

---

## Configuration file — `.stackfingerprint.json`

Drop this file at the root of your repository (or at the sub-path you are scanning) to control detection behaviour without changing any URL parameter. The API reads this file before rendering the card.

### Schema

```json
{
  "ignore": ["babel", "webpack", "terraform"],
  "pin": ["nextjs", "typescript"],
  "labels": { "nextjs": "Next.js 14" },
  "path": "apps/web"
}
```

### Fields

| Field    | Type                       | Description                                                                                         |
| -------- | -------------------------- | --------------------------------------------------------------------------------------------------- |
| `ignore` | `string[]`                 | Signal IDs to suppress. Useful for eliminating persistent false positives.                          |
| `pin`    | `string[]`                 | Signal IDs to always include, even if not auto-detected.                                            |
| `labels` | `{ [id: string]: string }` | Override the display label for any signal. Useful for specifying versions.                          |
| `path`   | `string`                   | Default sub-directory to scan. Overridden by the `?path=` query parameter when provided explicitly. |

### Precedence

`?path=` URL param > `path` in `.stackfingerprint.json` > repository root.

`pin` IDs always appear, regardless of `categoryFilter`. `ignore` IDs are removed before filtering.

### Example — eliminating false positives in a large repo

```json
{
  "ignore": ["rspec", "terraform", "babel"],
  "labels": {
    "react": "React 18",
    "typescript": "TypeScript 5"
  }
}
```

---

## Themes

| Theme ID   | Description                            |
| ---------- | -------------------------------------- |
| `ocean`    | Cool blues and cyans — the default     |
| `obsidian` | Dark charcoal with purple accents      |
| `sakura`   | Soft pinks and rose tones              |
| `forest`   | Muted greens on a dark background      |
| `sunset`   | Warm oranges and reds                  |
| `midnight` | Deep navy with silver highlights       |
| `aurora`   | Teal-to-purple gradient                |
| `mono`     | Greyscale — no colour                  |
| `paper`    | Light cream background, ink-style text |
| `neon`     | High-contrast neon on black            |

Themes can be previewed in the [Visual Builder](https://stackfingerprint.vercel.app).

---

## Layouts

| Layout ID  | Description                            | Best for          |
| ---------- | -------------------------------------- | ----------------- |
| `classic`  | Grid of pills with title and repo name | General READMEs   |
| `compact`  | Tighter pill grid, smaller padding     | Sidebar badges    |
| `minimal`  | Pills only, no header or metadata      | Inline embeds     |
| `terminal` | Monospace terminal prompt style        | Dev tool projects |
| `banner`   | Wide horizontal strip of pills         | Project headers   |

---

## Signal categories

Categories group signals logically and drive the `top` filter.

| Category    | Examples                                 | Included in `top` filter |
| ----------- | ---------------------------------------- | ------------------------ |
| `lang`      | TypeScript, JavaScript, Python, Rust, Go | ✅                       |
| `framework` | Next.js, Django, Rails, FastAPI, Remix   | ✅                       |
| `runtime`   | Node.js, Deno, Bun                       |                          |
| `bundler`   | Vite, webpack, Rollup, esbuild, Parcel   |                          |
| `test`      | Vitest, Jest, Pytest, RSpec              |                          |
| `lint`      | ESLint, Prettier, Stylelint              |                          |
| `ci`        | GitHub Actions, CircleCI, GitLab CI      |                          |
| `infra`     | Docker, Terraform, Kubernetes            |                          |
| `db`        | PostgreSQL, Redis, PlanetScale           |                          |
| `ui`        | Tailwind CSS, Radix, shadcn/ui           |                          |

---

## Dev-only signals & filtering

### How detection classifies dev signals

`detect.js` reads `package.json` and classifies each detected signal as **dev-only** (`isDevOnly: true`) if:

1. The matching package appears exclusively in `devDependencies`, **or**
2. The signal's ID is in the `INHERENTLY_DEV` set — a hard-coded list of 30+ signals that are always considered dev tooling regardless of where they appear (linters, CI runners, build tools, test frameworks, etc.).

### Visual dimming

In `categoryFilter=all` mode, dev-only pills are rendered at **55 % opacity**. The production stack (full opacity) naturally draws the eye; the dev tooling is visible but secondary.

### Filtering options

| Goal                                       | Approach                                           |
| ------------------------------------------ | -------------------------------------------------- |
| Show everything, but deemphasise dev tools | `categoryFilter=all` (default)                     |
| Hide all dev tools completely              | `categoryFilter=prodonly` or `?devOnly=0`          |
| Show only the 2–5 most important signals   | `categoryFilter=top`                               |
| Suppress a specific signal permanently     | Add its ID to `ignore` in `.stackfingerprint.json` |

---

## Monorepo support

For repositories with multiple sub-projects, scanning from the root returns signals from all of them, which often produces noise.

### Using `?path=`

```
/api/card?repo=myorg/monorepo&path=apps/web
```

Only the `apps/web` directory and its children are scanned.

### Using `.stackfingerprint.json`

Place a `.stackfingerprint.json` file inside the sub-path with a `path` key, or place it at the repo root referencing the sub-path:

```json
{ "path": "apps/web" }
```

### Scanning multiple sub-projects

Generate a separate card per sub-project by calling the API multiple times with different `path` values:

```markdown
### Frontend

![](https://stackfingerprint.vercel.app/api/card?repo=myorg/mono&path=apps/web)

### Backend

![](https://stackfingerprint.vercel.app/api/card?repo=myorg/mono&path=apps/api)
```

---

## GitHub Action

The Action fetches the SVG at CI time on GitHub's own infrastructure, validates it, and commits it to the repository. After setup, the README references the local file — no external image loading at render time.

### Setup

1. Create the directory: `mkdir -p .github/workflows assets`
2. Copy the workflow from the README (or below) to `.github/workflows/stack-fingerprint.yml`
3. Update your README to use the local path:

```markdown
![Stack Fingerprint](./assets/stack-fingerprint.svg)
```

4. Push — the Action runs on the first push to `main` and weekly thereafter.

### Full workflow file

```yaml
name: Update Stack Fingerprint

on:
  push:
    branches: [main]
  schedule:
    - cron: "0 3 * * 1"
  workflow_dispatch:
    inputs:
      theme:
        description: Card theme
        default: ocean
      layout:
        description: Card layout
        default: classic
      size:
        description: Card size (sm / md / lg)
        default: md
      path:
        description: Sub-path to scan (leave blank for root)
        default: ""

jobs:
  update-card:
    runs-on: ubuntu-latest
    permissions:
      contents: write

    steps:
      - uses: actions/checkout@v4

      - name: Fetch Stack Fingerprint SVG
        run: |
          REPO="${{ github.repository }}"
          THEME="${{ inputs.theme || 'ocean' }}"
          LAYOUT="${{ inputs.layout || 'classic' }}"
          SIZE="${{ inputs.size || 'md' }}"
          PATH_PARAM="${{ inputs.path }}"

          URL="https://stackfingerprint.vercel.app/api/card?repo=${REPO}&theme=${THEME}&layout=${LAYOUT}&size=${SIZE}"
          [ -n "$PATH_PARAM" ] && URL="${URL}&path=${PATH_PARAM}"

          mkdir -p assets
          HTTP_CODE=$(curl -s -o assets/stack-fingerprint.svg -w "%{http_code}" "$URL")

          if [ "$HTTP_CODE" != "200" ]; then
            echo "API returned HTTP $HTTP_CODE — aborting." && exit 1
          fi

          if ! grep -q "<svg" assets/stack-fingerprint.svg; then
            echo "Response does not look like an SVG — aborting." && exit 1
          fi

      - name: Commit if changed
        run: |
          git config user.name  "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git add assets/stack-fingerprint.svg
          git diff --cached --quiet || git commit -m "chore: update stack fingerprint card"
          git push
```

### Behaviour

- **Idempotent** — if the SVG has not changed, no commit is made.
- **Validated** — the Action aborts if the API returns a non-200 status or a non-SVG body.
- **Manual trigger** — use `workflow_dispatch` to regenerate the card on demand with custom parameters (theme, layout, size, path).
- **Self-hosted compatible** — change the base URL in the `curl` command to point at your own instance.

---

## Adding a signal

Detection signals live in `src/data/signals.js`. Each entry follows this schema:

```js
{
  id: "vitest",             // unique lowercase ID
  label: "Vitest",          // display name on the pill
  category: "test",         // see Signal categories
  iconSlug: "vitest",       // Simple Icons slug (https://simpleicons.org)
  color: "#6E9F18",         // hex colour for the pill
  match: {
    // At least one match rule is required:
    files:   ["vitest.config.ts", "vitest.config.js"],  // filenames to look for
    deps:    ["vitest"],                                  // packages in dependencies
    devDeps: ["vitest"],                                  // packages in devDependencies
    dirs:    ["__tests__"],                               // directory names
    content: { file: "package.json", pattern: "vitest" } // content substring match
  },
}
```

### Tips for accurate signals

- Use `devDeps` instead of `deps` for packages that are always installed as dev dependencies. This ensures `isDevOnly` is set correctly and the pill is dimmed in `all` mode.
- Prefer `files` matches over `content` matches — they are faster and less prone to false positives.
- Test against both a minimal repo (does it detect correctly?) and a large repo (does it produce false positives?).
- Open an issue before submitting large batches of new signals.

---

## Self-hosting

Stack Fingerprint is a standard Next.js application. Any platform that can run Next.js can host it.

### Vercel (one click)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/mattqdev/stackfingerprint)

### Manual deployment

```bash
git clone https://github.com/mattqdev/stackfingerprint.git
cd stackfingerprint
npm install
npm run build
npm start
```

### Environment variables

No environment variables are required. The GitHub Contents API is used unauthenticated for public repositories.

To avoid rate-limiting on busy instances, set a `GITHUB_TOKEN` with read-only public access:

```env
GITHUB_TOKEN=ghp_...
```

---

## Architecture overview

```
User / GitHub Action
       │
       ▼
GET /api/card?repo=…&path=…&theme=…&categoryFilter=…
       │
       ├─ route.js          — validates params, reads ?path=, reads ?categoryFilter=
       │
       ├─ detect.js         — fetches file tree via GitHub Contents API
       │                      reads .stackfingerprint.json (ignore / pin / labels)
       │                      applies dependency vs devDependency classification
       │                      sets isDevOnly on each signal
       │
       ├─ cardOptions.js    — applies categoryFilter (all / prodonly / top)
       │                      applies ignore / pin from config file
       │
       └─ svgBuilder.js     — renders pills with brand icons (base64 inlined)
                              dims isDevOnly pills at 55% opacity in `all` mode
                              returns image/svg+xml
```

---

## Troubleshooting

### The card shows signals I do not use

Add the signal IDs to the `ignore` list in `.stackfingerprint.json`:

```json
{ "ignore": ["babel", "terraform"] }
```

If the signal is appearing because of a transitive `devDependency`, switching to `categoryFilter=prodonly` will also remove it.

### The card is missing a technology we use

If the technology is not auto-detected, pin it manually:

```json
{ "pin": ["postgres", "redis"] }
```

If it should be auto-detected, [open an issue](https://github.com/mattqdev/stackfingerprint/issues) or [contribute a signal](#adding-a-signal).

### The card includes signals from other sub-projects in our monorepo

Use the `?path=` parameter (or the `path` key in `.stackfingerprint.json`) to restrict the scan to a specific sub-directory.

### The SVG does not render in my README

GitHub proxies external images through Camo. If the external domain is unavailable, the image breaks. The fix is to [use the GitHub Action](#github-action) to commit the SVG locally.

### The GitHub Action fails with "not an SVG"

This usually means the API returned an error page. Check the raw response:

```bash
curl -v "https://stackfingerprint.vercel.app/api/card?repo=OWNER/REPO"
```

Common causes: the repository is private, the repo path is misspelled, or the GitHub API is rate-limiting the server.

---

_Stack Fingerprint is MIT-licensed. Contributions welcome — please open an issue before submitting a PR._
