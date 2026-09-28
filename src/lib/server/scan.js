// src/lib/server/scan.js
// Finds every public file on GitHub that references Stack Fingerprint and
// records where each card lives. Results feed the admin "Discovered" list.
import { getDb } from "./db";
import { codeSearch, fetchRepoMeta } from "./githubMeta";

const QUERIES = [
  '"stackfingerprint.vercel.app/api/card"',
  '"stackfingerprint-action"',
  '"stackfingerprint.vercel.app/schema.json"',
];

const REPO_RE = /[?&]repo=([\w.-]+\/[\w.-]+)/g;
const PLACEHOLDERS = /^(owner|myorg|your-?org|user|username)\//i;

function kindFor(path, text) {
  if (path.startsWith(".github/workflows/"))
    return /stackfingerprint-action/.test(text) ? "action" : "workflow";
  if (/schema\.json/.test(text) && /stackfingerprint/i.test(path))
    return "config";
  return "hotlink";
}

function cardReposIn(text, hostRepo) {
  const found = new Set();
  for (const m of text.matchAll(REPO_RE)) {
    const r = m[1].replace(/\.+$/, "").toLowerCase();
    if (!PLACEHOLDERS.test(r)) found.add(r);
  }
  // Actions, workflows and config files always describe the host repo.
  if (!found.size) found.add(hostRepo);
  return [...found];
}

export async function runScan({ metaLimit = 25 } = {}) {
  const db = getDb();
  if (!db) throw new Error("Supabase is not configured");

  const { data: scan } = await db
    .from("sf_scans")
    .insert({})
    .select("id")
    .single();

  const embeds = new Map();
  try {
    for (const q of QUERIES) {
      for (let page = 1; page <= 10; page++) {
        const res = await codeSearch(q, page);
        for (const item of res.items ?? []) {
          const hostRepo = item.repository.full_name.toLowerCase();
          const text = (item.text_matches ?? [])
            .map((t) => t.fragment)
            .join("\n");
          const kind = kindFor(item.path, text);
          for (const cardRepo of cardReposIn(text, hostRepo)) {
            embeds.set(`${cardRepo}|${hostRepo}|${item.path}`, {
              card_repo: cardRepo,
              host_repo: hostRepo,
              path: item.path,
              html_url: item.html_url,
              kind,
              last_seen: new Date().toISOString(),
            });
          }
        }
        if (!res.items || res.items.length < 100) break;
      }
    }

    const rows = [...embeds.values()];
    if (rows.length) {
      const { error } = await db
        .from("sf_embeds")
        .upsert(rows, { onConflict: "card_repo,host_repo,path" });
      if (error) throw new Error(error.message);
    }

    // Register every repo involved (card repo and host repo).
    const repoNames = [
      ...new Set(rows.flatMap((r) => [r.card_repo, r.host_repo])),
    ];
    const { data: existing = [] } = repoNames.length
      ? await db.from("sf_repos").select("repo, sources").in("repo", repoNames)
      : { data: [] };
    const known = new Map(existing.map((r) => [r.repo, r.sources]));
    const upserts = repoNames.map((repo) => {
      const sources = known.get(repo) ?? [];
      return {
        repo,
        sources: sources.includes("code_search")
          ? sources
          : [...sources, "code_search"],
        last_seen: new Date().toISOString(),
      };
    });
    if (upserts.length) {
      const { error } = await db
        .from("sf_repos")
        .upsert(upserts, { onConflict: "repo" });
      if (error) throw new Error(error.message);
    }

    const refreshed = await refreshMeta({ limit: metaLimit });

    await db
      .from("sf_scans")
      .update({
        finished_at: new Date().toISOString(),
        found: rows.length,
        new_repos: repoNames.filter((r) => !known.has(r)).length,
      })
      .eq("id", scan.id);

    return {
      found: rows.length,
      repos: repoNames.length,
      newRepos: repoNames.filter((r) => !known.has(r)).length,
      refreshed,
    };
  } catch (e) {
    await db
      .from("sf_scans")
      .update({ finished_at: new Date().toISOString(), error: e.message })
      .eq("id", scan.id);
    throw e;
  }
}

// Fills in GitHub metadata for repos that have none or a stale copy.
export async function refreshMeta({ limit = 25, repos } = {}) {
  const db = getDb();
  let targets = repos;
  if (!targets) {
    const staleBefore = new Date(Date.now() - 24 * 3600 * 1000)
      .toISOString()
      .replace(/\.\d+Z$/, "Z");
    const { data = [] } = await db
      .from("sf_repos")
      .select("repo, status")
      .or(`meta_updated_at.is.null,meta_updated_at.lt.${staleBefore}`)
      .neq("status", "hidden")
      .order("meta_updated_at", { ascending: true, nullsFirst: true })
      .limit(limit);
    targets = data;
  }

  let count = 0;
  for (const { repo, status } of targets) {
    try {
      const meta = await fetchRepoMeta(repo, {
        withStack: status === "featured",
      });
      await db
        .from("sf_repos")
        .update({ meta, meta_updated_at: new Date().toISOString() })
        .eq("repo", repo);
      count++;
    } catch (e) {
      console.error("[scan] meta failed for", repo, e.message);
    }
  }
  return count;
}
