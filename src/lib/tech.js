// src/lib/tech.js
// Data for the /tech pages, derived from the detection signals so the pages
// always describe what the scanner actually does.
import { SIGNALS, EXT_LANGS, CATEGORY_META } from "../data/signals";
import {
  DEP_SIGNALS,
  PYTHON_DEP_SIGNALS,
  RUBY_DEP_SIGNALS,
  PHP_DEP_SIGNALS,
} from "./detect";
import { TECH_CONTENT } from "../data/techContent.mjs";

// Duplicates of another page (same technology, different detection path).
const SKIP = new Set(["vue-lang"]);

const DEP_SOURCES = [
  ["package.json", DEP_SIGNALS],
  ["Python (requirements.txt / pyproject.toml)", PYTHON_DEP_SIGNALS],
  ["Gemfile", RUBY_DEP_SIGNALS],
  ["composer.json", PHP_DEP_SIGNALS],
];

// File patterns a signal looks for, read from its check() source: regex and
// string literals survive minification, the surrounding code doesn't matter.
function filePatterns(check) {
  if (!check) return [];
  const src = check.toString();
  const out = new Set();
  for (const m of src.matchAll(/\/((?:\\.|[^/\n])+)\/[gimsuy]*\.test/g))
    out.add(`/${m[1]}/`);
  for (const m of src.matchAll(/["'`]([^"'`\n]+)["'`]/g)) out.add(m[1]);
  return [...out];
}

function build() {
  const byId = new Map();
  for (const s of SIGNALS) {
    if (SKIP.has(s.id)) continue;
    byId.set(s.id, { ...s, patterns: filePatterns(s.check), exts: [] });
  }
  for (const l of EXT_LANGS) {
    if (SKIP.has(l.id)) continue;
    const prev = byId.get(l.id);
    if (prev) prev.exts = l.exts;
    else byId.set(l.id, { ...l, patterns: [], exts: l.exts });
  }
  for (const t of byId.values()) {
    t.deps = DEP_SOURCES.map(([source, map]) => ({
      source,
      names: Object.keys(map).filter((dep) => map[dep] === t.id),
    })).filter((d) => d.names.length);
    t.content = TECH_CONTENT[t.id] ?? null;
    t.indexable = Boolean(t.content);
    t.categoryLabel = CATEGORY_META[t.category]?.label ?? "Other";
    delete t.check;
  }
  return [...byId.values()];
}

let all = null;

export function getAllTechs() {
  return (all ??= build());
}

export function getTech(id) {
  return getAllTechs().find((t) => t.id === id) ?? null;
}

/** [{ id, label, order, techs }] in CATEGORY_META order. */
export function getTechsByCategory() {
  const groups = new Map();
  for (const t of getAllTechs()) {
    if (!groups.has(t.category)) groups.set(t.category, []);
    groups.get(t.category).push(t);
  }
  return [...groups]
    .map(([id, techs]) => ({
      id,
      label: CATEGORY_META[id]?.label ?? "Other",
      order: CATEGORY_META[id]?.order ?? 99,
      techs: techs.sort(
        (a, b) =>
          Number(b.indexable) - Number(a.indexable) ||
          a.label.localeCompare(b.label)
      ),
    }))
    .sort((a, b) => a.order - b.order);
}

export function getRelatedTechs(tech, limit = 8) {
  return getAllTechs()
    .filter((t) => t.category === tech.category && t.id !== tech.id)
    .sort((a, b) => Number(b.indexable) - Number(a.indexable))
    .slice(0, limit);
}

export const iconUrl = (t) =>
  t.iconSlug ? `https://cdn.simpleicons.org/${t.iconSlug}/ffffff` : null;
