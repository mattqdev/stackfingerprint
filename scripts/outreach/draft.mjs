// scripts/outreach/draft.mjs
// Turns data/candidates.json into a local review page (data/review.html) with
// a card preview and a personalised issue draft per repo, plus one
// data/<name>-issue.txt per repo with the plain draft body. Sending stays
// manual: each "Open issue" link only pre-fills GitHub's new-issue form.
//
//   node scripts/outreach/draft.mjs [--theme midnight] [--layout classic]
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  CARD_API,
  DATA_DIR,
  WEEKLY_CAP,
  isOctober,
  parseArgs,
  readJSON,
  readLog,
  sentThisWeek,
} from "./lib.mjs";

const args = parseArgs(process.argv.slice(2));
const THEME = args.theme ?? "midnight";
const LAYOUT = args.layout ?? "classic";

const candidates = readJSON("candidates.json", []).filter(
  (c) => c.status === "ok"
);
if (!candidates.length) {
  console.log("No candidates — run find-candidates.mjs first.");
  process.exit(0);
}

const log = readLog();
const sent = sentThisWeek(log);
const warnings = [];
if (isOctober())
  warnings.push(
    "It's October (Hacktoberfest): maintainers are flooded with drive-by issues. Wait until November."
  );
if (sent >= WEEKLY_CAP)
  warnings.push(
    `You already sent ${sent} this week (cap ${WEEKLY_CAP}). Come back in a few days.`
  );

const esc = (s) =>
  String(s ?? "").replace(
    /[&<>"]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]
  );

function draft(c) {
  const preview = `${CARD_API}?repo=${c.repo}&theme=${THEME}&layout=${LAYOUT}`;
  const stackLines = Object.entries(c.stack)
    .map(([cat, techs]) => `- **${cat}**: ${techs.join(", ")}`)
    .join("\n");
  const title = "Idea: a tech-stack card for the README?";
  const body = `Hi! I'm the author of [Stack Fingerprint](https://github.com/mattqdev/stackfingerprint), a small open-source tool that scans a repo and renders an SVG card of its tech stack. Full disclosure: it's my own project, which is why I'm asking in an issue instead of sending a PR.

Since the README already has a nice set of badges, I ran it on \`${c.repo}\` and this is what it detects:

${stackLines}

[![Stack Fingerprint](${preview})](https://stackfingerprint.vercel.app/?repo=${c.repo})

This is just the default look: the card is fully customisable, and you can edit it freely on the website. Open [the builder for ${c.repo}](https://stackfingerprint.vercel.app/?repo=${c.repo}) to change theme, layout, size, icon and pill style, and filter what's shown (e.g. production deps only or top technologies only), all with a live preview; it then gives you the updated snippet to copy. If a detected technology is wrong or you'd rather not show it, a one-line \`ignore\` entry in a \`.stackfingerprint.json\` file hides it ([docs](https://github.com/mattqdev/stackfingerprint/blob/main/Docs.md#configuration-file-stackfingerprintjson)).

If you like it, the simplest setup is just pasting this line into the README, no config or workflow needed:

\`\`\`markdown
[![Stack Fingerprint](${preview})](https://stackfingerprint.vercel.app/?repo=${c.repo})
\`\`\`

If you'd rather not depend on an external service, there's also a [GitHub Action](https://github.com/marketplace/actions/stack-fingerprint) that generates the SVG on your own runners and commits it to the repo:

\`\`\`yaml
- uses: mattqdev/stackfingerprint-action@v1
  with:
    theme: ${THEME}
    layout: ${LAYOUT}
\`\`\`

Happy to open a PR with either option if you're interested. If it's not a fit, just close this, and I won't follow up. Thanks for ${c.repo.split("/")[1]}!`;
  return { title, body, preview };
}

const cards = candidates
  .map((c) => {
    const d = draft(c);
    const newIssue = `https://github.com/${c.repo}/issues/new?title=${encodeURIComponent(d.title)}&body=${encodeURIComponent(d.body)}`;
    return `
<article>
  <header>
    <h2><a href="https://github.com/${esc(c.repo)}" target="_blank">${esc(c.repo)}</a></h2>
    <span>★ ${c.stars} · ${esc(c.language)} · ${c.badges} badges · ${c.techCount} techs</span>
  </header>
  <p class="desc">${esc(c.description)}</p>
  <img src="${esc(d.preview)}" alt="card preview" loading="lazy">
  <p class="check">Before sending: are all detected techs correct? Would <em>you</em> want this card in this README?</p>
  <details><summary>Issue draft</summary><pre>${esc(d.body)}</pre></details>
  <div class="actions">
    <a class="btn" href="${esc(newIssue)}" target="_blank">Open pre-filled issue ↗</a>
    <code>node scripts/outreach/log.mjs ${esc(c.repo)} sent</code>
    <code>node scripts/outreach/log.mjs ${esc(c.repo)} skipped</code>
  </div>
</article>`;
  })
  .join("\n");

const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Outreach review</title>
<style>
:root{--bg:#0b0b0f;--fg:#e8e8f2;--mut:#8a8aa0;--line:#26263a;--acc:#36c600;--warn:#ffb020}
body{margin:0;background:var(--bg);color:var(--fg);font:15px/1.5 system-ui,sans-serif}
main{max-width:880px;margin:0 auto;padding:24px 16px}
h1{font-size:22px;margin:0 0 4px}.sub{color:var(--mut);margin:0 0 20px}
.warn{border:1px solid var(--warn);color:var(--warn);padding:10px 14px;border-radius:8px;margin-bottom:12px}
article{border:1px solid var(--line);border-radius:12px;padding:16px;margin-bottom:16px}
header{display:flex;flex-wrap:wrap;gap:8px;justify-content:space-between;align-items:baseline}
h2{font-size:17px;margin:0}a{color:var(--acc)}header span,.desc,.check{color:var(--mut);font-size:13px}
img{max-width:100%;display:block;margin:12px 0}
pre{white-space:pre-wrap;background:#14141c;padding:12px;border-radius:8px;font-size:12px}
.actions{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.btn{background:var(--acc);color:#000;padding:6px 12px;border-radius:6px;text-decoration:none;font-weight:600}
code{font-size:12px;color:var(--mut)}
</style></head><body><main>
<h1>Outreach review</h1>
<p class="sub">${candidates.length} candidates · sent this week: ${sent}/${WEEKLY_CAP}. Pick at most a few; read each README first.</p>
${warnings.map((w) => `<div class="warn">${esc(w)}</div>`).join("")}
${cards}
</main></body></html>`;

const out = join(DATA_DIR, "review.html");
writeFileSync(out, html);
console.log(`Review page → ${out}`);

// Plain-text copy of each draft, ready to paste into GitHub's issue form.
for (const c of candidates) {
  const txt = join(DATA_DIR, `${c.repo.split("/")[1]}-issue.txt`);
  writeFileSync(txt, draft(c).body + "\n");
  console.log(`Issue draft → ${txt}`);
}
warnings.forEach((w) => console.log(`⚠ ${w}`));
