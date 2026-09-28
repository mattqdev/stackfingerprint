// src/app/api/showcase/route.js
// Public list of featured repos for the homepage "Used by" section.
import { NextResponse } from "next/server";
import { getDb } from "../../../lib/server/db";
import { fetchRepoMeta } from "../../../lib/server/githubMeta";
import { SHOWCASE } from "../../../data/showcase";

export const revalidate = 300;

function publicShape(r) {
  return {
    repo: r.repo,
    theme: r.featured_theme ?? "scanner",
    layout: r.featured_layout ?? "classic",
    params: r.featured_params ?? "",
    featuredAt: r.featured_at,
    meta: r.meta ?? null,
  };
}

export async function GET() {
  const db = getDb();
  let items = null;

  if (db) {
    const { data, error } = await db
      .from("sf_repos")
      .select(
        "repo, featured_theme, featured_layout, featured_params, featured_at, meta, featured_order"
      )
      .eq("status", "featured")
      .order("featured_order", { ascending: true })
      .order("featured_at", { ascending: true });
    if (!error && data.length) items = data.map(publicShape);
  }

  // No database (or nothing featured yet): static list, enriched live.
  if (!items) {
    items = await Promise.all(
      SHOWCASE.map(async (s) => ({
        repo: s.repo,
        theme: s.theme,
        layout: s.layout,
        params: "",
        featuredAt: null,
        meta: await fetchRepoMeta(s.repo, { withStack: true }).catch(
          () => null
        ),
      }))
    );
  }

  return NextResponse.json(
    { items },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=3600",
      },
    }
  );
}
