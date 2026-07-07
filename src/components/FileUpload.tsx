'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, Sparkles, FileText } from 'lucide-react';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
}

export default function FileUpload({ onFileSelect }: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isLoadingSample, setIsLoadingSample] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateAndSelect = useCallback(
    (file: File) => {
      setLocalError(null);

      if (!file.name.toLowerCase().endsWith('.csv')) {
        setLocalError('Only .csv files are accepted.');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setLocalError('File size must be under 10MB.');
        return;
      }

      onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        validateAndSelect(files[0]);
      }
    },
    [validateAndSelect]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        validateAndSelect(files[0]);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [validateAndSelect]
  );

  const handleBrowseClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleLoadSample = async (fileName: string) => {
    setIsLoadingSample(true);
    setLocalError(null);
    try {
      const res = await fetch(`/samples/${fileName}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const text = await res.text();
      const file = new File([text], fileName, { type: 'text/csv' });
      validateAndSelect(file);
    } catch (err) {
      console.error(err);
      setLocalError('Failed to retrieve the sample file from server.');
    } finally {
      setIsLoadingSample(false);
    }
  };

  return (
    <div className="animate-slide-up space-y-6 max-w-3xl mx-auto">
      {/* ─── Drag & Drop Dropzone Card ────────────────────────────────────── */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
        className={`
          premium-card relative cursor-pointer group p-10 sm:p-14 text-center
          border-2 border-dashed transition-all duration-300 ease-out
          ${
            isDragging
              ? 'border-emerald-400 bg-emerald-500/[0.04] scale-[1.01]'
              : 'border-white/10 hover:border-white/20 hover:bg-white/[0.01]'
          }
        `}
      >
        {/* Glow Ambient Mesh (Top-right corner) */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/10 transition-all" />

        <div className="flex flex-col items-center">
          {/* Animated Icon Ring */}
          <div
            className={`
              w-16 h-16 rounded-xl flex items-center justify-center mb-5
              border transition-all duration-300
              ${
                isDragging
                  ? 'bg-emerald-500/20 border-emerald-400 text-emerald-400 scale-110 shadow-lg shadow-emerald-500/10'
                  : 'bg-white/[0.02] border-white/10 text-zinc-400 group-hover:border-emerald-400/40 group-hover:text-emerald-400 group-hover:bg-emerald-500/5'
              }
            `}
          >
            {isDragging ? (
              <FileSpreadsheet className="w-8 h-8 animate-float" />
            ) : (
              <Upload className="w-8 h-8 group-hover:scale-105 transition-transform duration-300" />
            )}
          </div>

          {/* Prompt Header */}
          <h3 className="text-base font-bold text-white tracking-tight sm:text-lg">
            {isDragging ? 'Drop to start import' : 'Drag and drop your spreadsheet'}
          </h3>
          <p className="text-xs text-zinc-500 mt-1 max-w-sm">
            Drag your CSV here, or click to browse your local filesystem
          </p>

          {/* Divider */}
          <div className="flex items-center gap-2.5 my-5 w-full max-w-xs justify-center">
            <div className="h-[1px] w-8 bg-white/5" />
            <span className="text-[10px] text-zinc-600 font-mono tracking-widest uppercase">or</span>
            <div className="h-[1px] w-8 bg-white/5" />
          </div>

          {/* Action Trigger */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleBrowseClick();
            }}
            className="btn-primary flex items-center gap-2 text-xs py-2 px-5"
          >
            Select Local File
          </button>

          {/* Subtext info */}
          <span className="text-[10px] text-zinc-600 font-mono mt-4">
            CSV FORMATS ONLY • MAX SIZE 10MB
          </span>
        </div>

        {/* Hidden system input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          className="hidden"
          id="csv-upload-input"
        />
      </div>

      {/* ─── Local Error banner ────────────────────────────────────────────── */}
      {localError && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 animate-slide-up">
          <AlertCircle className="w-4.5 h-4.5 text-rose-400 flex-shrink-0" />
          <p className="text-sm text-rose-300/90 font-medium">{localError}</p>
        </div>
      )}

      {/* ─── Sample Shortcut Cards ─────────────────────────────────────────── */}
      <div className="mt-8 border-t border-white/[0.03] pt-6">
        <div className="flex items-center gap-2 mb-4 justify-center">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-500">
            Quick Test Shortcuts
          </h4>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card A: Facebook Messy */}
          <button
            type="button"
            disabled={isLoadingSample}
            onClick={() => handleLoadSample('facebook_messy_export.csv')}
            className="
              premium-card p-4 text-left border border-white/5
              hover:border-indigo-500/20 hover:bg-indigo-500/[0.02]
              disabled:opacity-50 disabled:cursor-not-allowed
              flex gap-3.5 items-start transition-all duration-300
            "
          >
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white tracking-tight">Facebook Export</p>
              <p className="text-[11px] text-zinc-500 font-medium mt-0.5 leading-snug">
                Simulate a messy export file with disorganized columns and varying text formats.
              </p>
            </div>
          </button>

          {/* Card B: GrowEasy Native */}
          <button
            type="button"
            disabled={isLoadingSample}
            onClick={() => handleLoadSample('groweasy_native.csv')}
            className="
              premium-card p-4 text-left border border-white/5
              hover:border-emerald-500/20 hover:bg-emerald-500/[0.02]
              disabled:opacity-50 disabled:cursor-not-allowed
              flex gap-3.5 items-start transition-all duration-300
            "
          >
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-white tracking-tight">GrowEasy Native</p>
              <p className="text-[11px] text-zinc-500 font-medium mt-0.5 leading-snug">
                Test standard structured columns for a straightforward import flow.
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
