import { useEffect, useRef, useState } from "react";

/**
 * Login.tsx
 *
 * Direct port of github-only-login.html into React + Tailwind. Design is
 * preserved exactly: JetBrains Mono for the wordmark/terminal block, Inter
 * for body copy, the faint animated contribution-grid background, and the
 * terminal-style "auth --provider > github" line.
 *
 * Fonts: add this to index.html <head> (not done via Tailwind config,
 * since these are external Google Fonts, not local/custom fonts):
 *
 *   <link rel="preconnect" href="https://fonts.googleapis.com">
 *   <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
 *
 * And extend tailwind theme (see tailwind.config note at bottom of file)
 * so font-mono / font-sans resolve to these instead of Tailwind's defaults.
 */

function GridBackground() {
  const gridRef = useRef<HTMLDivElement>(null);
  const [cells, setCells] = useState<{ id: number; lit: boolean; bright: boolean }[]>([]);

  useEffect(() => {
    const cols = window.innerWidth < 420 ? 16 * 10 : 28 * 12;
    const generated = Array.from({ length: cols }, (_, i) => {
      const r = Math.random();
      return {
        id: i,
        lit: r > 0.85,
        bright: r > 0.93,
      };
    });
    setCells(generated);
  }, []);

  return (
    <div
      ref={gridRef}
      className="pointer-events-none absolute inset-0 z-0 grid grid-cols-[repeat(28,1fr)] auto-rows-[14px] gap-1.5 p-12 [mask-image:radial-gradient(ellipse_80%_70%_at_50%_40%,black_0%,transparent_72%)] max-[420px]:grid-cols-[repeat(16,1fr)] max-[420px]:p-6"
    >
      {cells.map((cell) => (
        <div
          key={cell.id}
          className={`h-2 w-2 rounded-sm ${
            cell.bright
              ? "bg-emerald-500 opacity-90"
              : cell.lit
                ? "bg-emerald-500 opacity-55"
                : "bg-[#EDEEF0]"
          }`}
        />
      ))}
    </div>
  );
}

function GithubIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" className="h-[18px] w-[18px] flex-shrink-0">
      <path
        d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38
        0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13
        -.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07
        -1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12
        0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27
        1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15
        0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2
        0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8Z"
      />
    </svg>
  );
}

export default function Login() {
  const [buttonLabel, setButtonLabel] = useState("Continue with GitHub");

  const handleLogin = () => {
    setButtonLabel("Redirecting…");
    // Full page redirect — must navigate the browser itself, not fetch/axios,
    // since GitHub's OAuth consent screen requires a real navigation.
   
    window.location.href = `${import.meta.env.VITE_API_BASE_URL}/api/v1/auth/github`;
    
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-white p-6 text-[#0D0D12] antialiased">
      <GridBackground />

      <div className="relative z-10 flex w-full max-w-[400px] flex-col items-stretch">
        {/* Wordmark */}
        <div className="mb-10 flex items-center justify-center gap-2 font-mono text-[15px] font-bold tracking-[0.02em]">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          PORTWAY
        </div>

        {/* Heading */}
        <div className="mb-7 text-center">
          <h1 className="mb-2 text-[22px] font-semibold tracking-[-0.01em]">Sign in to Portway</h1>
          <p className="text-sm leading-relaxed text-gray-500">Deploys, logs, and rollbacks in one place.</p>
        </div>

        {/* Terminal block */}
        <div className="mb-6 rounded-[10px] border border-gray-200 bg-gray-100 px-[18px] py-4 font-mono text-[13px] leading-relaxed">
          <div className="flex gap-2 whitespace-pre">
            <span className="text-gray-400">$</span>
            <span className="text-[#0D0D12]">auth --provider</span>
          </div>
          <div className="flex gap-2 whitespace-pre">
            <span className="text-gray-400">&gt;</span>
            <span className="font-medium text-emerald-500">github</span>
            <span className="ml-0.5 inline-block h-[14px] w-[7px] animate-[blink_1.1s_steps(1)_infinite] bg-[#0D0D12] align-middle motion-reduce:animate-none motion-reduce:opacity-100" />
          </div>
        </div>

        {/* GitHub login button */}
        <button
          type="button"
          onClick={handleLogin}
          className="flex w-full items-center justify-center gap-2.5 rounded-[10px] bg-[#0D0D12] px-4 py-[13px] font-sans text-[15px] font-semibold text-white transition-all duration-150 hover:-translate-y-px hover:bg-[#1a1a20] hover:shadow-[0_6px_16px_rgba(13,13,18,0.18)] active:translate-y-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#0D0D12] motion-reduce:transition-none"
        >
          <GithubIcon />
          <span>{buttonLabel}</span>
        </button>

        <p className="mt-[18px] text-center text-[12.5px] leading-relaxed text-gray-500">
          <strong className="font-semibold text-[#0D0D12]">GitHub is the only way in.</strong>{" "}
          Portway doesn't support email or password accounts — every workspace is tied to a GitHub identity.
        </p>

        <div className="mt-8 flex justify-center gap-[18px] text-xs text-gray-400">
          <a href="#" className="text-gray-400 no-underline hover:text-gray-500 hover:underline">
            Why GitHub only?
          </a>
          <a href="#" className="text-gray-400 no-underline hover:text-gray-500 hover:underline">
            Status
          </a>
          <a href="#" className="text-gray-400 no-underline hover:text-gray-500 hover:underline">
            Support
          </a>
        </div>
      </div>
    </div>
  );
}
