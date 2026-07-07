'use client';

import { Upload, Table, Cpu, CheckCircle2, LucideIcon } from 'lucide-react';
import type { ImportStep } from '@/types';

interface MultiStepProgressProps {
  currentStep: ImportStep;
}

const STEPS: {
  key: ImportStep;
  num: string;
  label: string;
  sub: string;
  icon: LucideIcon;
}[] = [
  { key: 'upload', num: '01', label: 'Upload CSV', sub: 'Source File', icon: Upload },
  { key: 'preview', num: '02', label: 'Preview Data', sub: 'Validate Schema', icon: Table },
  { key: 'processing', num: '03', label: 'AI Processing', sub: 'Gemini Structuring', icon: Cpu },
  { key: 'results', num: '04', label: 'Results', sub: 'CRM Sync Ready', icon: CheckCircle2 },
];

const STEP_ORDER: ImportStep[] = ['upload', 'preview', 'processing', 'results'];

function getStepIndex(step: ImportStep): number {
  return STEP_ORDER.indexOf(step);
}

export default function MultiStepProgress({
  currentStep,
}: MultiStepProgressProps) {
  const currentIndex = getStepIndex(currentStep);

  return (
    <div className="w-full max-w-4xl mx-auto px-4">
      <div className="premium-card p-6 border border-white/[0.03]">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 md:gap-4 relative">
          
          {/* Connecting line (behind nodes, only visible on desktop) */}
          <div className="absolute top-[28px] left-[6%] right-[6%] h-[2px] bg-white/[0.04] hidden md:block" />
          <div
            className="absolute top-[28px] left-[6%] h-[2px] bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-700 ease-out hidden md:block"
            style={{
              width: `${currentIndex === 0 ? 0 : (currentIndex / (STEPS.length - 1)) * 88}%`,
              boxShadow: '0 0 10px rgba(16, 185, 129, 0.4)',
            }}
          />

          {STEPS.map((step, index) => {
            const isCompleted = index < currentIndex;
            const isActive = index === currentIndex;
            const isFuture = index > currentIndex;
            const Icon = step.icon;

            return (
              <div
                key={step.key}
                className="flex-1 flex md:flex-col items-center gap-4 md:gap-2.5 relative z-10 text-left md:text-center"
              >
                {/* Visual Circle Node */}
                <div
                  className={`
                    w-12 h-12 rounded-xl flex items-center justify-center
                    transition-all duration-500 ease-out border
                    ${
                      isCompleted
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-lg shadow-emerald-500/5'
                        : isActive
                          ? 'bg-emerald-500/20 border-emerald-400 text-white shadow-lg shadow-emerald-500/15 animate-pulse-glow'
                          : 'bg-white/[0.02] border-white/5 text-zinc-500'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                </div>

                {/* Text Labels */}
                <div className="flex flex-col">
                  {/* Step ID */}
                  <span className={`text-[9px] font-mono font-bold tracking-widest uppercase ${
                    isActive || isCompleted ? 'text-emerald-400/80' : 'text-zinc-600'
                  }`}>
                    STAGE {step.num}
                  </span>
                  {/* Step Title */}
                  <span
                    className={`
                      text-sm font-bold tracking-tight transition-colors duration-300 mt-0.5
                      ${
                        isCompleted
                          ? 'text-zinc-300'
                          : isActive
                            ? 'text-white font-extrabold'
                            : 'text-zinc-500'
                      }
                    `}
                  >
                    {step.label}
                  </span>
                  {/* Step Subtext */}
                  <span className="text-[10px] text-zinc-500 font-medium md:mt-0.5">
                    {step.sub}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
