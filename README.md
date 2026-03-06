# Stack Fingerprint

Detect any GitHub repository's tech stack and generate a beautiful, embeddable SVG card.

# Example Card

![Stack Fingerprint](https://stackfingerprint.vercel.app/api/card?repo=mattqdev/stackfingerprint&theme=ocean&layout=classic&size=md&icons=color&pills=round)

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deploy to Vercel

```bash
npx vercel
```

Or connect the repo in the Vercel dashboard — zero config needed.

## Embed in a README

```markdown
![Stack Fingerprint](https://stackfingerprint.vercel.app/api/card?repo=owner/repo)
```

### API parameters

| Param    | Values                                                                       | Default    |
| -------- | ---------------------------------------------------------------------------- | ---------- |
| `repo`   | `owner/repo`                                                                 | _required_ |
| `theme`  | midnight, arctic, forest, ember, ocean, obsidian, sakura, golden, rose, nord | midnight   |
| `layout` | classic, compact, banner, tall, terminal                                     | classic    |
| `size`   | sm, md, lg, xl                                                               | md         |
| `icons`  | color, mono, none                                                            | color      |
| `pills`  | pill, round, square                                                          | pill       |
| `bg`     | none, grid, dots, noise, circuit                                             | none       |
| `accent` | bar, gradient, dots, none                                                    | bar        |
| `cats`   | all, core, devtools, infra                                                   | all        |

## Project structure

```
src/
├── app/
│   ├── page.jsx              # Main page (clean orchestrator)
│   ├── layout.jsx
│   ├── globals.css
│   └── api/card/route.js     # SVG embed API route
├── components/
│   ├── RepoInput.jsx         # URL input + quick-pick examples
│   ├── CardConfigurator.jsx  # All card options (layout, theme, etc.)
│   ├── CardPreview.jsx       # SVG preview + copy/download actions
│   └── ShieldBadges.jsx      # Repo meta shields (stars, forks, etc.)
├── data/
│   ├── signals.js            # 70+ tech detection signals
│   ├── themes.js             # 10 card color themes
│   └── cardOptions.js        # All layout/style/field options
└── lib/
    ├── github.js             # GitHub API helpers
    ├── detect.js             # Stack detection logic
    └── svgBuilder.js         # SVG card generation (5 layouts)
```
