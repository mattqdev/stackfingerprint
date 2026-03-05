'use client';
// src/components/RepoInput.jsx

const EXAMPLES = [
  'vercel/next.js',
  'vitejs/vite',
  'supabase/supabase',
  'denoland/deno',
  'django/django',
  'rust-lang/rust',
  'tailwindlabs/tailwindcss',
  'trpc/trpc',
];

export default function RepoInput({ value, onChange, onSubmit, loading }) {
  return (
    <div>
      <div className="flex gap-2">
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && onSubmit()}
          placeholder="github.com/owner/repo"
          spellCheck={false}
          autoComplete="off"
          className="flex-1 bg-white/[0.03] border border-white/8 rounded-xl px-4 py-3.5 text-sm font-mono text-white/75 placeholder-white/15
            transition-all focus:outline-none focus:border-indigo-500/40 focus:bg-white/[0.05] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.08)]"
        />
        <button
          onClick={onSubmit}
          disabled={loading}
          className="px-5 py-3.5 rounded-xl text-sm font-mono font-semibold tracking-wide transition-all
            disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2
            bg-indigo-500 hover:bg-indigo-400 active:scale-[0.98] text-white shadow-lg shadow-indigo-500/20"
        >
          {loading ? (
            <>
              <svg className="animate-spin-slow" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25"/>
                <path d="M12 2a10 10 0 0 1 10 10"/>
              </svg>
              <span>Scanning</span>
            </>
          ) : (
            <span>Generate →</span>
          )}
        </button>
      </div>

      {/* Quick examples */}
      <div className="flex flex-wrap gap-1.5 mt-3 items-center">
        <span className="text-[9px] font-mono text-white/15 tracking-widest uppercase mr-1">Try:</span>
        {EXAMPLES.map(r => (
          <button
            key={r}
            onClick={() => { onChange(r); onSubmit(r); }}
            className="text-[10px] font-mono px-2 py-0.5 rounded-md border border-white/6 text-white/20 hover:text-indigo-400/70 hover:border-indigo-500/25 transition-colors"
          >
            {r}
          </button>
        ))}
      </div>
    </div>
  );
}
