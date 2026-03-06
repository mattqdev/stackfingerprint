// src/app/api/card/route.js
import { NextResponse } from "next/server";
import { fetchContents } from "../../../lib/github";
import { detectStack } from "../../../lib/detect";
import { buildSVG } from "../../../lib/svgBuilder";
import { DEFAULT_CONFIG } from "../../../data/cardOptions";

export const revalidate = 300; // cache 5 min

// ── Param names match exactly what page.js writes via cfgToParams() ────────
// Top-level keys: layout, size, theme, iconStyle, pillShape,
//                 categoryFilter, accentLine, bgDecoration
// dataFields booleans: df_repoName, df_signalCount, df_footerUrl,
//                      df_brandLabel, df_categoryDots, df_overflowBadge

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  // ── Resolve owner/repo ─────────────────────────────────────────────────
  // Supports both ?repo=owner/repo and path-style /api/card/owner/repo
  const repoParam = searchParams.get("repo") ?? "";
  const parts = repoParam.split("/").filter(Boolean);
  if (parts.length < 2) {
    return new NextResponse("Missing ?repo=owner/repo", { status: 400 });
  }
  const [owner, repo] = parts;

  // ── Build cfg from params, falling back to DEFAULT_CONFIG ──────────────
  const dataFields = { ...DEFAULT_CONFIG.dataFields };

  // Parse df_* boolean overrides
  const DF_KEYS = [
    "repoName",
    "signalCount",
    "footerUrl",
    "brandLabel",
    "categoryDots",
    "overflowBadge",
  ];
  DF_KEYS.forEach((k) => {
    const raw = searchParams.get(`df_${k}`);
    if (raw !== null) dataFields[k] = raw === "1";
  });

  const cfg = {
    ...DEFAULT_CONFIG,
    // Top-level knobs — param names are identical to cfgToParams() in page.js
    layout: searchParams.get("layout") ?? DEFAULT_CONFIG.layout,
    size: searchParams.get("size") ?? DEFAULT_CONFIG.size,
    theme: searchParams.get("theme") ?? DEFAULT_CONFIG.theme,
    iconStyle: searchParams.get("iconStyle") ?? DEFAULT_CONFIG.iconStyle,
    pillShape: searchParams.get("pillShape") ?? DEFAULT_CONFIG.pillShape,
    categoryFilter:
      searchParams.get("categoryFilter") ?? DEFAULT_CONFIG.categoryFilter,
    accentLine: searchParams.get("accentLine") ?? DEFAULT_CONFIG.accentLine,
    bgDecoration:
      searchParams.get("bgDecoration") ?? DEFAULT_CONFIG.bgDecoration,
    dataFields,
  };

  try {
    const stack = await detectStack(owner, repo, fetchContents);
    const svg = buildSVG(owner, repo, stack, cfg);

    return new NextResponse(svg, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (e) {
    const code =
      e.message === "NOT_FOUND" ? 404 : e.message === "RATE_LIMIT" ? 429 : 500;
    return new NextResponse(errorSVG(e.message, code), {
      status: code,
      headers: { "Content-Type": "image/svg+xml" },
    });
  }
}

function errorSVG(msg, code) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="80" viewBox="0 0 400 80">
  <rect width="400" height="80" rx="10" fill="#1a0d0d"/>
  <rect width="400" height="80" rx="10" fill="none" stroke="rgba(239,68,68,0.2)" stroke-width="1"/>
  <text x="20" y="36" font-family="ui-monospace,monospace" font-size="12" fill="#f87171">
    Stack Fingerprint — Error ${code}
  </text>
  <text x="20" y="56" font-family="ui-monospace,monospace" font-size="10" fill="rgba(248,113,113,0.5)">
    ${msg === "RATE_LIMIT" ? "GitHub rate limit — try again shortly" : msg === "NOT_FOUND" ? "Repository not found or is private" : "Something went wrong"}
  </text>
</svg>`;
}
