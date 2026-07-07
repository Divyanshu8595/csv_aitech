'use client';

import { useEffect, useState, useMemo } from 'react';
import { Cpu, Terminal, Loader2 } from 'lucide-react';

interface ProcessingOverlayProps {
  progress: number;
}

interface LogEntry {
  timeOffset: string;
  module: string;
  message: string;
  style: string;
  minProgress: number;
}

export default function ProcessingOverlay({
  progress,
}: ProcessingOverlayProps) {
  const clampedProgress = Math.min(Math.max(Math.round(progress), 0), 100);
  const [dots, setDots] = useState('');

  // Animated loading dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 400);
    return () => clearInterval(interval);
  }, []);

  // Developer console logs mapped to progress ranges
  const logEntries: LogEntry[] = useMemo(() => [
    { timeOffset: '0.01s', module: 'SYS', message: 'Initializing pipeline environment...', style: 'text-zinc-500', minProgress: 0 },
    { timeOffset: '0.12s', module: 'API', message: 'Establishing TLS connection to Google AI Gateway...', style: 'text-indigo-400', minProgress: 5 },
    { timeOffset: '0.24s', module: 'API', message: 'Active endpoint resolved: generativelanguage.googleapis.com', style: 'text-zinc-500', minProgress: 12 },
    { timeOffset: '0.45s', module: 'LLM', message: 'Securing instance slot for Model: gemini-3.5-flash', style: 'text-emerald-400', minProgress: 18 },
    { timeOffset: '0.62s', module: 'LLM', message: 'Context window allocated. Analyzing header layout schema...', style: 'text-zinc-500', minProgress: 25 },
    { timeOffset: '0.85s', module: 'MAP', message: 'Mapping columns -> standard CRM schema fields...', style: 'text-amber-400', minProgress: 35 },
    { timeOffset: '1.10s', module: 'VAL', message: 'Validating row formats. Scanning telephone/mobile inputs...', style: 'text-zinc-500', minProgress: 45 },
    { timeOffset: '1.34s', module: 'VAL', message: 'Resolving country codes and sorting regions...', style: 'text-emerald-400', minProgress: 55 },
    { timeOffset: '1.68s', module: 'AI', message: 'Cleansing text entries. Converting names to standard case...', style: 'text-zinc-500', minProgress: 68 },
    { timeOffset: '2.05s', module: 'AI', message: 'Structuring lead classifications (crm_status, data_source)...', style: 'text-indigo-400', minProgress: 78 },
    { timeOffset: '2.40s', module: 'SYS', message: 'Compiling structured JSON object rows...', style: 'text-zinc-500', minProgress: 88 },
    { timeOffset: '2.78s', module: 'SYS', message: 'Data structure compilation complete. Preparing response...', style: 'text-emerald-400', minProgress: 95 },
  ], []);

  // Filter logs that are valid for the current progress
  const activeLogs = useMemo(() => {
    return logEntries.filter((log) => clampedProgress >= log.minProgress);
  }, [clampedProgress, logEntries]);

  return (
    <div className="animate-fade-in max-w-3xl mx-auto">
      <div className="premium-card p-8 sm:p-12 relative overflow-hidden border border-white/[0.03] flex flex-col items-center">
        {/* Glow ambient background layers */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-80 h-80 rounded-full bg-emerald-500/5 animate-pulse" style={{ animationDuration: '4s' }} />
        </div>

        {/* Circular Progress Loader */}
        <div className="relative w-36 h-36 flex items-center justify-center mb-8 select-none">
          {/* Outer rotating glow ring */}
          <div className="absolute inset-0 rounded-full border-2 border-white/5 border-t-emerald-500 animate-spin-slow pointer-events-none" />
          
          {/* Inner details */}
          <div className="flex flex-col items-center justify-center text-center">
            <Cpu className="w-6 h-6 text-emerald-400 animate-pulse mb-1" />
            <div className="flex items-baseline">
              <span className="text-3xl font-extrabold text-white tracking-tight tabular-nums">
                {clampedProgress}
              </span>
              <span className="text-sm font-semibold text-emerald-400/70 ml-0.5">%</span>
            </div>
            <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">
              Processing
            </span>
          </div>
        </div>

        {/* Status text */}
        <div className="text-center mb-6">
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-1 justify-center">
            AI Structuring in Progress{dots}
          </h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-xs leading-normal">
            Gemini is scrubbing messy cells and standardizing your CRM contacts.
          </p>
        </div>

        {/* Rolling developer console log terminal */}
        <div className="w-full max-w-2xl bg-black/60 border border-white/5 rounded-xl overflow-hidden shadow-2xl flex flex-col">
          {/* Terminal Title bar */}
          <div className="px-4 py-2 bg-white/[0.02] border-b border-white/5 flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-zinc-500" />
            <span className="text-[10px] font-bold font-mono tracking-widest text-zinc-500 uppercase">
              Gemini Console Logs
            </span>
            <div className="flex gap-1 ml-auto">
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
              <div className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
            </div>
          </div>

          {/* Terminal text area */}
          <div className="p-4 font-mono text-[10.5px] leading-relaxed max-h-[160px] overflow-y-auto min-h-[120px] flex flex-col gap-1 text-left scrollbar-thin">
            {activeLogs.map((log, idx) => (
              <div key={idx} className="flex items-start gap-2 animate-fade-in">
                <span className="text-zinc-600 font-bold select-none">{log.timeOffset}</span>
                <span className={`px-1 rounded text-[9px] font-bold tracking-wide uppercase select-none ${
                  log.module === 'LLM' || log.module === 'AI' 
                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/15'
                    : log.module === 'MAP' || log.module === 'VAL'
                    ? 'bg-amber-500/10 text-amber-400 border border-amber-500/15'
                    : 'bg-white/5 text-zinc-400 border border-white/10'
                }`}>
                  {log.module}
                </span>
                <span className={`${log.style}`}>{log.message}</span>
              </div>
            ))}
            
            {/* Active cursor blinking at the end of the logs */}
            {clampedProgress < 100 ? (
              <div className="flex items-center gap-2 text-emerald-400 font-bold select-none animate-pulse mt-0.5">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="cursor-blink text-[10px]">Awaiting next batch</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold select-none mt-1 animate-fade-in">
                <span>[SYS] Pipeline process exited successfully (0)</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
