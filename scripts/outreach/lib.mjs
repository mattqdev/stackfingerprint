// scripts/outreach/lib.mjs
// Shared helpers for the outreach scripts. Read-only against GitHub: every
// call goes through `gh api` with GET — nothing here opens issues or PRs.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

export const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), "data");
export const CARD_API = "https://stackfingerprint.vercel.app/api/card";
export const WEEKLY_CAP = 3;

mkdirSync(DATA_DIR, { recursive: true });

export function gh(path) {
  const out = execFileSync("gh", ["api", "-X", "GET", path], {
    encoding: "utf8",
    maxBuffer: 32 * 1024 * 1024,
  });
  return JSON.parse(out);
}

export function ghText(path) {
  try {
    return execFileSync(
      "gh",
      ["api", "-X", "GET", "-H", "Accept: application/vnd.github.raw", path],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }
    );
  } catch {
    return null;
  }
}

export function readJSON(name, fallback) {
  const p = join(DATA_DIR, name);
  return existsSync(p) ? JSON.parse(readFileSync(p, "utf8")) : fallback;
}

export function writeJSON(name, value) {
  writeFileSync(join(DATA_DIR, name), JSON.stringify(value, null, 2));
}

// log.json: [{ repo, status: "sent" | "skipped" | "accepted" | "declined", date }]
export const readLog = () => readJSON("log.json", []);

export function sentThisWeek(log) {
  const weekAgo = Date.now() - 7 * 24 * 3600 * 1000;
  return log.filter((e) => e.status === "sent" && Date.parse(e.date) > weekAgo)
    .length;
}

// Hacktoberfest month: maintainers are flooded with low-effort PRs/issues.
export const isOctober = () => new Date().getMonth() === 9;

export function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith("--")) continue;
    const next = argv[i + 1];
    args[a.slice(2)] = next && !next.startsWith("--") ? argv[++i] : true;
  }
  return args;
}
