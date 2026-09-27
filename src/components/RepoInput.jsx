"use client";
import { useState } from "react";
import { Viewfinder } from "./brand/Brand";

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
    <div className="sf-scanner">
      <Viewfinder active={focused || loading}>
        <div className={`sf-scan-field ${focused ? "is-focused" : ""}`}>
          {loading && <span className="sf-scan-line" aria-hidden="true" />}

          <label htmlFor="repo" className="sf-scan-prompt">
            $<span className="cmd">stack-fingerprint scan</span>
          </label>

          <input
            id="repo"
            className="sf-scan-input"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && onSubmit()}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="owner/repo"
            spellCheck={false}
            autoComplete="off"
            aria-label="GitHub repository"
          />

          <div className="sf-scan-action">
            <button
              className="sf-btn sf-btn-primary"
              onClick={() => onSubmit()}
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg
                    className="sf-spin"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="9" strokeOpacity="0.2" />
                    <path d="M12 3a9 9 0 0 1 9 9" strokeLinecap="round" />
                  </svg>
                  Scanning
                </>
              ) : (
                <>
                  Scan
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>
      </Viewfinder>

      <div className="sf-examples">
        <span className="sf-label">Try</span>
        {EXAMPLES.map((r) => {
          const [owner, name] = r.split("/");
          return (
            <button
              key={r}
              className="sf-chip"
              disabled={loading}
              onClick={() => {
                onChange(r);
                onSubmit(r);
              }}
            >
              <span className="owner">{owner}/</span>
              {name}
            </button>
          );
        })}
      </div>
    </div>
  );
}
