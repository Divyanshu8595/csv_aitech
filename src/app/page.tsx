'use client';

import { Sparkles, X, Activity, Server } from 'lucide-react';
import { useCsvImporter } from '@/hooks/useCsvImporter';
import MultiStepProgress from '@/components/MultiStepProgress';
import FileUpload from '@/components/FileUpload';
import PreviewTable from '@/components/PreviewTable';
import ProcessingOverlay from '@/components/ProcessingOverlay';
import ResultsTable from '@/components/ResultsTable';

export default function Home() {
  const {
    currentStep,
    parsedData,
    results,
    error,
    progress,
    isProcessing,
    handleFileSelect,
    handleRemoveFile,
    handleStartProcessing,
    handleReset,
    handleExportCsv,
    dismissError,
  } = useCsvImporter();

  return (
    <main className="min-h-screen pb-16">
      {/* ─── Premium Header/Navbar ─────────────────────────────────────────── */}
      <header className="border-b border-white/[0.04] bg-obsidian/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo Emblem */}
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/10 border border-emerald-400/25">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            {/* Logo Text */}
            <div className="flex items-baseline gap-2">
              <span className="font-extrabold text-white tracking-tight text-lg">
                Grow<span className="text-emerald-400">Easy</span>
              </span>
              <span className="text-[10px] font-bold tracking-widest text-zinc-500 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded uppercase">
                v1.2-beta
              </span>
            </div>
          </div>

          {/* System Status Indicators */}
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/5 text-[11px] font-semibold text-zinc-400">
              <Server className="w-3.5 h-3.5 text-zinc-500" />
              API: <span className="text-emerald-400">Active</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/5 text-[11px] font-semibold text-zinc-400">
              <Activity className="w-3.5 h-3.5 text-zinc-500" />
              Model: <span className="text-emerald-400 cursor-blink">Gemini 3.5 Flash</span>
            </div>
          </div>
        </div>
      </header>

      {/* ─── Hero Section ─────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        <div className="text-center mb-8 max-w-2xl mx-auto">
          <h2 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl mb-3">
            Intelligent CSV Schema Importer
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed font-medium">
            Upload custom CSV files and map columns to your standard CRM layout in seconds using Google Gemini AI.
          </p>
        </div>

        {/* ─── Step Progress Timeline ────────────────────────────────────── */}
        <div className="mb-10">
          <MultiStepProgress currentStep={currentStep} />
        </div>

        {/* ─── Error Notification ─────────────────────────────────────────── */}
        {error && (
          <div className="mb-6 max-w-2xl mx-auto animate-slide-up">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
              <div className="flex-1">
                <p className="text-xs text-rose-400 font-bold uppercase tracking-wider">Processing Error</p>
                <p className="text-sm text-rose-300/90 mt-1">{error}</p>
              </div>
              <button
                type="button"
                onClick={dismissError}
                className="p-1 rounded-lg hover:bg-rose-500/20 transition-colors"
              >
                <X className="w-4 h-4 text-rose-400" />
              </button>
            </div>
          </div>
        )}

        {/* ─── Main Interactive Content Area ─────────────────────────────── */}
        <div className="max-w-5xl mx-auto">
          {currentStep === 'upload' && (
            <FileUpload onFileSelect={handleFileSelect} />
          )}

          {currentStep === 'preview' && parsedData && (
            <PreviewTable
              parsedData={parsedData}
              onConfirm={handleStartProcessing}
              onBack={handleRemoveFile}
              isProcessing={isProcessing}
            />
          )}

          {currentStep === 'processing' && (
            <ProcessingOverlay progress={progress} />
          )}

          {currentStep === 'results' && results && (
            <ResultsTable
              results={results}
              onReset={handleReset}
              onExport={handleExportCsv}
            />
          )}
        </div>
      </div>
    </main>
  );
}
