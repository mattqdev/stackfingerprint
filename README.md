<div align="center">

# 🔍 Stack Fingerprint

**Scan any public GitHub repo and generate a beautiful, embeddable SVG card of its tech stack.**

Zero auth. Zero config. Paste a repo, get a badge.

[![Live Demo](https://img.shields.io/badge/try%20it-stackfingerprint.vercel.app-33ff33?&color=00ba10)](https://stackfingerprint.vercel.app)
[![Stars](https://img.shields.io/github/stars/mattqdev/stackfingerprint?style=social)](https://github.com/mattqdev/stackfingerprint)
[![Deploy with Vercel](https://img.shields.io/badge/deploy-vercel-000?logo=vercel)](https://vercel.com/new/clone?repository-url=https://github.com/mattqdev/stackfingerprint)
[![License: MIT](https://img.shields.io/badge/license-MIT-33ff33)](LICENSE)

---

![Stack Fingerprint card for this repo](https://stackfingerprint.vercel.app/api/card?repo=mattqdev/stackfingerprint&theme=ocean&layout=classic&size=lg&iconStyle=color&pillShape=round)

</div>

---

## ✨ Design Your Card Visually

While we offer a robust API, you don't need to touch a line of code to get the perfect look. Our **Interactive Visual Builder** lets you customize your fingerprint in real-time:

- **Real-time Preview:** See changes instantly as you toggle themes and layouts.
- **10+ Designer Themes:** From the deep tones of `Obsidian` to the vibrant `Sakura`.
- **5 Distinct Layouts:** Choose a `Terminal` look for dev tools or a `Banner` for project headers.
- **One-Click Copy:** Once you've perfected your design, grab the Markdown or HTML snippet and drop it straight into your README.

[**Try the Visual Builder →**](https://stackfingerprint.vercel.app)

---

## 🚀 How it works

Stack Fingerprint deep-scans any public GitHub repository via the Contents API — reading lockfiles, config files, and directory structures — to detect the frameworks, runtimes, and tooling in use.

- **70+ detection signals** — languages, frameworks, bundlers, test runners, CI, linters, infra.
- **Real brand icons** — inlined as base64 at render time, fully CSP-safe.
- **Zero Configuration** — No tokens, no environment variables, no friction.

---

## 🛠 Contributing & Support

This project thrives on community input! Whether you're a designer or a dev, there's a place for you here.

### Help us grow the Fingerprint Database

Is your favorite framework missing? Adding a new detection signal is as easy as adding a JSON object to `src/data/signals.js`:

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

Please open an issue before submitting large changes.

---

## License

MIT — see [LICENSE](LICENSE).

---

<div align="center">
  <sub>Built by <a href="https://github.com/mattqdev">mattqdev</a> · If this saved you time, a ⭐ goes a long way</sub>
</div>
