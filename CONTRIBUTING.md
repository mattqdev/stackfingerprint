# Contributing to Stack Fingerprint

First off — thanks for taking the time. Stack Fingerprint is a small open-source tool and every contribution matters, whether it's a new detection signal, a bug fix, a new theme, or just a typo correction.

This document covers everything you need to know to contribute effectively.

---

## Table of contents

- [Code of conduct](#code-of-conduct)
- [Getting started](#getting-started)
- [Project architecture](#project-architecture)
- [Types of contributions](#types-of-contributions)
  - [Adding detection signals](#adding-detection-signals)
  - [Adding a theme](#adding-a-theme)
  - [Adding a card layout](#adding-a-card-layout)
  - [Bug fixes](#bug-fixes)
  - [Documentation](#documentation)
- [Development workflow](#development-workflow)
- [Coding conventions](#coding-conventions)
- [Submitting a pull request](#submitting-a-pull-request)
- [Reporting bugs](#reporting-bugs)
- [Requesting features](#requesting-features)

---

## Code of conduct

Be kind. Be constructive. This project follows a simple rule: treat contributors the way you'd want to be treated. Issues or PRs that are dismissive, aggressive, or off-topic will be closed without discussion.

---

## Getting started

### Prerequisites

- **Node.js 18+** — the project uses the Next.js App Router with server components
- **npm** — used for package management
- **Git** — obviously

### Local setup

```bash
# 1. Fork the repo on GitHub, then clone your fork
git clone https://github.com/<your-username>/stackfingerprint.git
cd stackfingerprint

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The app runs fully locally — no environment variables or API tokens are required for public repository scans.

### Useful scripts

| Command         | Description                                     |
| --------------- | ----------------------------------------------- |
| `npm run dev`   | Start the Next.js dev server with hot reload    |
| `npm run build` | Production build — run this before opening a PR |
| `npm run lint`  | ESLint check                                    |
| `npm run start` | Serve the production build locally              |

---

## Project architecture

Understanding how the pieces fit together will help you figure out exactly which file to touch.

```
src/
├── app/
│   ├── page.jsx                 # Main UI page — orchestrates all components
│   ├── layout.jsx               # Root layout, fonts, metadata
│   ├── globals.css
│   └── api/card/
│       └── route.js             # GET /api/card — runs detection, renders SVG
│
├── components/
│   ├── RepoInput.jsx            # Repo URL input field + example quick-picks
│   ├── CardConfigurator.jsx     # All card knobs (layout, theme, size, fields)
│   ├── CardPreview.jsx          # Live SVG preview + copy/download actions
│   └── ShieldBadges.jsx         # Repo meta badges (stars, forks, language…)
│
├── data/
│   ├── signals.js               # ← THE MOST COMMON CONTRIBUTION TARGET
│   │                            #   All 70+ tech detection signal definitions
│   ├── themes.js                # 10 card colour themes
│   └── cardOptions.js           # Layout, size, style, and field option sets
│
└── lib/
    ├── github.js                # GitHub Contents API — fetchContents, fetchRepoMeta
    ├── detect.js                # Signal matching engine — runs signals against file tree
    └── svgBuilder.js            # SVG generation — 5 layout renderers + shared wrapper
```

### Data flow

```
User enters repo URL
      │
      ▼
github.js → fetchContents()
  Fetches the repo file tree recursively via GitHub Contents API (no auth needed)
      │
      ▼
detect.js → detectStack()
  Tests each file path against every signal definition in signals.js
  Returns an array of matched tech objects, ranked by category priority
      │
      ├──▶ (browser) svgBuilder.js → buildSVG()
      │      Uses CDN URLs for icons in the live preview
      │
      └──▶ (API route) route.js
             Resolves icons from the simple-icons npm package (no external fetch)
             → svgBuilder.js → buildSVG(stack, cfg, iconBase64Map)
             Returns a fully self-contained SVG (no external URLs — CSP-safe)
```

### Why two icon paths?

The browser preview uses `https://cdn.simpleicons.org` URLs directly inside the SVG — this works fine in the browser. The `/api/card` endpoint must produce a self-contained SVG because when the card is embedded in a GitHub README, it passes through GitHub's Camo image proxy, which enforces a strict `img-src data:` CSP that blocks any external `<image>` tag. To solve this, the API route imports the `simple-icons` npm package and converts each icon to a base64 `data:` URI server-side before building the SVG.

---

## Types of contributions

### Adding detection signals

This is the most impactful and most welcome contribution. Every new signal means the tool can detect one more technology.

#### Signal schema

Every signal lives in `src/data/signals.js` as an object in the exported array:

```js
{
  // Unique identifier — lowercase, no spaces
  id: "vitest",

  // Display label shown on the pill
  label: "Vitest",

  // Category — determines grouping in tall/terminal layouts and filter options
  // Valid values: lang, framework, runtime, build, pkgmgr, db, testing, cicd, infra, lint
  category: "testing",

  // simple-icons slug — find it at https://simpleicons.org (search → copy slug from URL)
  // Set to null if the tech has no simple-icons entry
  iconSlug: "vitest",

  // Pill background colour — use the brand's official hex when possible
  color: "#6E9F18",

  // Text and icon colour — use "#ffffff" or "#000000" for contrast
  // Rule of thumb: dark background → white text, light background → black text
  textColor: "#ffffff",

  // Detection rules — at least one of `files`, `deps`, or `dirs` is required
  match: {
    // File names or glob-style paths that indicate this tech is present
    // Matched against the full relative path from the repo root
    files: ["vitest.config.ts", "vitest.config.js", "vitest.config.mts"],

    // Keys to look for in package.json `dependencies` or `devDependencies`
    deps: ["vitest"],

    // Directory names — matched if a directory with this name exists at the root
    dirs: [],
  },
}
```

#### Match rules in detail

The detection engine in `detect.js` applies the following logic:

- **`files`** — checks whether any file in the repo's full file tree has a path that ends with or contains the specified string. `"vite.config.ts"` matches `./vite.config.ts` and `packages/app/vite.config.ts`.
- **`deps`** — checks `package.json` `dependencies`, `devDependencies`, and `peerDependencies`. The engine fetches and parses `package.json` if it exists in the root.
- **`dirs`** — checks whether a directory with that exact name exists at the repository root.

All specified match conditions are evaluated independently — a signal matches if **any one of them** is satisfied (OR logic, not AND).

#### Signal writing guidelines

- **Be specific.** `"jest.config.js"` is better than `"config.js"`. The more specific the match, the fewer false positives.
- **Cover all variants.** If a config file can be `.js`, `.ts`, `.mjs`, or `.cjs`, include all of them in `files`.
- **Use the official brand colour.** Check [brandcolors.net](https://brandcolors.net) or the tech's own design system. This makes the card look professional.
- **Contrast matters.** A pill with `color: "#FFDD57"` (yellow) needs `textColor: "#000000"` to be readable. If the hex is light (luminance > 0.4), use black text; otherwise use white.
- **Use the right category.** If something spans multiple categories (e.g. Supabase is a DB and an infra platform), pick the most specific one.
- **Don't duplicate.** Check that the technology isn't already defined before adding it.

#### Step-by-step

1. Find the `simple-icons` slug for your technology: go to [simpleicons.org](https://simpleicons.org), search for the icon, and copy the slug from the URL (e.g. `nextdotjs` for Next.js).
2. Add your signal object to `src/data/signals.js`. Place it near other signals in the same category for readability.
3. Run `npm run dev` and scan a repo that you know uses the technology to verify it's detected.
4. Check that the icon renders correctly in the browser preview.
5. Check that the pill text is readable against the background colour.
6. Open a PR with a brief description of what you added and which repo you tested against.

---

### Adding a theme

Themes live in `src/data/themes.js`. Each theme is a key/value pair where the key becomes the `?theme=` parameter value.

#### Theme schema

```js
export const THEMES = {
  // ...existing themes...

  aurora: {
    // Display name shown in the UI theme picker
    label: "Aurora",

    // Card background — two colours form a diagonal gradient (bg1 → bg2)
    bg1: "#0d1b2a",
    bg2: "#1b2d40",

    // Subtle top-of-card shimmer overlay colour (usually bg1 with low opacity)
    shimmer: "rgba(100,200,255,0.04)",

    // Card border colour
    border: "rgba(100,200,255,0.15)",

    // Accent colour — used for the accent line, mono icon fills, and highlights
    accent: "#64c8ff",

    // repo owner text colour
    owner: "rgba(100,200,255,0.7)",

    // slash between owner/repo
    slash: "rgba(255,255,255,0.2)",

    // repo name text colour
    title: "#ffffff",

    // Subtitle / signal count text
    sub: "rgba(100,200,255,0.45)",

    // Footer and muted text
    muted: "rgba(100,200,255,0.25)",
  },
};
```

#### Theme guidelines

- **Dark backgrounds only.** The card is designed for dark themes — all existing themes use dark backgrounds. Light themes would require significant changes to text contrast throughout `svgBuilder.js`.
- **Keep `bg1` and `bg2` close in value.** A very high-contrast gradient looks garish. Subtle is better.
- **The `accent` colour is the personality of the theme.** It appears on the accent line, in mono icon fills, and in the UI configurator. Make it distinctive but not neon-harsh.
- **Test all five layouts.** Some layouts surface different theme properties. The Terminal layout heavily uses `sub` and `title`; the Tall layout uses `sub` for category labels.
- **Test all icon styles.** With `iconStyle=mono`, icons are filled with the `accent` colour on a white background — make sure it still looks good.

---

### Adding a card layout

Layouts are the most complex contribution and require changes in multiple files. Before starting, open an issue to discuss the layout so we can align on the design before you invest the time.

Files to touch:

- `src/data/cardOptions.js` — add the layout definition to `LAYOUTS`
- `src/lib/svgBuilder.js` — add a `build<Name>()` function and wire it up in `buildSVG()`

Study the existing layouts (`buildClassic`, `buildCompact`, `buildBanner`, `buildTall`, `buildTerminal`) in `svgBuilder.js` before starting. All layouts must:

1. Call `getSafeScale()` to get a valid numeric scale from the size config
2. Pass `iconBase64Map` through to `renderPill()` so server-side icon inlining works
3. Return the result of `buildWrapper()` — never build the outer SVG shell manually
4. Respect all `cfg.dataFields` toggles (`repoName`, `signalCount`, `footerUrl`, `brandLabel`)

---

### Bug fixes

If you've found a bug:

1. Check the [open issues](https://github.com/mattqdev/stackfingerprint/issues) to see if it's already reported.
2. If not, open an issue describing the bug, the repo URL that triggers it, and what you expected to see vs. what actually happened.
3. If you want to fix it yourself, comment on the issue first so nobody duplicates effort.

For small, obvious fixes (typos, off-by-one errors, broken links) you can open a PR directly without an issue.

---

### Documentation

Improvements to `README.md`, `CONTRIBUTING.md`, or inline code comments are always welcome. For documentation-only changes, open a PR directly — no issue needed.

---

## Development workflow

### Branch naming

```
signal/add-<technology-name>    # e.g. signal/add-bun
theme/add-<theme-name>          # e.g. theme/add-aurora
fix/<short-description>         # e.g. fix/tall-layout-overflow
feat/<short-description>        # e.g. feat/png-export
docs/<short-description>        # e.g. docs/update-api-table
```

### Commit messages

Use plain, descriptive commit messages in the imperative mood:

```
# Good
add vitest detection signal
fix pill overflow in tall layout for long repo names
add aurora theme

# Avoid
added vitest
fixed a bug
WIP
```

### Before opening a PR

```bash
# Make sure the build passes
npm run build

# Lint
npm run lint

# Test your change manually
npm run dev
# → scan a real repo that exercises the code path you changed
# → check all 5 layouts
# → check all 3 icon styles if you touched SVG generation
```

---

## Coding conventions

- **JavaScript, not TypeScript** — the project is intentionally plain JS with JSDoc where needed. Don't convert files to TypeScript in a PR.
- **No CSS-in-JS libraries** — styles are written as inline `style` objects in React components. This keeps the bundle small and the code portable.
- **No new dependencies without discussion** — open an issue first if your contribution requires a new npm package.
- **SVG strings are template literals** — `svgBuilder.js` builds SVG by string interpolation, not a virtual DOM. Keep it that way; it's intentional for performance and portability.
- **Always sanitise user input in SVG** — all user-controlled strings (owner, repo, labels) must be passed through the `esc()` helper before being interpolated into SVG to prevent injection.

---

## Submitting a pull request

1. **Fork** the repo and create your branch from `main`.
2. **Make your changes** following the guidelines above.
3. **Run `npm run build`** — PRs that fail to build will not be reviewed.
4. **Open the PR** against `main` with:
   - A clear title (`add vitest detection signal`, `fix banner layout pill clipping`, etc.)
   - A brief description of what changed and why
   - For signal additions: the name of a real public repo you tested against
   - For visual changes: a screenshot or the API URL that shows the result
5. **Be responsive** — if a reviewer asks for changes, please respond within a reasonable time.

PRs that are too large to review in one sitting will be asked to be split up.

---

## Reporting bugs

Open an issue and include:

- **The repo URL** you scanned (or `?repo=owner/repo` param)
- **The full API URL** if it's a rendering bug (e.g. `https://stackfingerprint.vercel.app/api/card?repo=...&theme=...`)
- **What you expected** to see
- **What you actually saw** — screenshot or error message
- **Browser + OS** for UI bugs

---

## Requesting features

Open an issue with the `feature request` label. Describe:

- What you want the tool to do
- Why it's useful (what problem it solves)
- Any implementation ideas you have

Feature requests for things that are fundamentally out of scope (e.g. private repo support, user accounts, storing scan history) will be closed — Stack Fingerprint is intentionally a stateless, zero-auth tool.

---

## Questions?

Open an issue with the `question` label or start a GitHub Discussion. Don't DM maintainers directly for support questions — keeping things public means the answer helps everyone.

---

<div align="center">
  <sub>Thanks for contributing — you're helping developers showcase their work better.</sub>
</div>
