"use client";

import { useEffect, useState } from "react";

const CRON_RESPONSE = {
  success: true,
  mode: "cron",
  hour: 17,
  remindersSent: 2,
  results: [
    { userId: "cmpl4z4cc00004k9goa57ppnh", type: "love", success: true },
    { userId: "cmpl4zj0x00014k9gm48v5ggc", type: "love", success: true },
  ],
} as const;

// ── JSON Syntax Highlighting ─────────────────────────────────
function highlightJSON(obj: object) {
  const lines = JSON.stringify(obj, null, 2).split("\n");

  return lines.map((line, i) => {
    const trimmed = line.trim();

    // Brackets & braces (with optional trailing comma)
    if (/^[\[\]{}],?$/.test(trimmed)) {
      return (
        <span key={i} className="block leading-relaxed">
          <span className="text-zinc-500">{line.slice(0, line.indexOf(trimmed))}</span>
          <span className="text-zinc-400">{trimmed}</span>
        </span>
      );
    }

    // Key-value lines: "key": value
    const kvMatch = trimmed.match(/^"([^"]+)":\s*(.*)/);
    if (kvMatch) {
      const indent = line.slice(0, line.indexOf('"'));
      const key = kvMatch[1];
      const rawVal = kvMatch[2];

      return (
        <span key={i} className="block leading-relaxed">
          <span className="text-zinc-600">{indent}</span>
          <span className="text-cyan-400">"{key}"</span>
          <span className="text-zinc-500">: </span>
          <ValueRenderer raw={rawVal} />
        </span>
      );
    }

    // Fallback — plain text
    return (
      <span key={i} className="block leading-relaxed text-zinc-400">
        {line}
      </span>
    );
  });
}

function ValueRenderer({ raw }: { raw: string }) {
  // String values
  const strMatch = raw.match(/^"((?:[^"\\]|\\.)*)"(,?)$/);
  if (strMatch) {
    const val = strMatch[1];
    const comma = strMatch[2];
    return (
      <>
        <span className="text-emerald-300">"{val}"</span>
        <span className="text-zinc-500">{comma}</span>
      </>
    );
  }

  // Boolean
  const boolMatch = raw.match(/^(true|false)(,?)$/);
  if (boolMatch) {
    return (
      <>
        <span className="text-purple-400">{boolMatch[1]}</span>
        <span className="text-zinc-500">{boolMatch[2]}</span>
      </>
    );
  }

  // Number
  const numMatch = raw.match(/^(\d+(?:\.\d+)?)(,?)$/);
  if (numMatch) {
    return (
      <>
        <span className="text-yellow-300">{numMatch[1]}</span>
        <span className="text-zinc-500">{numMatch[2]}</span>
      </>
    );
  }

  return <span className="text-zinc-400">{raw}</span>;
}

// ── Component ────────────────────────────────────────────────
export function SystemStatus() {
  const [visible, setVisible] = useState(false);
  const [typingDone, setTypingDone] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [showJson, setShowJson] = useState(false);
  const [showFooter, setShowFooter] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setVisible(true), 300);
    const t2 = setTimeout(() => setTypingDone(true), 1600);
    const t3 = setTimeout(() => setShowMessage(true), 1800);
    const t4 = setTimeout(() => setShowJson(true), 2400);
    const t5 = setTimeout(() => setShowFooter(true), 3200);
    const t6 = setTimeout(() => setShowSuccess(true), 3800);
    return () => {
      clearTimeout(t1); clearTimeout(t2); clearTimeout(t3);
      clearTimeout(t4); clearTimeout(t5); clearTimeout(t6);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`transition-all duration-700 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
      }`}
    >
      <div className="rounded-xl overflow-hidden border border-zinc-700/40 shadow-2xl shadow-black/50 bg-[#0b0b15]">
        {/* ── Terminal Header ─────────────────────────── */}
        <div className="relative flex items-center gap-2 px-4 py-2.5 bg-[#16162a] border-b border-zinc-700/30 select-none">
          {/* Window controls */}
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
            <div className="h-3 w-3 rounded-full bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]" />
            <div className="h-3 w-3 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
          </div>

          {/* Title */}
          <span className="absolute left-1/2 -translate-x-1/2 text-[11px] font-mono text-zinc-500 tracking-wide">
            A² Devs CLI v1.0.0 — System Diagnostics
          </span>

          {/* Spacer for balance */}
          <div className="ml-auto w-12" />
        </div>

        {/* ── Terminal Body ───────────────────────────── */}
        <div className="p-5 sm:p-6 space-y-4 font-mono text-[13px] leading-relaxed">
          {/* ── Project Metrics ───────────────────────── */}
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-emerald-400/80">✦</span>
              <span className="text-zinc-500 text-[12px]">Branch:</span>
              <span className="text-cyan-300 font-medium">main</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-emerald-400/80">✦</span>
              <span className="text-zinc-500 text-[12px]">Git Status:</span>
              <span className="text-green-400 font-medium">working tree clean</span>
              <span className="text-zinc-600 text-[11px] hidden sm:inline">
                (completely synced with GitHub)
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-emerald-400/80">✦</span>
              <span className="text-zinc-500 text-[12px]">Active Deploy Commit:</span>
              <span className="text-amber-300 font-mono font-medium">8b9e780</span>
              <span className="text-zinc-600 text-[11px] hidden sm:inline">
                (Fix: update notification settings component layout)
              </span>
            </div>
          </div>

          {/* ── Separator ─────────────────────────────── */}
          <div className="border-t border-zinc-700/20" />

          {/* ── Live Service Health Check ─────────────── */}
          <div className="space-y-3">
            {/* Section heading */}
            <div className="flex items-center gap-2 text-zinc-500">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(52,211,153,0.6)]" />
              </span>
              <span className="text-[10px] uppercase tracking-[0.2em] font-semibold">
                Live Service Health Check
              </span>
            </div>

            {/* Terminal command */}
            <div className="flex items-center gap-2">
              <span className="text-emerald-400/80 select-none font-bold">$</span>
              <span className="text-zinc-200">
                suar-cli cron --check-latest-run
                {!typingDone && (
                  <span className="inline-block ml-0.5 h-[15px] w-[2px] bg-zinc-300 align-text-bottom animate-cursor-blink" />
                )}
              </span>
            </div>

            {/* Result message */}
            {showMessage && (
              <div className="pl-5 animate-fade-in">
                <span className="text-green-400 text-[12px] italic">
                  &ldquo;Bhai, cron ka yeh response hai, backend aur notification system ekdum tana-tan chal raha hai!&rdquo;
                </span>
              </div>
            )}

            {/* JSON response block */}
            {showJson && (
              <div className="animate-fade-in">
                <div className="bg-[#05050e] rounded-lg border border-zinc-800/50 p-4 overflow-x-auto shadow-inner shadow-black/40">
                  <pre className="text-[12px] leading-relaxed">
                    <code>{highlightJSON(CRON_RESPONSE)}</code>
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* ── Footer Diagnostics ────────────────────── */}
          {showFooter && (
            <>
              <div className="border-t border-zinc-700/20 animate-fade-in" />
              <div className="space-y-1.5 animate-fade-in">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-emerald-400/80">✦</span>
                  <span className="text-zinc-500 text-[12px]">Connection Status:</span>
                  <span className="text-green-400 font-medium">Neon PostgreSQL Connected</span>
                  <span className="text-zinc-600 text-[11px] hidden sm:inline">
                    (sslmode=verify-full)
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-emerald-400/80">✦</span>
                  <span className="text-zinc-500 text-[12px]">Edge Runtime Safety:</span>
                  <span className="text-green-400 font-medium">Verified</span>
                  <span className="text-zinc-600 text-[11px] hidden sm:inline">
                    (middleware.ts decoupled from heavy node modules)
                  </span>
                </div>

                {showSuccess && (
                  <div className="mt-4 pt-3 border-t border-zinc-700/20 animate-bounce-in">
                    <div className="flex items-center gap-2 text-emerald-400 font-bold">
                      <span className="text-emerald-400">[SUCCESS]</span>
                      <span className="text-zinc-200 font-medium">
                        All systems operational. Ready for next feature push.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Loading dots while booting */}
          {!showFooter && (
            <div className="flex items-center gap-1 text-zinc-600 text-[11px] animate-pulse-soft">
              <span>Running diagnostics</span>
              <span className="inline-flex gap-0.5">
                <span className="w-1 h-1 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1 h-1 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1 h-1 rounded-full bg-zinc-500 animate-bounce" style={{ animationDelay: "300ms" }} />
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
