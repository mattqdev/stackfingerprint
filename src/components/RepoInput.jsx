"use client";
import { useState } from "react";

const G = "#33ff33";
const EXAMPLES = [
  "vercel/next.js",
  "vitejs/vite",
  "supabase/supabase",
  "physicshub/physicshub.github.io",
  "django/django",
  "rust-lang/rust",
];

export default function RepoInput({ value, onChange, onSubmit, loading }) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ fontFamily: "'JetBrains Mono', monospace" }}>
      {/* Label */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          marginBottom: "8px",
          fontSize: "11px",
          color: "rgba(51,255,51,0.4)",
        }}
      >
        <span style={{ color: G }}>$</span>
        <span style={{ color: "rgba(51,255,51,0.25)" }}>
          Insert your repo here:
        </span>
      </div>

      {/* Input row */}
      <div
        style={{
          display: "flex",
          border: focused
            ? "1px solid rgba(51,255,51,0.6)"
            : "1px solid rgba(51,255,51,0.25)",
          boxShadow: focused
            ? "0 0 15px rgba(51,255,51,0.1), inset 0 0 20px rgba(51,255,51,0.02)"
            : "none",
          transition: "all 0.2s ease",
          marginBottom: "12px",
        }}
      >
        {/* Prompt */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "0 14px",
            borderRight: "1px solid rgba(51,255,51,0.15)",
            background: "rgba(51,255,51,0.04)",
            color: G,
            textShadow: "0 0 8px rgba(51,255,51,0.6)",
            fontSize: "14px",
            userSelect: "none",
            whiteSpace: "nowrap",
          }}
        >
          &gt;_
        </div>

        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onSubmit()}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="github.com/owner/repo"
          spellCheck={false}
          autoComplete="off"
          style={{
            flex: 1,
            padding: "14px 16px",
            background: "rgba(10,10,10,0.6)",
            color: G,
            caretColor: G,
            fontFamily: "inherit",
            fontSize: "13px",
            border: "none",
            outline: "none",
          }}
        />

        <button
          onClick={onSubmit}
          disabled={loading}
          style={{
            padding: "14px 24px",
            borderLeft: "1px solid rgba(51,255,51,0.15)",
            background: loading
              ? "rgba(51,255,51,0.04)"
              : "rgba(51,255,51,0.1)",
            color: loading ? "rgba(51,255,51,0.4)" : G,
            textShadow: loading ? "none" : "0 0 8px rgba(51,255,51,0.6)",
            fontFamily: "inherit",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "2px",
            cursor: loading ? "not-allowed" : "pointer",
            border: "none",
            borderLeft: "1px solid rgba(51,255,51,0.15)",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => {
            if (!loading)
              e.currentTarget.style.background = "rgba(51,255,51,0.18)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = loading
              ? "rgba(51,255,51,0.04)"
              : "rgba(51,255,51,0.1)";
          }}
        >
          {loading ? (
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <svg
                className="sf-spin"
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" />
              </svg>
              SCANNING
            </span>
          ) : (
            "[ RUN ]"
          )}
        </button>
      </div>

      {/* Examples */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "6px",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: "9px",
            color: "rgba(51,255,51,0.2)",
            letterSpacing: "3px",
            textTransform: "uppercase",
            marginRight: "4px",
          }}
        >
          EXAMPLES:
        </span>
        {EXAMPLES.map((r) => (
          <button
            key={r}
            onClick={() => {
              onChange(r);
              onSubmit(r);
            }}
            style={{
              padding: "2px 8px",
              fontSize: "10px",
              border: "1px solid rgba(51,255,51,0.1)",
              color: "rgba(51,255,51,0.35)",
              background: "transparent",
              fontFamily: "inherit",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = G;
              e.currentTarget.style.borderColor = "rgba(51,255,51,0.4)";
              e.currentTarget.style.textShadow = "0 0 6px rgba(51,255,51,0.5)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = "rgba(51,255,51,0.35)";
              e.currentTarget.style.borderColor = "rgba(51,255,51,0.1)";
              e.currentTarget.style.textShadow = "none";
            }}
          >
            {r}
          </button>
        ))}
      </div>
    </div>
  );
}
