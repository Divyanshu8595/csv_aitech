'use client';

import { useState, useCallback } from 'react';
import Papa from 'papaparse';
import type {
  ImportStep,
  ParsedCsvData,
  ProcessingResult,
  ImportResponse,
  CrmLead,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface UseCsvImporterReturn {
  currentStep: ImportStep;
  file: File | null;
  parsedData: ParsedCsvData | null;
  results: ProcessingResult | null;
  error: string | null;
  progress: number;
  isProcessing: boolean;
  handleFileSelect: (file: File) => void;
  handleRemoveFile: () => void;
  handleStartProcessing: () => Promise<void>;
  handleReset: () => void;
  handleExportCsv: () => void;
  dismissError: () => void;
}

export function useCsvImporter(): UseCsvImporterReturn {
  const [currentStep, setCurrentStep] = useState<ImportStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<ParsedCsvData | null>(null);
  const [results, setResults] = useState<ProcessingResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleFileSelect = useCallback((selectedFile: File) => {
    setError(null);

    // Validate file type
    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      setError('Please select a valid CSV file.');
      return;
    }

    // Validate file size (10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File size exceeds the 10MB limit.');
      return;
    }

    // Parse CSV client-side
    Papa.parse<string[]>(selectedFile, {
      header: false,
      skipEmptyLines: true,
      complete: (result) => {
        if (result.errors.length > 0 && result.data.length === 0) {
          setError('Failed to parse CSV file. Please check the file format.');
          return;
        }

        if (result.data.length < 2) {
          setError('CSV must contain a header row and at least one data row.');
          return;
        }

        const headers = result.data[0] as string[];
        const rows = result.data.slice(1) as string[][];

        setParsedData({
          headers,
          rows,
          totalRows: rows.length,
        });

        setFile(selectedFile);
        setCurrentStep('preview');
      },
      error: (err) => {
        setError(`CSV parsing error: ${err.message}`);
      },
    });
  }, []);

  const handleRemoveFile = useCallback(() => {
    setFile(null);
    setParsedData(null);
    setError(null);
    setCurrentStep('upload');
  }, []);

  const handleStartProcessing = useCallback(async () => {
    if (!parsedData) {
      setError('No data to process.');
      return;
    }

    setError(null);
    setIsProcessing(true);
    setProgress(0);
    setCurrentStep('processing');

    // Simulate initial progress while waiting for API
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 85) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + Math.random() * 8 + 2;
      });
    }, 600);

    try {
      const response = await fetch(`${API_URL}/api/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          headers: parsedData.headers,
          rows: parsedData.rows,
        }),
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(
          errorData?.error || `Server error: ${response.status} ${response.statusText}`
        );
      }

      const data: ImportResponse = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Processing failed');
      }

      if (!data.data) {
        throw new Error('No data returned from server');
      }

      setProgress(100);

      // Brief delay to show 100% before transitioning
      await new Promise((resolve) => setTimeout(resolve, 500));

      setResults(data.data);
      setCurrentStep('results');
    } catch (err) {
      clearInterval(progressInterval);
      setError(
        err instanceof Error ? err.message : 'An unexpected error occurred'
      );
      setCurrentStep('preview');
    } finally {
      setIsProcessing(false);
    }
  }, [parsedData]);

  const handleReset = useCallback(() => {
    setCurrentStep('upload');
    setFile(null);
    setParsedData(null);
    setResults(null);
    setError(null);
    setProgress(0);
    setIsProcessing(false);
  }, []);

  const handleExportCsv = useCallback(() => {
    if (!results || results.imported.length === 0) return;

    const headers: (keyof CrmLead)[] = [
      'created_at',
      'name',
      'email',
      'country_code',
      'mobile_without_country_code',
      'company',
      'city',
      'state',
      'country',
      'lead_owner',
      'crm_status',
      'crm_note',
      'data_source',
      'possession_time',
      'description',
    ];

    const csvRows: string[] = [headers.join(',')];

    for (const lead of results.imported) {
      const row = headers.map((key) => {
        const val = lead[key];
        if (val === null || val === undefined) return '';
        // Escape quotes and wrap in quotes if contains comma/newline/quote
        const str = String(val).replace(/"/g, '""');
        if (str.includes(',') || str.includes('\n') || str.includes('"')) {
          return `"${str}"`;
        }
        return str;
      });
      csvRows.push(row.join(','));
    }

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `groweasy_import_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, [results]);

  const dismissError = useCallback(() => {
    setError(null);
  }, []);

  return {
    currentStep,
    file,
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
  };
}
