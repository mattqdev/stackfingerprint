<div align="center">

# 🔍 Stack Fingerprint

**Scan any public GitHub repo and generate a beautiful, embeddable SVG card of its tech stack.**

Zero auth. Zero config. Paste a repo, get a badge.

[![Live Demo](https://img.shields.io/badge/try%20it-stackfingerprint.vercel.app-33ff33?&color=00ba10)](https://stackfingerprint.vercel.app)
[![Deploy with Vercel](https://img.shields.io/badge/deploy-vercel-000?logo=vercel)](https://vercel.com/new/clone?repository-url=https://github.com/mattqdev/stackfingerprint)
[![License: MIT](https://img.shields.io/badge/license-MIT-33ff33)](LICENSE)

---

![Stack Fingerprint card for this repo](https://stackfingerprint.vercel.app/api/card?repo=mattqdev/stackfingerprint&theme=ocean&layout=classic&size=lg&iconStyle=color&pillShape=round)

</div>

---

## What it does

Stack Fingerprint deep-scans any public GitHub repository via the Contents API — reading lockfiles, config files, and directory structures — to detect the frameworks, runtimes, and tooling in use. It then compiles everything into a lightweight SVG card you can pin directly in your README.

- **70+ detection signals** — languages, frameworks, bundlers, test runners, CI, linters, infra
- **5 card layouts** — Classic, Compact, Banner, Tall (grouped), Terminal
- **10 themes** — Midnight, Arctic, Forest, Ember, Ocean, Obsidian, Sakura, Golden, Rose, Nord
- **Real brand icons** — inlined as base64 at render time, fully CSP-safe
- **Shareable URLs** — every config change updates the URL so you can link directly to any setup
- **No auth required** — works on any public repo, no token needed

---

## Quick embed

Add this to your `README.md`:

```markdown
![Stack Fingerprint](https://stackfingerprint.vercel.app/api/card?repo=owner/repo)
```

Or with custom options:

```markdown
![Stack Fingerprint](https://stackfingerprint.vercel.app/api/card?repo=owner/repo&theme=ocean&layout=banner&size=lg)
```

---

## API reference

`GET /api/card`

| Parameter        | Values                                                                                  | Default    |
| ---------------- | --------------------------------------------------------------------------------------- | ---------- |
| `repo`           | `owner/repo`                                                                            | _required_ |
| `theme`          | `midnight` `arctic` `forest` `ember` `ocean` `obsidian` `sakura` `golden` `rose` `nord` | `midnight` |
| `layout`         | `classic` `compact` `banner` `tall` `terminal`                                          | `classic`  |
| `size`           | `sm` `md` `lg` `xl`                                                                     | `md`       |
| `iconStyle`      | `color` `mono` `none`                                                                   | `color`    |
| `pillShape`      | `pill` `round` `square`                                                                 | `round`    |
| `bgDecoration`   | `none` `grid` `dots` `noise` `circuit`                                                  | `grid`     |
| `accentLine`     | `bar` `gradient` `dots` `none`                                                          | `bar`      |
| `categoryFilter` | `all` `core` `devtools` `infra`                                                         | `all`      |
| `df_repoName`    | `0` `1`                                                                                 | `1`        |
| `df_signalCount` | `0` `1`                                                                                 | `1`        |
| `df_footerUrl`   | `0` `1`                                                                                 | `1`        |
| `df_brandLabel`  | `0` `1`                                                                                 | `1`        |

> **Legacy aliases** `icons`, `pills`, `bg`, `accent`, `cats` are still supported for backwards compatibility.

---

## Card layouts

| Layout     | Description                         | Best for                      |
| ---------- | ----------------------------------- | ----------------------------- |
| `classic`  | Header + up to 3 rows of pills      | General use, READMEs          |
| `compact`  | Single row, minimal footprint       | Profile READMEs, tight spaces |
| `banner`   | Wide landscape, 2 pill rows         | Project headers               |
| `tall`     | Portrait, pills grouped by category | Full project pages            |
| `terminal` | Monospace CLI-style text readout    | Developer aesthetic           |

---

## Self-hosting

### Prerequisites

- Node.js 18+
- A Vercel account (or any Next.js-compatible host)

### Run locally

```bash
git clone https://github.com/mattqdev/stackfingerprint.git
cd stackfingerprint
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Deploy to Vercel

```bash
npx vercel
```

Or click the button at the top of this README — zero configuration needed. The project uses Next.js App Router with a single API route; no environment variables are required for basic usage.

---

## Project structure

```
src/
├── app/
│   ├── page.jsx                 # Main UI — repo input, configurator, preview
│   ├── layout.jsx
│   ├── globals.css
│   └── api/card/
│       └── route.js             # /api/card endpoint — detects stack, renders SVG
├── components/
│   ├── RepoInput.jsx            # URL input with quick-pick examples
│   ├── CardConfigurator.jsx     # All card knobs (layout, theme, size, fields…)
│   ├── CardPreview.jsx          # Live SVG preview, copy, and download
│   └── ShieldBadges.jsx         # Repo meta — stars, forks, language, license
├── data/
│   ├── signals.js               # 70+ detection signal definitions
│   ├── themes.js                # 10 colour themes
│   └── cardOptions.js           # Layout, size, style, and field option sets
└── lib/
    ├── github.js                # GitHub Contents API helpers
    ├── detect.js                # Signal matching and stack detection logic
    └── svgBuilder.js            # SVG generation for all 5 layouts
```

---

## How detection works

1. **Fetch** — the GitHub Contents API is called recursively to build a file tree of the target repo (no auth token required for public repos).
2. **Fingerprint** — each file path and name is tested against 70+ signal definitions covering package manifests, lockfiles, config file names, directory patterns, and CI workflow contents.
3. **Rank** — signals are deduplicated and sorted by category priority so the most important technologies appear first.
4. **Render** — the detected stack is passed to the SVG builder, which lays out pills, resolves brand icons from the `simple-icons` package (no external fetch — fully CSP-safe), and returns a self-contained SVG.

---

## Contributing

Contributions are welcome — especially new detection signals. Each signal lives in `src/data/signals.js` and follows a simple schema:

```js
{
  id: "vite",
  label: "Vite",
  category: "build",
  iconSlug: "vite",       // simple-icons slug
  color: "#646CFF",       // pill background
  textColor: "#ffffff",   // pill text / icon colour
  match: {
    files: ["vite.config.ts", "vite.config.js"],
  },
}
```

Please open an issue before submitting large changes.

---

## License

MIT — see [LICENSE](LICENSE).

---

<div align="center">
  <sub>Built by <a href="https://github.com/mattqdev">mattqdev</a> · If this saved you time, a ⭐ goes a long way</sub>
</div>
