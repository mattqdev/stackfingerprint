// src/lib/github.js

const GH = { headers: { Accept: 'application/vnd.github.v3+json' } };

export async function fetchContents(owner, repo, path = '') {
  const res = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/contents/${path}`,
    GH
  );
  if (res.status === 403) throw new Error('RATE_LIMIT');
  if (res.status === 404) throw new Error('NOT_FOUND');
  if (!res.ok) throw new Error('API_ERROR');
  return res.json();
}

export async function fetchRepoMeta(owner, repo) {
  const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, GH);
  if (!res.ok) return null;
  const d = await res.json();
  return {
    stars:       d.stargazers_count  ?? 0,
    forks:       d.forks_count       ?? 0,
    watchers:    d.watchers_count    ?? 0,
    openIssues:  d.open_issues_count ?? 0,
    language:    d.language          ?? null,
    description: d.description       ?? '',
    license:     d.license?.spdx_id  ?? null,
    topics:      d.topics            ?? [],
    pushedAt:    d.pushed_at         ?? null,
    defaultBranch: d.default_branch  ?? 'main',
    isForked:    d.fork              ?? false,
    homepage:    d.homepage          ?? null,
  };
}

export function parseRepoInput(raw) {
  raw = raw.trim().replace(/\.git$/, '');
  const m = raw.match(/github\.com\/([^/\s?#]+)\/([^/\s?#]+)/);
  if (m) return { owner: m[1], repo: m[2] };
  const p = raw.replace(/^\//, '').split('/');
  if (p.length >= 2 && p[0] && p[1]) return { owner: p[0], repo: p[1] };
  return null;
}

export function fmtCount(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000)     return (n / 1_000).toFixed(1).replace(/\.0$/, '')     + 'k';
  return String(n);
}

export function timeAgo(iso) {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86_400_000);
  if (days === 0)  return 'today';
  if (days < 30)   return `${days}d ago`;
  if (days < 365)  return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}
