// src/lib/server/githubMeta.js
// Compact repo metadata for the admin table and the showcase cards.
import { fetchContents } from "../github";
import { detectStack } from "../detect";

function headers(extra = {}) {
  const token = process.env.GITHUB_TOKEN;
  return {
    Accept: "application/vnd.github+json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extra,
  };
}

export async function fetchRepoMeta(repo, { withStack = false } = {}) {
  const res = await fetch(`https://api.github.com/repos/${repo}`, {
    headers: headers(),
    cache: "no-store",
  });
  if (res.status === 404) return { missing: true };
  if (!res.ok) throw new Error(`GitHub ${res.status} for ${repo}`);
  const r = await res.json();

  const meta = {
    fullName: r.full_name,
    description: r.description,
    homepage: r.homepage || null,
    stars: r.stargazers_count,
    forks: r.forks_count,
    watchers: r.subscribers_count,
    openIssues: r.open_issues_count,
    language: r.language,
    topics: r.topics ?? [],
    license: r.license?.spdx_id ?? null,
    archived: r.archived,
    isFork: r.fork,
    createdAt: r.created_at,
    pushedAt: r.pushed_at,
    owner: {
      login: r.owner?.login,
      type: r.owner?.type,
      avatar: r.owner?.avatar_url,
    },
  };

  if (withStack) {
    try {
      const [owner, name] = r.full_name.split("/");
      const { stack } = await detectStack(owner, name, fetchContents);
      const live = stack.filter((s) => !s.isIgnored);
      meta.signals = live.length;
      meta.topStack = live.slice(0, 6).map((s) => s.label);
    } catch {}
  }
  return meta;
}

export async function codeSearch(query, page = 1) {
  const url = `https://api.github.com/search/code?q=${encodeURIComponent(query)}&per_page=100&page=${page}`;
  const res = await fetch(url, {
    headers: headers({ Accept: "application/vnd.github.text-match+json" }),
    cache: "no-store",
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Code search ${res.status}: ${body.slice(0, 200)}`);
  }
  return res.json();
}
