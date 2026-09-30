// scripts/outreach/find-candidates.mjs
// Finds repos whose maintainers visibly like README badges and whose card
// would actually look good. Writes data/candidates.json. Read-only.
//
//   node scripts/outreach/find-candidates.mjs [--query "topic:cli language:go"]
//     [--limit 30] [--min-stars 200] [--max-stars 5000] [--min-techs 4]
import {
  CARD_API,
  gh,
  ghText,
  parseArgs,
  readJSON,
  readLog,
  writeJSON,
} from "./lib.mjs";

const args = parseArgs(process.argv.slice(2));
const LIMIT = Number(args.limit ?? 30);
const MIN_STARS = Number(args["min-stars"] ?? 200);
const MAX_STARS = Number(args["max-stars"] ?? 5000);
const MIN_TECHS = Number(args["min-techs"] ?? 4);
const MIN_BADGES = 3;

const BADGE_RE =
  /(img\.shields\.io|badgen\.net|badge\.fury\.io|\/badge\.svg|\/badges?\/|codecov\.io\/.+\/graph)/gi;
// CONTRIBUTING wording that means "don't send me promotional stuff".
const NO_PROMO_RE =
  /(unsolicited|self[- ]promotion|promotional|advertis|no spam|do not (open|submit) (issues|prs|pull requests) (for|to) (add|promot))/i;

const pushedSince = new Date(Date.now() - 60 * 24 * 3600 * 1000)
  .toISOString()
  .slice(0, 10);
const q = [
  `stars:${MIN_STARS}..${MAX_STARS}`,
  `pushed:>${pushedSince}`,
  "archived:false",
  "fork:false",
  args.query ?? "",
]
  .filter(Boolean)
  .join(" ");

const contacted = new Set(readLog().map((e) => e.repo.toLowerCase()));
// Every repo evaluated by a previous run (ok or rejected) is skipped, so each
// run surfaces fresh candidates instead of re-listing the same ones.
const seen = readJSON("seen.json", []);
for (const c of readJSON("candidates.json", [])) seen.push(c.repo);
const alreadySeen = new Set(seen.map((r) => r.toLowerCase()));

function parseTerminalCard(svg) {
  const stack = {};
  const re =
    /<tspan fill="[^"]*">([A-Za-z/ .-]+?)\s*<\/tspan>\s*<tspan[^>]*dx="4">([^<]+)<\/tspan>/g;
  for (const [, cat, techs] of svg.matchAll(re)) {
    stack[cat.trim()] = techs.split(",").map((t) => t.trim());
  }
  return stack;
}

async function checkCard(repo) {
  const res = await fetch(
    `${CARD_API}?repo=${repo}&layout=terminal&categoryFilter=all`
  );
  if (!res.ok) return { ok: false, reason: `card API ${res.status}` };
  const stack = parseTerminalCard(await res.text());
  const techCount = Object.values(stack).flat().length;
  // Lots of languages usually means test fixtures/examples: a noisy card.
  const langs = stack.Language?.length ?? 0;
  if (langs > 6)
    return {
      ok: false,
      stack,
      techCount,
      reason: `${langs} languages (fixtures?)`,
    };
  return techCount >= MIN_TECHS
    ? { ok: true, stack, techCount }
    : { ok: false, stack, techCount, reason: `only ${techCount} techs` };
}

function contributingForbidsPromo(repo) {
  for (const p of [
    "CONTRIBUTING.md",
    ".github/CONTRIBUTING.md",
    "docs/CONTRIBUTING.md",
  ]) {
    const text = ghText(`repos/${repo}/contents/${p}`);
    if (text) return NO_PROMO_RE.test(text);
  }
  return false;
}

console.log(`search: ${q}`);
const found = gh(
  `search/repositories?q=${encodeURIComponent(q)}&sort=updated&per_page=100`
).items;

const candidates = [];
for (const r of found) {
  if (candidates.filter((c) => c.status === "ok").length >= LIMIT) break;
  const repo = r.full_name;
  const base = {
    repo,
    stars: r.stargazers_count,
    description: r.description,
    language: r.language,
  };
  const reject = (reason) => {
    candidates.push({ ...base, status: "rejected", reason });
    console.log(`  ✗ ${repo} — ${reason}`);
  };

  if (contacted.has(repo.toLowerCase()) || alreadySeen.has(repo.toLowerCase()))
    continue;
  if (!r.has_issues) {
    reject("issues disabled");
    continue;
  }
  const readme = ghText(`repos/${repo}/readme`);
  if (!readme) {
    reject("no README");
    continue;
  }
  if (/stackfingerprint|stack-fingerprint/i.test(readme)) {
    reject("already uses Stack Fingerprint");
    continue;
  }
  const badges = (readme.match(BADGE_RE) ?? []).length;
  if (badges < MIN_BADGES) {
    reject(`${badges} badges`);
    continue;
  }
  if (contributingForbidsPromo(repo)) {
    reject("CONTRIBUTING discourages promotional issues");
    continue;
  }
  const card = await checkCard(repo);
  if (!card.ok) {
    reject(card.reason);
    continue;
  }
  candidates.push({ ...base, badges, ...card, status: "ok" });
  console.log(`  ✓ ${repo} — ${badges} badges, ${card.techCount} techs`);
}

writeJSON("candidates.json", candidates);
writeJSON("seen.json", [...new Set([...seen, ...candidates.map((c) => c.repo)])]);
const ok = candidates.filter((c) => c.status === "ok").length;
console.log(`\n${ok} good candidates → scripts/outreach/data/candidates.json`);
console.log("Next: node scripts/outreach/draft.mjs");
