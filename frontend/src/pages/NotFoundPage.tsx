import React, { useEffect, useState } from "react";

const fraunces = { fontFamily: "'Fraunces', Georgia, serif" };
const jetbrains = { fontFamily: "'JetBrains Mono', ui-monospace, monospace" };

export default function VerdictNotFound({
  path,
  homeHref = "#dashboard",
  findingsHref = "#findings",
}:{path ?:string,homeHref:string,findingsHref:string}) {
  const [requestedPath, setRequestedPath] = useState(path || "/unknown-route");

  useEffect(() => {
    if (!path && typeof window !== "undefined") {
      const current = window.location.pathname + window.location.search;
      if (current && current !== "/") setRequestedPath(current);
    }
  }, [path]);

  return (
    <div className="min-h-screen bg-white text-neutral-900 font-sans antialiased">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
      `}</style>

      {/* Topbar */}
      <div className="flex items-center justify-between px-8 py-5 border-b border-neutral-200">
        <div className="flex items-center gap-2 text-lg font-semibold" style={fraunces}>
          <span className="w-2 h-2 rounded-full bg-red-700 inline-block" />
          Verdict
        </div>
        <span
          className="text-xs px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-50"
          style={jetbrains}
        >
          404 · route unresolved
        </span>
      </div>

      {/* Center stage */}
      <div className="min-h-[calc(100vh-73px)] flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-lg text-center">
          <div className="text-xs tracking-wider text-neutral-400 mb-5" style={jetbrains}>
            STATUS <span className="text-red-700 font-semibold">404</span> · NOT FOUND
          </div>

          <div className="text-8xl font-semibold leading-none tracking-tight mb-4" style={fraunces}>
            404
          </div>

          <h1 className="text-2xl font-semibold leading-snug mb-3" style={fraunces}>
            This page doesn't exist.
          </h1>

          <p className="text-sm text-neutral-500 leading-relaxed max-w-md mx-auto mb-8">
            The link you followed doesn't match a page in Verdict. It may
            have moved, or the finding it pointed to was resolved and
            archived.
          </p>

          <div
            className="inline-flex items-center gap-2 text-xs text-neutral-500 bg-neutral-100 border border-neutral-200 rounded-lg px-3.5 py-2.5 mb-8"
            style={jetbrains}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-700 inline-block flex-shrink-0" />
            <span>{requestedPath}</span>
          </div>

          <div className="flex items-center justify-center gap-2.5 flex-wrap mb-9">
            
             <a href={homeHref}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold bg-neutral-900 text-white hover:bg-black transition-colors"
            >
              Back to overview
            </a>
            
             <a href={findingsHref}
              className="px-5 py-2.5 rounded-lg text-sm font-semibold border border-neutral-200 text-neutral-900 hover:border-neutral-900 transition-colors"
            >
              Go to findings
            </a>
          </div>

          <div className="flex items-center justify-center gap-5 flex-wrap pt-6 border-t border-neutral-200">
            <a href="#findings" className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors">
              Findings
            </a>
            <a href="#triage" className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors">
              Triage queue
            </a>
            <a href="#gate" className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors">
              Deployment gate
            </a>
            <a href="#settings" className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors">
              Settings
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}