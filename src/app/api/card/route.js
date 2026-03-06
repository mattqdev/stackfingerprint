// src/app/api/card/route.js
import { NextResponse } from "next/server";
import { fetchContents } from "../../../lib/github";
import { detectStack } from "../../../lib/detect";
import { buildSVG } from "../../../lib/svgBuilder";
import { DEFAULT_CONFIG } from "../../../data/cardOptions";

export const revalidate = 300; // cache 5 min

// ── Pre-fetch icons server-side → base64 data URIs ────────────────────────
// This avoids the CSP "img-src data:" violation that blocks external URLs
// inside SVG <image> tags when the SVG is served from our own origin.
async function fetchIconsAsBase64(stack, iconStyle) {
  if (iconStyle === "none") return {};

  const iconMap = {};

  await Promise.allSettled(
    stack.map(async (tech) => {
      if (!tech.iconSlug) return;
      const hex =
        iconStyle === "mono"
          ? "ffffff"
          : (tech.textColor ?? "#ffffff").replace("#", "");

      const url = `https://cdn.simpleicons.org/${tech.iconSlug}/${hex}`;
      try {
        const res = await fetch(url, {
          next: { revalidate: 86400 }, // cache icon for 24 h
        });
        if (!res.ok) return;
        const svgText = await res.text();
        const b64 = Buffer.from(svgText).toString("base64");
        // Key by slug+hex so the same icon in different colours stays distinct
        iconMap[`${tech.iconSlug}/${hex}`] = `data:image/svg+xml;base64,${b64}`;
      } catch {
        // Silently skip — icon will just be missing from the card
      }
    })
  );

  return iconMap;
}

// ── Param names match exactly what page.js writes via cfgToParams() ────────
// Top-level keys : layout, size, theme, iconStyle, pillShape,
//                  categoryFilter, accentLine, bgDecoration
// dataFields      : df_repoName, df_signalCount, df_footerUrl,
//                   df_brandLabel, df_categoryDots, df_overflowBadge
// Legacy aliases  : icons → iconStyle, pills → pillShape,
//                   bg → bgDecoration, accent → accentLine, cats → categoryFilter

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  // ── Resolve owner/repo ─────────────────────────────────────────────────
  const repoParam = searchParams.get("repo") ?? "";
  const parts = repoParam.split("/").filter(Boolean);
  if (parts.length < 2) {
    return new NextResponse("Missing ?repo=owner/repo", { status: 400 });
  }
  const [owner, repo] = parts;

  // ── dataFields ─────────────────────────────────────────────────────────
  const dataFields = { ...DEFAULT_CONFIG.dataFields };
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

  // ── Build cfg — new param names with legacy alias fallbacks ───────────
  const cfg = {
    ...DEFAULT_CONFIG,
    layout: searchParams.get("layout") ?? DEFAULT_CONFIG.layout,
    size: searchParams.get("size") ?? DEFAULT_CONFIG.size,
    theme: searchParams.get("theme") ?? DEFAULT_CONFIG.theme,
    iconStyle:
      searchParams.get("iconStyle") ??
      searchParams.get("icons") ??
      DEFAULT_CONFIG.iconStyle,
    pillShape:
      searchParams.get("pillShape") ??
      searchParams.get("pills") ??
      DEFAULT_CONFIG.pillShape,
    categoryFilter:
      searchParams.get("categoryFilter") ??
      searchParams.get("cats") ??
      DEFAULT_CONFIG.categoryFilter,
    accentLine:
      searchParams.get("accentLine") ??
      searchParams.get("accent") ??
      DEFAULT_CONFIG.accentLine,
    bgDecoration:
      searchParams.get("bgDecoration") ??
      searchParams.get("bg") ??
      DEFAULT_CONFIG.bgDecoration,
    dataFields,
  };

  try {
    const stack = await detectStack(owner, repo, fetchContents);

    // Fetch all icons server-side so SVG only contains data: URIs (CSP-safe)
    const iconBase64Map = await fetchIconsAsBase64(stack, cfg.iconStyle);

    const svg = buildSVG(owner, repo, stack, cfg, iconBase64Map);

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
