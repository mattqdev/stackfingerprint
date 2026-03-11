// src/app/api/card/route.js
import { NextResponse } from "next/server";
import { fetchContents } from "../../../lib/github";
import { detectStack } from "../../../lib/detect";
import { buildSVG } from "../../../lib/svgBuilder";
import {
  DEFAULT_CONFIG,
  LAYOUTS,
  SIZES,
  ICON_STYLES,
  PILL_SHAPES,
  CATEGORY_FILTERS,
  ACCENT_LINES,
  BG_DECORATIONS,
} from "../../../data/cardOptions";
import { THEMES } from "../../../data/themes";

export const revalidate = 0; // disable ISR — cache via headers only

// ── Valid value sets (derived from cardOptions & themes) ────────────────────
const VALID_LAYOUTS = new Set(LAYOUTS.map((l) => l.id));
const VALID_SIZES = new Set(SIZES.map((s) => s.id));
const VALID_THEMES = new Set(Object.keys(THEMES));
const VALID_ICON_STYLES = new Set(ICON_STYLES.map((i) => i.id));
const VALID_PILL_SHAPES = new Set(PILL_SHAPES.map((p) => p.id));
const VALID_CATEGORY_FILTERS = new Set(CATEGORY_FILTERS.map((f) => f.id));
const VALID_ACCENT_LINES = new Set(ACCENT_LINES.map((a) => a.id));
const VALID_BG_DECORATIONS = new Set(BG_DECORATIONS.map((b) => b.id));

// ── Helper: pick a value from params with validation ──────────────────────
function pick(searchParams, keys, validSet, fallback) {
  for (const key of keys) {
    const val = searchParams.get(key);
    if (val !== null) {
      // If no validation set provided, accept any non-empty value
      if (!validSet || validSet.has(val)) return val;
    }
  }
  return fallback;
}

// ── Icon colour resolution (must mirror svgBuilder.js exactly) ────────────
// "mono"     → always white icon on accent-coloured tile
// "icononly" → brand text color (same logic as "color")
// "color"    → brand text color
// "none"     → no icons fetched at all
function resolveIconHex(tech, iconStyle) {
  if (iconStyle === "mono") return "ffffff";
  // color and icononly both use the tech's own textColor
  return (tech.textColor ?? "#ffffff").replace("#", "").toLowerCase();
}

// ── Build icon map from simple-icons npm package ───────────────────────────
// Uses the bundled SVG strings — zero network calls, works in any environment.
// The CDN (cdn.simpleicons.org) blocks server-side fetches with 403.
async function buildIconMap(stack, iconStyle) {
  // "none" renders no icons at all — skip the whole bundle import
  if (iconStyle === "none") return {};

  // Dynamic import so the large icons bundle is only loaded when needed
  const si = await import("simple-icons");

  const iconMap = {};

  for (const tech of stack) {
    if (!tech.iconSlug) continue;

    const hex = resolveIconHex(tech, iconStyle);
    const mapKey = `${tech.iconSlug}/${hex}`;
    if (iconMap[mapKey] !== undefined) continue;

    // simple-icons exports as si<CapitalisedSlug>
    // FIX: Handle slugs with dots/dashes by stripping them before capitalising
    // e.g. "nextdotjs" → "siNextdotjs", "dotnet" → "siDotnet"
    const normalised = tech.iconSlug.replace(/[^a-zA-Z0-9]/g, "");
    const exportKey =
      "si" + normalised.charAt(0).toUpperCase() + normalised.slice(1);
    const icon = si[exportKey];

    if (!icon?.svg) {
      iconMap[mapKey] = null;
      continue;
    }

    const recoloured = icon.svg.replace(
      /(<svg[^>]*?)(\sfill="[^"]*")?(\s*>)/,
      `$1 fill="#${hex}"$3`
    );

    const b64 = Buffer.from(recoloured).toString("base64");
    iconMap[mapKey] = `data:image/svg+xml;base64,${b64}`;
  }

  return iconMap;
}

// ── Error message mapping ──────────────────────────────────────────────────
const ERROR_MESSAGES = {
  RATE_LIMIT: process.env.GITHUB_TOKEN
    ? "GitHub rate limit reached — try again shortly"
    : "GitHub rate limit reached — add GITHUB_TOKEN to env to increase limits",
  NOT_FOUND: "Repository not found or is private",
  BAD_TOKEN: "GITHUB_TOKEN is invalid or expired",
  FORBIDDEN: "Access forbidden — check GITHUB_TOKEN permissions",
  API_ERROR: "GitHub API error — try again",
};

// ── GET handler ────────────────────────────────────────────────────────────
// Param names match page.js cfgToParams() with legacy alias fallbacks.
// All parameters are validated against their allowed value sets.
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
  // FIX: All DATA_FIELDS toggle parameters are now parsed and validated.
  // Supports both df_<fieldId>=1/0 and standalone shorthand.
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
    if (raw !== null) {
      // Accept "1"/"true"/"yes" as truthy, "0"/"false"/"no" as falsy
      dataFields[k] = raw === "1" || raw === "true" || raw === "yes";
    }
  });

  // ── cfg ────────────────────────────────────────────────────────────────
  // FIX: All parameters are now validated against their valid value sets,
  // preventing invalid values from reaching the SVG builder.
  const cfg = {
    ...DEFAULT_CONFIG,
    // layout: validated against LAYOUTS
    layout: pick(
      searchParams,
      ["layout"],
      VALID_LAYOUTS,
      DEFAULT_CONFIG.layout
    ),
    // size: validated against SIZES
    size: pick(searchParams, ["size"], VALID_SIZES, DEFAULT_CONFIG.size),
    // theme: validated against THEMES
    theme: pick(searchParams, ["theme"], VALID_THEMES, DEFAULT_CONFIG.theme),
    // iconStyle: validated against ICON_STYLES, with legacy alias "icons"
    iconStyle: pick(
      searchParams,
      ["iconStyle", "icons"],
      VALID_ICON_STYLES,
      DEFAULT_CONFIG.iconStyle
    ),
    // pillShape: validated against PILL_SHAPES, with legacy alias "pills"
    pillShape: pick(
      searchParams,
      ["pillShape", "pills"],
      VALID_PILL_SHAPES,
      DEFAULT_CONFIG.pillShape
    ),
    // categoryFilter: validated against CATEGORY_FILTERS, with legacy alias "cats"
    categoryFilter: pick(
      searchParams,
      ["categoryFilter", "cats"],
      VALID_CATEGORY_FILTERS,
      DEFAULT_CONFIG.categoryFilter
    ),
    // accentLine: validated against ACCENT_LINES, with legacy alias "accent"
    accentLine: pick(
      searchParams,
      ["accentLine", "accent"],
      VALID_ACCENT_LINES,
      DEFAULT_CONFIG.accentLine
    ),
    // bgDecoration: validated against BG_DECORATIONS, with legacy alias "bg"
    bgDecoration: pick(
      searchParams,
      ["bgDecoration", "bg"],
      VALID_BG_DECORATIONS,
      DEFAULT_CONFIG.bgDecoration
    ),
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
        // Expose whether the instance is authenticated — useful for debugging
        "X-Auth": process.env.GITHUB_TOKEN ? "token" : "none",
      },
    });
  } catch (e) {
    const code =
      e.message === "NOT_FOUND"
        ? 404
        : e.message === "RATE_LIMIT"
          ? 429
          : e.message === "BAD_TOKEN" || e.message === "FORBIDDEN"
            ? 403
            : 500;

    const msg = ERROR_MESSAGES[e.message] ?? "Something went wrong";

    return new NextResponse(errorSVG(msg, code), {
      status: code,
      headers: { "Content-Type": "image/svg+xml" },
    });
  }
}

function errorSVG(msg, code) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="520" height="80" viewBox="0 0 520 80">
  <rect width="520" height="80" rx="10" fill="#1a0d0d"/>
  <rect width="520" height="80" rx="10" fill="none" stroke="rgba(239,68,68,0.2)" stroke-width="1"/>
  <text x="20" y="36" font-family="ui-monospace,monospace" font-size="12" fill="#f87171">
    Stack Fingerprint — Error ${code}
  </text>
  <text x="20" y="56" font-family="ui-monospace,monospace" font-size="10" fill="rgba(248,113,113,0.5)">
    ${msg}
  </text>
</svg>`;
}
