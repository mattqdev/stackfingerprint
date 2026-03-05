"use client";
import { useState, useCallback } from "react";
// Icons
import {
  Search,
  Dna,
  Palette,
  Pin,
  AlertCircle,
  Settings2,
  ChevronRight,
  Terminal,
} from "lucide-react";

import { fetchContents, fetchRepoMeta, parseRepoInput } from "../lib/github";
import { detectStack } from "../lib/detect";
import { buildSVG } from "../lib/svgBuilder";
import { DEFAULT_CONFIG } from "../data/cardOptions";

import RepoInput from "../components/RepoInput";
import CardConfigurator from "../components/CardConfigurator.jsx";
import CardPreview from "../components/CardPreview";
import ShieldBadges from "../components/ShieldBadges";

export default function Page() {
  const [input, setInput] = useState("");
  const [phase, setPhase] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [svg, setSvg] = useState("");
  const [stack, setStack] = useState([]);
  const [repoInfo, setRepoInfo] = useState(null);
  const [meta, setMeta] = useState(null);
  const [cfg, setCfg] = useState(DEFAULT_CONFIG);

  const generate = useCallback(
    async (overrideInput) => {
      const raw = overrideInput ?? input;
      const parsed = parseRepoInput(raw);
      if (!parsed) {
        setErrorMsg("Enter a valid GitHub URL or owner/repo format");
        setPhase("error");
        return;
      }

      setPhase("loading");
      setErrorMsg("");

      try {
        const [detected, repoMeta] = await Promise.all([
          detectStack(parsed.owner, parsed.repo, fetchContents),
          fetchRepoMeta(parsed.owner, parsed.repo),
        ]);

        const card = buildSVG(parsed.owner, parsed.repo, detected, cfg);
        setSvg(card);
        setStack(detected);
        setRepoInfo(parsed);
        setMeta(repoMeta);
        setPhase("done");
      } catch (e) {
        const msgs = {
          RATE_LIMIT: "GitHub rate limit reached — try again in a few minutes.",
          NOT_FOUND:
            "Repository not found. Ensure it is public and spelled correctly.",
        };
        setErrorMsg(msgs[e.message] ?? "An unexpected error occurred.");
        setPhase("error");
      }
    },
    [input, cfg],
  );

  const handleCfgChange = useCallback(
    (newCfg) => {
      setCfg(newCfg);
      if (repoInfo && stack.length > 0) {
        const card = buildSVG(repoInfo.owner, repoInfo.repo, stack, newCfg);
        setSvg(card);
      }
    },
    [repoInfo, stack],
  );

  return (
    <div className="min-h-screen bg-[#030308] text-slate-200 selection:bg-indigo-500/30 selection:text-indigo-200 relative overflow-x-hidden font-sans antialiased">
      {/* Dynamic Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-violet-600/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-20 sm:py-28">
        <Hero />

        <div className="mb-12">
          <RepoInput
            value={input}
            onChange={setInput}
            onSubmit={generate}
            loading={phase === "loading"}
          />
        </div>

        {/* Error Alert */}
        {phase === "error" && (
          <div className="mb-10 flex items-center gap-3 px-4 py-3 rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 text-sm font-mono animate-in fade-in slide-in-from-top-2">
            <AlertCircle size={16} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Results Section */}
        {phase === "done" && repoInfo && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-12">
            <div className="flex justify-center">
              <ShieldBadges
                meta={meta}
                owner={repoInfo.owner}
                repo={repoInfo.repo}
              />
            </div>

            <div className="space-y-10">
              <CardPreview svg={svg} repoInfo={repoInfo} cfg={cfg} />

              <div className="pt-8 border-t border-white/5">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-1.5 rounded-md bg-indigo-500/10 border border-indigo-500/20">
                    <Settings2 size={14} className="text-indigo-400" />
                  </div>
                  <h3 className="text-[11px] font-mono tracking-[0.2em] text-white/40 uppercase">
                    Configuration Engine
                  </h3>
                </div>
                <CardConfigurator cfg={cfg} onChange={handleCfgChange} />
              </div>
            </div>
          </div>
        )}

        <HowItWorks visible={phase !== "loading" && phase !== "done"} />
      </div>
    </div>
  );
}

function Hero() {
  return (
    <header className="mb-16 text-center sm:text-left">
      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/20 bg-indigo-500/5 mb-8">
        <Terminal size={12} className="text-indigo-400" />
        <span className="text-[10px] font-mono tracking-[0.1em] text-indigo-300 uppercase">
          Stack Fingerprint v2.0
        </span>
      </div>

      <h1 className="text-4xl sm:text-6xl font-bold tracking-tight text-white mb-6">
        Map any repository's <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
          technology stack.
        </span>
      </h1>

      <p className="text-base text-slate-400 leading-relaxed max-w-xl mb-8">
        Instant deep-scan of file trees and dependency graphs. Generate a
        professional <span className="text-slate-200">SVG identity card</span>{" "}
        for your README in seconds.
      </p>

      <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
        {["60+ Signals", "Real Icons", "Zero Auth", "Static SVG"].map((f) => (
          <div
            key={f}
            className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/[0.03] border border-white/5 text-[11px] font-mono text-slate-500"
          >
            <ChevronRight size={10} className="text-indigo-500/50" />
            {f}
          </div>
        ))}
      </div>
    </header>
  );
}

function HowItWorks({ visible }) {
  if (!visible) return null;

  const steps = [
    {
      icon: Search,
      title: "Deep Fetch",
      body: "Scans public GitHub trees via the native Contents API.",
    },
    {
      icon: Dna,
      title: "Fingerprint",
      body: "Analyzes lockfiles, configs, and directory patterns.",
    },
    {
      icon: Palette,
      title: "Generator",
      body: "Compiles a lightweight SVG with CDN-hosted vector icons.",
    },
    {
      icon: Pin,
      title: "Deployment",
      body: "Copy the Markdown link and pin it to your repository.",
    },
  ];

  return (
    <section className="mt-24 pt-16 border-t border-white/5">
      <h2 className="text-[11px] font-mono tracking-[0.3em] text-white/20 uppercase mb-10 text-center">
        The Pipeline
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((item, idx) => (
          <div
            key={idx}
            className="p-5 rounded-2xl border border-white/[0.05] bg-white/[0.02] hover:bg-white/[0.04] transition-all group"
          >
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-500/5 border border-indigo-500/10 mb-4 group-hover:scale-110 transition-transform">
              <item.icon size={18} className="text-indigo-400/70" />
            </div>
            <h4 className="text-sm font-semibold text-slate-200 mb-2">
              {item.title}
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed font-mono opacity-80">
              {item.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
