'use client';

import { useState, useMemo } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  Download,
  RotateCcw,
  Sparkles,
  Search,
  Filter,
  Check,
} from 'lucide-react';
import type { ProcessingResult, CrmLead } from '@/types';

interface ResultsTableProps {
  results: ProcessingResult;
  onReset: () => void;
  onExport: () => void;
}

type TabKey = 'imported' | 'skipped';

const CRM_HEADERS: { key: keyof CrmLead; label: string }[] = [
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email' },
  { key: 'country_code', label: 'Code' },
  { key: 'mobile_without_country_code', label: 'Phone' },
  { key: 'company', label: 'Company' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'country', label: 'Country' },
  { key: 'lead_owner', label: 'Lead Owner' },
  { key: 'crm_status', label: 'Status' },
  { key: 'data_source', label: 'Source' },
  { key: 'crm_note', label: 'CRM Note' },
  { key: 'created_at', label: 'Created At' },
  { key: 'possession_time', label: 'Possession' },
  { key: 'description', label: 'Description' },
];

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-zinc-700">—</span>;

  const config: Record<string, { bg: string; text: string; border: string }> = {
    GOOD_LEAD_FOLLOW_UP: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/20',
    },
    DID_NOT_CONNECT: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/20',
    },
    BAD_LEAD: {
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      border: 'border-rose-500/20',
    },
    SALE_DONE: {
      bg: 'bg-sky-500/10',
      text: 'text-sky-400',
      border: 'border-sky-500/20',
    },
  };

  const style = config[status] || {
    bg: 'bg-zinc-500/10',
    text: 'text-zinc-400',
    border: 'border-zinc-500/20',
  };

  const displayLabel = status
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span
      className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border whitespace-nowrap uppercase tracking-wide ${style.bg} ${style.text} ${style.border}`}
    >
      {displayLabel}
    </span>
  );
}

function SourceBadge({ source }: { source: string | null }) {
  if (!source) return <span className="text-zinc-700">—</span>;

  const label = source
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold border bg-violet-500/10 text-violet-400 border-violet-500/20 whitespace-nowrap uppercase tracking-wide">
      {label}
    </span>
  );
}

export default function ResultsTable({
  results,
  onReset,
  onExport,
}: ResultsTableProps) {
  const [activeTab, setActiveTab] = useState<TabKey>('imported');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Compute Lead Distribution metrics
  const leadDistribution = useMemo(() => {
    const counts = {
      SALE_DONE: 0,
      GOOD_LEAD_FOLLOW_UP: 0,
      DID_NOT_CONNECT: 0,
      BAD_LEAD: 0,
    };

    results.imported.forEach((lead) => {
      if (lead.crm_status && lead.crm_status in counts) {
        counts[lead.crm_status as keyof typeof counts]++;
      }
    });

    const total = results.totalImported || 1;
    return {
      SALE_DONE: { count: counts.SALE_DONE, pct: Math.round((counts.SALE_DONE / total) * 100), color: 'bg-sky-500', name: 'Sale Completed' },
      GOOD_LEAD_FOLLOW_UP: { count: counts.GOOD_LEAD_FOLLOW_UP, pct: Math.round((counts.GOOD_LEAD_FOLLOW_UP / total) * 100), color: 'bg-emerald-500', name: 'Good Lead' },
      DID_NOT_CONNECT: { count: counts.DID_NOT_CONNECT, pct: Math.round((counts.DID_NOT_CONNECT / total) * 100), color: 'bg-amber-500', name: 'No Connect' },
      BAD_LEAD: { count: counts.BAD_LEAD, pct: Math.round((counts.BAD_LEAD / total) * 100), color: 'bg-rose-500', name: 'Bad Lead' },
    };
  }, [results]);

  // Filter Imported Leads based on search and filters
  const filteredImported = useMemo(() => {
    return results.imported.filter((lead) => {
      // Search check
      const searchStr = `${lead.name || ''} ${lead.email || ''} ${lead.mobile_without_country_code || ''} ${lead.company || ''}`.toLowerCase();
      const matchesSearch = searchStr.includes(searchQuery.toLowerCase());

      // Filter check
      const matchesStatus = statusFilter === 'ALL' || lead.crm_status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [results, searchQuery, statusFilter]);

  return (
    <div className="animate-slide-up space-y-6 max-w-5xl mx-auto">
      {/* ─── Summary Dashboard Cards ──────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Processed */}
        <div className="premium-card p-5 border border-white/[0.03] flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-zinc-500/5 border border-white/5 flex items-center justify-center text-zinc-400">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-white tracking-tight tabular-nums">
              {results.totalProcessed}
            </p>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Processed Records</p>
          </div>
        </div>

        {/* Successful Imports */}
        <div className="premium-card p-5 border border-emerald-500/10 flex items-center gap-4 bg-emerald-500/[0.01]">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-emerald-400 tracking-tight tabular-nums">
              {results.totalImported}
            </p>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Imported Leads</p>
          </div>
        </div>

        {/* Skipped records */}
        <div className="premium-card p-5 border border-amber-500/10 flex items-center gap-4 bg-amber-500/[0.01]">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-2xl font-extrabold text-amber-400 tracking-tight tabular-nums">
              {results.totalSkipped}
            </p>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Skipped Records</p>
          </div>
        </div>
      </div>

      {/* ─── Stacked Import Quality Distribution Chart ───────────────────── */}
      {results.totalImported > 0 && (
        <div className="premium-card p-5 border border-white/[0.03]">
          <div className="flex items-center gap-2 mb-3.5">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">
              AI CRM-Status Lead Distribution
            </h3>
          </div>

          {/* Combined Progress bar */}
          <div className="h-3 rounded-full bg-white/5 overflow-hidden flex">
            {Object.values(leadDistribution).map((category, idx) => (
              category.count > 0 && (
                <div
                  key={idx}
                  className={`${category.color} h-full transition-all`}
                  style={{ width: `${category.pct}%` }}
                  title={`${category.name}: ${category.count} (${category.pct}%)`}
                />
              )
            ))}
          </div>

          {/* Subtext legends */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            {Object.values(leadDistribution).map((category, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${category.color}`} />
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-white tracking-tight leading-none">
                    {category.name}
                  </span>
                  <span className="text-[10px] text-zinc-500 font-semibold font-mono mt-1">
                    {category.count} leads ({category.pct}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── Main Ingest Panel ────────────────────────────────────────────── */}
      <div className="premium-card overflow-hidden border border-white/[0.03]">
        {/* Navigation Switcher */}
        <div className="flex border-b border-white/[0.04] bg-white/[0.01]">
          <button
            type="button"
            onClick={() => setActiveTab('imported')}
            className={`
              flex-1 px-6 py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all duration-200
              ${
                activeTab === 'imported'
                  ? 'text-emerald-400 border-emerald-400 bg-emerald-500/[0.02]'
                  : 'text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-white/[0.01]'
              }
            `}
          >
            Imported Sandbox ({results.totalImported})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('skipped')}
            className={`
              flex-1 px-6 py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all duration-200
              ${
                activeTab === 'skipped'
                  ? 'text-amber-400 border-amber-400 bg-amber-500/[0.02]'
                  : 'text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-white/[0.01]'
              }
            `}
          >
            Skipped / Anomalies ({results.totalSkipped})
          </button>
        </div>

        {/* ─── Filter & Search Toolbar (Only visible on Imported tab) ────── */}
        {activeTab === 'imported' && results.totalImported > 0 && (
          <div className="px-6 py-3.5 border-b border-white/[0.04] bg-white/[0.01] flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-zinc-500" />
              <input
                type="text"
                placeholder="Search leads, emails, companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="
                  w-full pl-9 pr-4 py-2 text-xs font-medium bg-obsidian/50 border border-white/10 rounded-xl
                  text-white placeholder-zinc-500 outline-none focus:border-emerald-500/40 transition-colors
                "
              />
            </div>

            {/* Filter pills */}
            <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 mr-1.5">
                <Filter className="w-3.5 h-3.5" /> Filter:
              </span>
              {['ALL', 'GOOD_LEAD_FOLLOW_UP', 'SALE_DONE', 'DID_NOT_CONNECT', 'BAD_LEAD'].map((status) => {
                const isActive = statusFilter === status;
                const label = status === 'ALL' ? 'All' : status.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={`
                      px-2.5 py-1 text-[10px] font-bold rounded-lg border uppercase transition-all
                      ${
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : 'bg-white/[0.02] text-zinc-400 border-white/5 hover:border-white/10 hover:text-zinc-300'
                      }
                    `}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Data List table area */}
        <div className="overflow-x-auto overflow-y-auto max-h-[460px]">
          {activeTab === 'imported' ? (
            filteredImported.length === 0 ? (
              <div className="p-12 text-center text-zinc-500 text-sm">
                No matching leads found.
              </div>
            ) : (
              <table className="premium-table">
                <thead>
                  <tr>
                    <th className="w-12 text-center select-none font-mono text-zinc-600 font-bold border-r border-white/5">#</th>
                    {CRM_HEADERS.map((col) => (
                      <th key={col.key} className="border-r border-white/5 last:border-0 min-w-[150px]">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filteredImported.map((lead, idx) => (
                    <tr key={idx} className="hover:bg-white/[0.01]">
                      {/* Row Index */}
                      <td className="text-center font-mono font-bold text-[10px] text-zinc-600 bg-white/[0.01] border-r border-white/5 select-none">
                        {idx + 1}
                      </td>
                      {CRM_HEADERS.map((col) => {
                        const cellValue = lead[col.key];
                        const isMobile = col.key === 'mobile_without_country_code';
                        const isEmail = col.key === 'email';
                        
                        return (
                          <td key={col.key} className="border-r border-white/5 last:border-0 truncate max-w-[200px]">
                            {col.key === 'crm_status' ? (
                              <StatusBadge status={lead.crm_status} />
                            ) : col.key === 'data_source' ? (
                              <SourceBadge source={lead.data_source} />
                            ) : cellValue !== null && cellValue !== undefined && String(cellValue).trim() !== '' ? (
                              <span
                                className={`font-semibold ${isMobile || isEmail ? 'mono-cell' : ''}`}
                                title={String(cellValue)}
                              >
                                {String(cellValue)}
                              </span>
                            ) : (
                              <span className="text-zinc-700 italic">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : results.skipped.length === 0 ? (
            <div className="p-12 text-center text-zinc-500 text-sm flex flex-col items-center justify-center gap-2">
              <Check className="w-8 h-8 text-emerald-400" />
              <p className="font-bold text-white text-base">Perfect Integrity Score</p>
              <p className="text-xs text-zinc-500">Every single row satisfied the CRM validation schema.</p>
            </div>
          ) : (
            <table className="premium-table">
              <thead>
                <tr>
                  <th className="w-16 text-center select-none font-mono text-zinc-600 font-bold border-r border-white/5">Row</th>
                  <th className="border-r border-white/5 min-w-[200px]">Reason</th>
                  {results.skipped.length > 0 &&
                    Object.keys(results.skipped[0].originalData).map((key) => (
                      <th key={key} className="border-r border-white/5 last:border-0 min-w-[150px]">
                        {key}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {results.skipped.map((record, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.01]">
                    {/* Row Index */}
                    <td className="text-center font-mono font-bold text-[10px] text-zinc-600 bg-white/[0.01] border-r border-white/5 select-none">
                      {record.rowIndex}
                    </td>
                    {/* Failure reason */}
                    <td className="border-r border-white/5">
                      <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 uppercase tracking-wide">
                        {record.reason}
                      </span>
                    </td>
                    {/* Original CSV data cells */}
                    {Object.values(record.originalData).map((val, colIdx) => (
                      <td key={colIdx} className="border-r border-white/5 last:border-0 truncate max-w-[200px]" title={val}>
                        {val && val.trim() !== '' ? (
                          <span className="font-medium">{val}</span>
                        ) : (
                          <span className="text-zinc-700 italic">—</span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer actions toolbar */}
        <div className="px-6 py-4.5 border-t border-white/[0.04] bg-white/[0.01] flex items-center justify-between flex-wrap gap-4">
          <button
            type="button"
            onClick={onReset}
            className="btn-secondary flex items-center gap-2 text-xs py-2 px-4"
          >
            <RotateCcw className="w-4 h-4" />
            Import Another File
          </button>

          <button
            type="button"
            onClick={onExport}
            disabled={results.totalImported === 0}
            className="btn-primary flex items-center gap-2 text-xs py-2 px-5"
          >
            <Download className="w-4 h-4" />
            Export CRM Data (.CSV)
          </button>
        </div>
      </div>
    </div>
  );
}
