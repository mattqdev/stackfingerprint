# 🔍 Stack Fingerprint

**Scan any public GitHub repo and generate a beautiful, embeddable SVG card of its tech stack.**

Zero auth. Zero config. Paste a repo, get a badge.

[![Live Demo](https://img.shields.io/badge/try%20it-stackfingerprint.vercel.app-33ff33?&color=00ba10)](https://stackfingerprint.vercel.app)
[![Stars](https://img.shields.io/github/stars/mattqdev/stackfingerprint?style=social)](https://github.com/mattqdev/stackfingerprint)
[![Deploy with Vercel](https://img.shields.io/badge/deploy-vercel-000?logo=vercel)](https://vercel.com/new/clone?repository-url=https://github.com/mattqdev/stackfingerprint)
[![License: MIT](https://img.shields.io/badge/license-MIT-33ff33)](https://github.com/mattqdev/stackfingerprint/blob/main/LICENSE)

> ⚠️ **Self-hosting recommended for production use.** See [Supply-chain safety](#-supply-chain-safety--self-hosting) below.

---

![Stack Fingerprint card for this repo](./assets/stack-fingerprint.svg)

---

## ✨ Design Your Card Visually

You don't need to touch a line of code to get the perfect look. The **Interactive Visual Builder** lets you customise your fingerprint in real-time:

- **Real-time preview** — see changes instantly as you toggle themes and layouts
- **10+ designer themes** — from the deep tones of `Obsidian` to the vibrant `Sakura`
- **5 distinct layouts** — choose `Terminal` for dev tools or `Banner` for project headers
- **One-click copy** — grab the Markdown or HTML snippet and drop it straight into your README

[**Try the Visual Builder →**](https://stackfingerprint.vercel.app)

---

## 🚀 How it works

Stack Fingerprint deep-scans any public GitHub repository via the Contents API — reading lockfiles, config files, and directory structures — to detect the frameworks, runtimes, and tooling in use.

- **70+ detection signals** — languages, frameworks, bundlers, test runners, CI, linters, infra
- **Real brand icons** — inlined as base64 at render time, fully CSP-safe
- **Zero configuration** — no tokens, no environment variables, no friction
- **Dev vs prod awareness** — signals detected in `devDependencies` are flagged and visually dimmed so your production stack stays front and centre

---

## 🛡 Supply-chain safety & self-hosting

Embedding an image from a third-party domain (`stackfingerprint.vercel.app`) in a high-profile README introduces supply-chain risk: the domain owner can change what the URL serves at any time. **The recommended approach is to commit the SVG directly to your repository so it is served from GitHub's own CDN.**

The easiest way to do this is with the included GitHub Action.

### GitHub Action (recommended)

Drop `.github/workflows/stack-fingerprint.yml` into your repo:

```yaml
name: Update Stack Fingerprint

on:
  push:
    branches: [main]
  schedule:
    - cron: "0 3 * * 1" # weekly on Monday at 03:00 UTC
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

Then reference the committed file in your README:

```markdown
![Stack Fingerprint](./assets/stack-fingerprint.svg)
```

The SVG is now served from `raw.githubusercontent.com` — GitHub's own CDN — with no runtime dependency on `stackfingerprint.vercel.app`.

### Deploy your own instance

For complete control, deploy a private instance in one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/mattqdev/stackfingerprint)

Point the Action's `URL` at your own domain and you own the entire pipeline.

---

## 📄 Quick embed (no Action required)

If you just want to try it without setting up the Action, paste this into your README:

```markdown
![Stack Fingerprint](https://stackfingerprint.vercel.app/api/card?repo=OWNER/REPO)
```

Customise with query parameters (see [API reference](./DOCS.md#api-reference)):

```markdown
![Stack Fingerprint](https://stackfingerprint.vercel.app/api/card?repo=vercel/next.js&theme=ocean&layout=classic&size=lg&categoryFilter=prodonly)
```

---

## ⚙️ Configuration file

Drop a `.stackfingerprint.json` file at your repo root (or at the sub-path you are scanning) to tune detection without touching any API parameter:

```json
{
  "ignore": ["babel", "webpack", "terraform"],
  "pin": ["nextjs", "typescript"],
  "labels": { "nextjs": "Next.js 14" },
  "path": "apps/web"
}
```

| Key      | Type       | Description                                                                  |
| -------- | ---------- | ---------------------------------------------------------------------------- |
| `ignore` | `string[]` | Signal IDs to suppress from the card, even if detected                       |
| `pin`    | `string[]` | Signal IDs to always show, even if not auto-detected                         |
| `labels` | `object`   | Override the display label for any signal ID                                 |
| `path`   | `string`   | Default sub-path for monorepo scans (overridden by the `?path=` query param) |

See [DOCS.md → Configuration file](./DOCS.md#configuration-file-stackfingerprintjson) for the full schema.

---

## 🏗 Monorepo support

For monorepos, add `?path=apps/web` to scan a sub-directory instead of the repository root:

```markdown
![Stack Fingerprint](https://stackfingerprint.vercel.app/api/card?repo=myorg/monorepo&path=apps/web)
```

The `path` parameter is also accepted by the GitHub Action as a `workflow_dispatch` input and as a key in `.stackfingerprint.json`.

---

## 🎨 Card options at a glance

| Parameter        | Values                                            | Default   | Description                             |
| ---------------- | ------------------------------------------------- | --------- | --------------------------------------- |
| `repo`           | `owner/repo`                                      | —         | **Required.** GitHub repository to scan |
| `theme`          | See [themes](./DOCS.md#themes)                    | `ocean`   | Visual colour theme                     |
| `layout`         | `classic` `compact` `minimal` `terminal` `banner` | `classic` | Card layout                             |
| `size`           | `sm` `md` `lg`                                    | `md`      | Card size                               |
| `iconStyle`      | `color` `mono` `outline`                          | `color`   | Icon rendering style                    |
| `pillShape`      | `round` `square`                                  | `round`   | Shape of tech pills                     |
| `categoryFilter` | `all` `prodonly` `top`                            | `all`     | Signal filter (see below)               |
| `path`           | `apps/web` etc.                                   | _(root)_  | Monorepo sub-path                       |

### `categoryFilter` options

| Value      | What it shows                                                                            |
| ---------- | ---------------------------------------------------------------------------------------- |
| `all`      | Every detected signal; dev-only signals are dimmed at 55 % opacity                       |
| `prodonly` | Production signals only — all `devDependencies`-sourced signals are hidden               |
| `top`      | Only `lang` + `framework` categories, capped at 5 signals — the minimal meaningful badge |

---

## 🐛 Known issues addressed

The table below maps the community feedback that shaped these features to the fix that was shipped:

| #   | Problem                                                                                                | Root cause                                                 | Fix                                                                                                                                                                        |
| --- | ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Supply-chain risk** — README embeds an SVG from an uncontrolled third-party domain                   | Image served at runtime from `stackfingerprint.vercel.app` | GitHub Action that fetches & commits the SVG to the repo; README then uses a relative path served from GitHub CDN                                                          |
| 2   | **False positives** — build tools, linters, and test frameworks appear alongside the production stack  | `detect.js` treated all dependencies equally               | `devDependencies` vs `dependencies` awareness; 30+ signals hard-coded as inherently dev-only; `isDevOnly` flag + visual dimming; `ignore` list in `.stackfingerprint.json` |
| 3   | **Monorepo noise** — full-repo scan surfaces signals from unrelated sub-projects                       | API always scanned from the repository root                | `?path=` query parameter scans a specific sub-directory; supported in the Action and in `.stackfingerprint.json`                                                           |
| 4   | **Information overload** — long signal lists discourage contributors and misrepresent the actual stack | No filtering beyond categories                             | `categoryFilter=prodonly` hides all dev signals; `categoryFilter=top` shows only `lang` + `framework`, capped at 5; dev-only signals visually dimmed even in `all` mode    |

---

## 🛠 Contributing & support

This project thrives on community input. Before opening a pull request, **please open an issue first** so we can discuss the goal and make sure it is a good fit.

### Help grow the signal database

Is your favourite framework missing? Adding a new detection signal is as easy as adding a JSON object to `src/data/signals.js`:

```js
{
  id: "astro",
  label: "Astro",
  category: "framework",
  iconSlug: "astro",
  color: "#FF5D01",
  match: {
    files: ["astro.config.mjs", "astro.config.js"],
  },
}
```

See [DOCS.md → Adding a signal](./DOCS.md#adding-a-signal) for the full signal schema.

---

## License

MIT — see [LICENSE](./LICENSE).

---

Built by [mattqdev](https://github.com/mattqdev) · If this saved you time, a ⭐ goes a long way.
