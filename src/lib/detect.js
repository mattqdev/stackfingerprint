// src/lib/detect.js
import { SIGNALS, EXT_LANGS, CATEGORY_META } from "../data/signals";

const KEY_SUBDIRS = [
  "src",
  "app",
  "pages",
  "lib",
  "prisma",
  "terraform",
  ".github",
  ".circleci",
  "supabase",
  "src-tauri",
  ".storybook",
  "config",
  "scripts",
  "infra",
  "deploy",
];

export async function detectStack(owner, repo, fetchFn) {
  const allFiles = new Set();

  const root = await fetchFn(owner, repo);
  root.forEach((f) => allFiles.add(f.name));

  const subdirs = root.filter(
    (f) => f.type === "dir" && KEY_SUBDIRS.includes(f.name)
  );

  await Promise.allSettled(
    subdirs.map(async (d) => {
      try {
        const sub = await fetchFn(owner, repo, d.path);
        sub.forEach((f) => allFiles.add(f.name));
        allFiles.add(d.name); // dir itself is a signal
      } catch {}
    })
  );

  const detected = new Map();

  for (const filename of allFiles) {
    for (const sig of SIGNALS) {
      if (!detected.has(sig.id) && sig.check(filename))
        detected.set(sig.id, sig);
    }
    const dot = filename.lastIndexOf(".");
    if (dot !== -1) {
      const ext = filename.slice(dot).toLowerCase();
      for (const lang of EXT_LANGS) {
        if (!detected.has(lang.id) && lang.exts.includes(ext))
          detected.set(lang.id, lang);
      }
    }
  }

  const catOrder = Object.fromEntries(
    Object.entries(CATEGORY_META).map(([k, v]) => [k, v.order])
  );

  return [...detected.values()].sort(
    (a, b) => (catOrder[a.category] ?? 99) - (catOrder[b.category] ?? 99)
  );
}
