// src/app/api/card/route.js
import { NextResponse } from "next/server";
import { fetchContents } from "..lib/github";
import { detectStack } from "..lib/detect";
import { buildSVG } from "..lib/svgBuilder";
import { DEFAULT_CONFIG } from "..data/cardOptions";

export const revalidate = 300; // cache 5 min

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const repoParam = searchParams.get("repo") ?? "";

  const parts = repoParam.split("/").filter(Boolean);
  if (parts.length < 2) {
    return new NextResponse("Missing ?repo=owner/repo", { status: 400 });
  }
  const [owner, repo] = parts;

  const cfg = {
    ...DEFAULT_CONFIG,
    theme: searchParams.get("theme") ?? "midnight",
    layout: searchParams.get("layout") ?? "classic",
    size: searchParams.get("size") ?? "md",
    iconStyle: searchParams.get("icons") ?? "color",
    pillShape: searchParams.get("pills") ?? "pill",
    bgDecoration: searchParams.get("bg") ?? "none",
    accentLine: searchParams.get("accent") ?? "bar",
    categoryFilter: searchParams.get("cats") ?? "all",
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
