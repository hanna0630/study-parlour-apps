import React from "react";

// The keyword "export default" is mandatory here so Next.js can load it!
export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center max-w-xl mx-auto gap-6 font-sans">
      <div className="inline-flex items-center justify-center p-4 bg-blue-50 text-blue-600 rounded-2xl text-4xl shadow-sm">
        📚
      </div>
      <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 m-0">
        Study Parlour Management Platform
      </h1>
      <p className="text-sm text-slate-600 leading-relaxed m-0">
        Auditable multi-currency accounting, client onboarding workflows, and Notion-inspired administrative interfaces active.
      </p>
      <div className="pt-2">
        <a 
          href="/dashboard" 
          className="inline-flex items-center justify-center bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm px-6 py-3 rounded-xl shadow-sm no-underline transition-all cursor-pointer"
        >
          Enter Dashboard System Portal →
        </a>
      </div>
    </div>
  );
}
