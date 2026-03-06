// src/app/api/card/route.js
import { NextResponse } from "next/server";
import { fetchContents } from "../../../lib/github";
import { detectStack } from "../../../lib/detect";
import { buildSVG } from "../../../lib/svgBuilder";
import { DEFAULT_CONFIG } from "../../../data/cardOptions";

export const revalidate = 0; // disable ISR — cache via headers only

// ── Icon colour resolution (must mirror svgBuilder.js exactly) ────────────
function resolveIconHex(tech, iconStyle) {
  if (iconStyle === "mono") return "ffffff";
  return (tech.textColor ?? "#ffffff").replace("#", "").toLowerCase();
}

// ── Build icon map from simple-icons npm package ───────────────────────────
// Uses the bundled SVG strings — zero network calls, works in any environment.
// The CDN (cdn.simpleicons.org) blocks server-side fetches with 403.
async function buildIconMap(stack, iconStyle) {
  if (iconStyle === "none") return {};

  // Dynamic import so the large icons bundle is only loaded when needed
  const si = await import("simple-icons");

  const iconMap = {};

  for (const tech of stack) {
    if (!tech.iconSlug) continue;

    const hex = resolveIconHex(tech, iconStyle);
    const mapKey = `${tech.iconSlug}/${hex}`;
    if (iconMap[mapKey] !== undefined) continue; // already processed

    // simple-icons exports as si<CapitalisedSlug>, e.g. siNextdotjs
    const exportKey =
      "si" + tech.iconSlug.charAt(0).toUpperCase() + tech.iconSlug.slice(1);
    const icon = si[exportKey];

    if (!icon?.svg) {
      iconMap[mapKey] = null; // not found — pill will render text-only
      continue;
    }

    // Recolour: replace any existing fill on the <svg> tag and inject ours
    const recoloured = icon.svg.replace(
      /(<svg[^>]*?)(\sfill="[^"]*")?(\s*>)/,
      `$1 fill="#${hex}"$3`
    );

    const b64 = Buffer.from(recoloured).toString("base64");
    iconMap[mapKey] = `data:image/svg+xml;base64,${b64}`;
  }

  return iconMap;
}

// ── Param names match page.js cfgToParams() with legacy alias fallbacks ────
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
  [
    "repoName",
    "signalCount",
    "footerUrl",
    "brandLabel",
    "categoryDots",
    "overflowBadge",
  ].forEach((k) => {
    const raw = searchParams.get(`df_${k}`);
    if (raw !== null) dataFields[k] = raw === "1";
  });

  // ── cfg ────────────────────────────────────────────────────────────────
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
    const iconBase64Map = await buildIconMap(stack, cfg.iconStyle);
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
