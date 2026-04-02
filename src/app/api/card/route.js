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

export const revalidate = 0;

// ── Valid value sets (derived from cardOptions & themes) ────────────────────
const VALID_LAYOUTS = new Set(LAYOUTS.map((l) => l.id));
const VALID_SIZES = new Set(SIZES.map((s) => s.id));
const VALID_THEMES = new Set(Object.keys(THEMES));
const VALID_ICON_STYLES = new Set(ICON_STYLES.map((i) => i.id));
const VALID_PILL_SHAPES = new Set(PILL_SHAPES.map((p) => p.id));
const VALID_CATEGORY_FILTERS = new Set(CATEGORY_FILTERS.map((f) => f.id));
const VALID_ACCENT_LINES = new Set(ACCENT_LINES.map((a) => a.id));
const VALID_BG_DECORATIONS = new Set(BG_DECORATIONS.map((b) => b.id));

// ── Helper: pick a validated value from searchParams ─────────────────────
// Tries each alias in `keys` in order. Returns the first value that passes
// the validSet check (or any non-empty value if validSet is null).
// Falls back to `fallback` if nothing matches.
function pick(searchParams, keys, validSet, fallback) {
  for (const key of keys) {
    const val = searchParams.get(key);
    if (val !== null) {
      if (!validSet || validSet.has(val)) return val;
    }
  }
  return fallback;
}

// ── Helper: merge dataFields from two sources ─────────────────────────────
// Applies `overrides` (partial) on top of `base` (full defaults object).
// Only keys present in `overrides` are changed.
function mergeDataFields(base, overrides) {
  if (!overrides || typeof overrides !== "object") return { ...base };
  return { ...base, ...overrides };
}

// ── Icon colour resolution ─────────────────────────────────────────────────
function resolveIconHex(tech, iconStyle) {
  if (iconStyle === "mono") return "ffffff";
  return (tech.textColor ?? "#ffffff").replace("#", "").toLowerCase();
}

// ── Build icon map from simple-icons npm package ───────────────────────────
async function buildIconMap(stack, iconStyle) {
  if (iconStyle === "none") return {};

  const si = await import("simple-icons");
  const iconMap = {};

  for (const tech of stack) {
    if (!tech.iconSlug) continue;

    const hex = resolveIconHex(tech, iconStyle);
    const mapKey = `${tech.iconSlug}/${hex}`;
    if (iconMap[mapKey] !== undefined) continue;

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
export async function GET(request) {
  const { searchParams } = new URL(request.url);

  // ── Resolve owner/repo ─────────────────────────────────────────────────
  const repoParam = searchParams.get("repo") ?? "";
  const parts = repoParam.split("/").filter(Boolean);
  if (parts.length < 2) {
    return new NextResponse("Missing ?repo=owner/repo", { status: 400 });
  }
  const [owner, repo] = parts;

  // ── Sanitise subPath ───────────────────────────────────────────────────
  // ?path= restricts scanning to a sub-directory (monorepo support).
  // The .stackfingerprint.json `path` field is used as a fallback when
  // this param is absent — that resolution happens after detect() returns.
  const rawPath = searchParams.get("path") ?? "";
  const urlSubPath = rawPath
    .replace(/\.\./g, "")
    .replace(/^\/+|\/+$/g, "")
    .trim();

  try {
    // ── 1. Detect stack ─────────────────────────────────────────────────
    // detectStack now returns { stack, sfConfig } so we can read both the
    // detected signals AND the repo's card preferences in one pass.
    // We pass urlSubPath here; if it is empty we fall back to sfConfig.path
    // after the call (see step 2).
    const { stack, sfConfig } = await detectStack(owner, repo, fetchContents, {
      subPath: urlSubPath,
    });

    // ── 2. Resolve effective subPath ────────────────────────────────────
    // If no ?path= was given in the URL, honour the `path` field from
    // .stackfingerprint.json. If that is also absent, scan from root.
    // NOTE: if urlSubPath was non-empty we already scanned the right
    // directory; sfConfig.path is only used as a default when the URL
    // param is absent.
    //
    // If sfConfig.path differs from what we already scanned we need a
    // second scan.  This covers the case where:
    //   - no ?path= in URL
    //   - .stackfingerprint.json has "path": "apps/web"
    //
    // We re-detect lazily rather than running two scans upfront.
    let finalStack = stack;
    let finalSfConfig = sfConfig;

    if (!urlSubPath && sfConfig.path) {
      const configSubPath = sfConfig.path
        .replace(/\.\./g, "")
        .replace(/^\/+|\/+$/g, "")
        .trim();

      if (configSubPath) {
        const result = await detectStack(owner, repo, fetchContents, {
          subPath: configSubPath,
        });
        finalStack = result.stack;
        finalSfConfig = result.sfConfig;
      }
    }

    // ── 3. Build cfg — three-layer merge ────────────────────────────────
    //
    // Priority (highest → lowest):
    //   A. URL query parameters          ← explicit user intent
    //   B. .stackfingerprint.json card   ← repo-level defaults
    //   C. DEFAULT_CONFIG                ← hardcoded fallback
    //
    // For each option we call pick() with:
    //   - The searchParams keys to try (canonical + legacy aliases)
    //   - The valid value set
    //   - The config-file value as fallback (layer B)
    //   - Which itself falls back to DEFAULT_CONFIG (layer C)
    //
    // This means a URL param always wins, but when absent the config file
    // value is used — and when the config file has no opinion either, the
    // hardcoded default kicks in.

    const fileCard = finalSfConfig.card ?? {};

    // dataFields: start from DEFAULT_CONFIG, apply config-file overrides,
    // then apply per-field URL params on top.
    const baseDataFields = mergeDataFields(
      DEFAULT_CONFIG.dataFields,
      fileCard.dataFields
    );
    const dataFields = { ...baseDataFields };

    // df_<fieldId>=1/0 URL params override individual dataFields keys.
    const DATA_FIELD_KEYS = [
      "repoName",
      "signalCount",
      "footerUrl",
      "brandLabel",
      "categoryDots",
      "overflowBadge",
    ];
    DATA_FIELD_KEYS.forEach((k) => {
      const raw = searchParams.get(`df_${k}`);
      if (raw !== null) {
        dataFields[k] = raw === "1" || raw === "true" || raw === "yes";
      }
    });

    const cfg = {
      ...DEFAULT_CONFIG,

      layout: pick(
        searchParams,
        ["layout"],
        VALID_LAYOUTS,
        fileCard.layout ?? DEFAULT_CONFIG.layout
      ),
      size: pick(
        searchParams,
        ["size"],
        VALID_SIZES,
        fileCard.size ?? DEFAULT_CONFIG.size
      ),
      theme: pick(
        searchParams,
        ["theme"],
        VALID_THEMES,
        fileCard.theme ?? DEFAULT_CONFIG.theme
      ),

      // iconStyle — canonical key "iconStyle", legacy alias "icons"
      iconStyle: pick(
        searchParams,
        ["iconStyle", "icons"],
        VALID_ICON_STYLES,
        fileCard.iconStyle ?? DEFAULT_CONFIG.iconStyle
      ),

      // pillShape — canonical key "pillShape", legacy alias "pills"
      pillShape: pick(
        searchParams,
        ["pillShape", "pills"],
        VALID_PILL_SHAPES,
        fileCard.pillShape ?? DEFAULT_CONFIG.pillShape
      ),

      // categoryFilter — canonical key "categoryFilter", legacy alias "cats"
      categoryFilter: pick(
        searchParams,
        ["categoryFilter", "cats"],
        VALID_CATEGORY_FILTERS,
        fileCard.categoryFilter ?? DEFAULT_CONFIG.categoryFilter
      ),

      // accentLine — canonical key "accentLine", legacy alias "accent"
      accentLine: pick(
        searchParams,
        ["accentLine", "accent"],
        VALID_ACCENT_LINES,
        fileCard.accentLine ?? DEFAULT_CONFIG.accentLine
      ),

      // bgDecoration — canonical key "bgDecoration", legacy alias "bg"
      bgDecoration: pick(
        searchParams,
        ["bgDecoration", "bg"],
        VALID_BG_DECORATIONS,
        fileCard.bgDecoration ?? DEFAULT_CONFIG.bgDecoration
      ),

      dataFields,
    };

    // ── 4. Apply ?devOnly=0 shorthand ───────────────────────────────────
    // Hides dev-only signals without changing categoryFilter.
    // Equivalent to categoryFilter=prodonly but operates at the stack level
    // rather than the render level, so it composes with any categoryFilter.
    const showDevOnly = pick(searchParams, ["devOnly"], null, "1");
    const filteredByDev =
      showDevOnly === "0" ? finalStack.filter((t) => !t.isDevOnly) : finalStack;

    // ── 5. Build icon map & render SVG ──────────────────────────────────
    const iconBase64Map = await buildIconMap(filteredByDev, cfg.iconStyle);
    const svg = buildSVG(owner, repo, filteredByDev, cfg, iconBase64Map);

    return new NextResponse(svg, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
        "Access-Control-Allow-Origin": "*",
        "X-Auth": process.env.GITHUB_TOKEN ? "token" : "none",
        // Expose whether a config file was found — useful for debugging
        "X-SF-Config": Object.keys(fileCard).length > 0 ? "applied" : "none",
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
