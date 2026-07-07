'use client';

import { useMemo } from 'react';
import { ArrowLeft, Cpu, Rows3, Columns3, Database, Hash, Mail, Phone, MapPin, Calendar, HelpCircle, FileJson } from 'lucide-react';
import type { ParsedCsvData } from '@/types';

interface PreviewTableProps {
  parsedData: ParsedCsvData;
  onConfirm: () => void;
  onBack: () => void;
  isProcessing: boolean;
}

const MAX_PREVIEW_ROWS = 100;

// Helper to determine the client-side detected column type
function detectColumnType(headerName: string, values: string[]): {
  type: string;
  icon: typeof HelpCircle;
  style: string;
} {
  const name = headerName.toLowerCase();
  
  // Extract non-empty values for heuristic checking
  const nonEmpty = values.filter(v => v && v.trim() !== '');

  // 1. Email check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (name.includes('email') || nonEmpty.some(v => emailRegex.test(v.trim()))) {
    return { type: 'EMAIL', icon: Mail, style: 'bg-violet-500/10 text-violet-400 border-violet-500/20' };
  }

  // 2. Phone check
  const phoneRegex = /^\+?[0-9\s-()]{7,20}$/;
  if (
    name.includes('phone') || 
    name.includes('mobile') || 
    name.includes('contact') || 
    nonEmpty.some(v => phoneRegex.test(v.trim()) && v.replace(/[^0-9]/g, '').length >= 7)
  ) {
    return { type: 'PHONE', icon: Phone, style: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
  }

  // 3. Location check
  if (
    name.includes('country') || 
    name.includes('city') || 
    name.includes('state') || 
    name.includes('address') || 
    name.includes('zip') || 
    name.includes('postal')
  ) {
    return { type: 'GEO', icon: MapPin, style: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
  }

  // 4. Date check
  if (
    name.includes('date') || 
    name.includes('time') || 
    name.includes('created') || 
    nonEmpty.some(v => !isNaN(Date.parse(v)) && isNaN(Number(v)) && v.length > 5)
  ) {
    return { type: 'DATE', icon: Calendar, style: 'bg-sky-500/10 text-sky-400 border-sky-500/20' };
  }

  // 5. Enumeration or Status check
  if (name.includes('status') || name.includes('source') || name.includes('owner')) {
    return { type: 'ENUM', icon: FileJson, style: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' };
  }

  // Default Fallback
  return { type: 'STRING', icon: Hash, style: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' };
}

export default function PreviewTable({
  parsedData,
  onConfirm,
  onBack,
  isProcessing,
}: PreviewTableProps) {
  const { headers, rows, totalRows } = parsedData;
  const displayRows = rows.slice(0, MAX_PREVIEW_ROWS);
  const isTruncated = totalRows > MAX_PREVIEW_ROWS;

  // Compute detected column types
  const columnTypeMeta = useMemo(() => {
    return headers.map((header, colIdx) => {
      // Gather values in this column from displayRows
      const sampleValues = displayRows.map(r => r[colIdx]);
      return detectColumnType(header, sampleValues);
    });
  }, [headers, displayRows]);

  return (
    <div className="animate-slide-up space-y-6 max-w-5xl mx-auto">
      <div className="premium-card overflow-hidden border border-white/[0.03]">
        {/* Header toolbar */}
        <div className="px-6 py-4.5 border-b border-white/[0.04] bg-white/[0.01] flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-zinc-500/5 border border-white/5 flex items-center justify-center text-zinc-400">
              <Database className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Source Data Sandbox</h2>
              <p className="text-[10px] text-zinc-500 font-medium">Verify detected columns and structural schema</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-bold uppercase tracking-wider font-mono">
              <Rows3 className="w-3.5 h-3.5" />
              {totalRows.toLocaleString()} Rows
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold uppercase tracking-wider font-mono">
              <Columns3 className="w-3.5 h-3.5" />
              {headers.length} Columns
            </span>
          </div>
        </div>

        {/* Spreadsheet container */}
        <div className="overflow-x-auto overflow-y-auto max-h-[460px] bg-obsidian/[0.2]">
          <table className="premium-table">
            <thead>
              <tr>
                <th className="w-12 text-center select-none font-mono text-zinc-600 font-bold border-r border-white/5">#</th>
                {headers.map((header, colIdx) => {
                  const meta = columnTypeMeta[colIdx];
                  const MetaIcon = meta.icon;
                  return (
                    <th key={colIdx} className="group min-w-[180px] border-r border-white/5 last:border-0">
                      <div className="flex flex-col gap-1.5 items-start">
                        {/* Column name */}
                        <span className="text-[12px] font-bold text-white truncate max-w-full">
                          {header || `Column ${colIdx + 1}`}
                        </span>
                        {/* Auto-detected badge */}
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wide border uppercase ${meta.style}`}>
                          <MetaIcon className="w-2.5 h-2.5" />
                          {meta.type}
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {displayRows.map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-white/[0.01]">
                  {/* Row Index */}
                  <td className="text-center font-mono font-bold text-[10px] text-zinc-600 bg-white/[0.01] border-r border-white/5 select-none">
                    {rowIdx + 1}
                  </td>
                  {/* Column Values */}
                  {headers.map((_header, colIdx) => (
                    <td key={colIdx} className="border-r border-white/5 last:border-0 truncate max-w-[240px]" title={row[colIdx] || ''}>
                      {row[colIdx] && row[colIdx].trim() !== '' ? (
                        <span className="font-medium text-[12px]">{row[colIdx]}</span>
                      ) : (
                        <span className="text-zinc-700 italic text-[11px]">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Truncation details */}
        {isTruncated && (
          <div className="px-6 py-3 border-t border-white/[0.04] bg-white/[0.01] text-center">
            <p className="text-[11px] text-zinc-500 font-medium">
              Display limit capped at first {MAX_PREVIEW_ROWS} rows. The remaining {(totalRows - MAX_PREVIEW_ROWS).toLocaleString()} rows will be fully parsed and structured by AI.
            </p>
          </div>
        )}

        {/* Footer controls */}
        <div className="px-6 py-4 border-t border-white/[0.04] bg-white/[0.01] flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            disabled={isProcessing}
            className="btn-secondary flex items-center gap-2 text-xs py-2 px-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isProcessing}
            className="btn-primary flex items-center gap-2 text-xs py-2 px-5"
          >
            <Cpu className="w-4 h-4" />
            Process with Gemini AI
          </button>
        </div>
      </div>
    </div>
  );
}
