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

// ── Valid value sets ────────────────────────────────────────────────────────
const VALID_LAYOUTS = new Set(LAYOUTS.map((l) => l.id));
const VALID_SIZES = new Set(SIZES.map((s) => s.id));
const VALID_THEMES = new Set(Object.keys(THEMES));
const VALID_ICON_STYLES = new Set(ICON_STYLES.map((i) => i.id));
const VALID_PILL_SHAPES = new Set(PILL_SHAPES.map((p) => p.id));
const VALID_CATEGORY_FILTERS = new Set(CATEGORY_FILTERS.map((f) => f.id));
const VALID_ACCENT_LINES = new Set(ACCENT_LINES.map((a) => a.id));
const VALID_BG_DECORATIONS = new Set(BG_DECORATIONS.map((b) => b.id));

function pick(searchParams, keys, validSet, fallback) {
  for (const key of keys) {
    const val = searchParams.get(key);
    if (val !== null) {
      if (!validSet || validSet.has(val)) return val;
    }
  }
  return fallback;
}

function mergeDataFields(base, overrides) {
  if (!overrides || typeof overrides !== "object") return { ...base };
  return { ...base, ...overrides };
}

function resolveIconHex(tech, iconStyle) {
  if (iconStyle === "mono") return "ffffff";
  return (tech.textColor ?? "#ffffff").replace("#", "").toLowerCase();
}

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

  const repoParam = searchParams.get("repo") ?? "";
  const parts = repoParam.split("/").filter(Boolean);
  if (parts.length < 2) {
    return new NextResponse("Missing ?repo=owner/repo", { status: 400 });
  }
  const [owner, repo] = parts;

  const rawPath = searchParams.get("path") ?? "";
  const urlSubPath = rawPath
    .replace(/\.\./g, "")
    .replace(/^\/+|\/+$/g, "")
    .trim();

  try {
    // ── 1. Detect stack — destructure { stack, sfConfig, ignoredStack } ──
    const { stack, sfConfig, ignoredStack } = await detectStack(
      owner,
      repo,
      fetchContents,
      { subPath: urlSubPath }
    );

    // ── 2. Resolve effective subPath from config file ────────────────────
    let finalStack = stack;
    let finalSfConfig = sfConfig;
    let finalIgnoredStack = ignoredStack ?? [];

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
        finalIgnoredStack = result.ignoredStack ?? [];
      }
    }

    // ── 3. Build cfg — three-layer merge ────────────────────────────────
    const fileCard = finalSfConfig.card ?? {};

    const baseDataFields = mergeDataFields(
      DEFAULT_CONFIG.dataFields,
      fileCard.dataFields
    );
    const dataFields = { ...baseDataFields };

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
      iconStyle: pick(
        searchParams,
        ["iconStyle", "icons"],
        VALID_ICON_STYLES,
        fileCard.iconStyle ?? DEFAULT_CONFIG.iconStyle
      ),
      pillShape: pick(
        searchParams,
        ["pillShape", "pills"],
        VALID_PILL_SHAPES,
        fileCard.pillShape ?? DEFAULT_CONFIG.pillShape
      ),
      categoryFilter: pick(
        searchParams,
        ["categoryFilter", "cats"],
        VALID_CATEGORY_FILTERS,
        fileCard.categoryFilter ?? DEFAULT_CONFIG.categoryFilter
      ),
      accentLine: pick(
        searchParams,
        ["accentLine", "accent"],
        VALID_ACCENT_LINES,
        fileCard.accentLine ?? DEFAULT_CONFIG.accentLine
      ),
      bgDecoration: pick(
        searchParams,
        ["bgDecoration", "bg"],
        VALID_BG_DECORATIONS,
        fileCard.bgDecoration ?? DEFAULT_CONFIG.bgDecoration
      ),

      // showIgnored: true = show ignored signals as semi-transparent
      //              false (default) = hidden completely
      showIgnored:
        searchParams.get("showIgnored") === "true" ||
        searchParams.get("showIgnored") === "1",

      dataFields,
    };

    // ── 4. Apply ?devOnly=0 shorthand ───────────────────────────────────
    const showDevOnly = pick(searchParams, ["devOnly"], null, "1");
    const filteredByDev =
      showDevOnly === "0" ? finalStack.filter((t) => !t.isDevOnly) : finalStack;

    // ── 5. Apply showIgnored — append ignored signals as ghost pills ─────
    // If showIgnored is true, append the ignored signals (marked isIgnored)
    // so svgBuilder can render them at low opacity
    const stackForRender = cfg.showIgnored
      ? [
          ...filteredByDev,
          ...finalIgnoredStack.map((t) => ({ ...t, isIgnored: true })),
        ]
      : filteredByDev;

    // ── 6. Build icon map & render SVG ──────────────────────────────────
    const iconBase64Map = await buildIconMap(stackForRender, cfg.iconStyle);
    const svg = buildSVG(owner, repo, stackForRender, cfg, iconBase64Map);

    return new NextResponse(svg, {
      status: 200,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
        "Access-Control-Allow-Origin": "*",
        "X-Auth": process.env.GITHUB_TOKEN ? "token" : "none",
        "X-SF-Config": Object.keys(fileCard).length > 0 ? "applied" : "none",
        "X-SF-Ignored": String(finalIgnoredStack.length),
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
