import { Request, Response } from 'express';
import Papa from 'papaparse';
import { processBatchesSequentially } from '../utils/batchProcessor';
import { ImportResponse } from '../types';

/**
 * Health-check handler.
 * GET /api/health
 */
export function healthCheck(_req: Request, res: Response): void {
  res.json({
    status: 'ok',
    service: 'csv-importer-backend',
    timestamp: new Date().toISOString(),
  });
}

/**
 * Main import handler.
 * POST /api/import
 *
 * Accepts EITHER:
 * 1. A multipart file upload with field name "file" (CSV)
 * 2. A JSON body with { headers: string[], rows: string[][] }
 */
export async function handleImport(
  req: Request,
  res: Response
): Promise<void> {
  try {
    let headers: string[];
    let rows: string[][];

    // Determine input mode: file upload vs JSON body
    if (req.file) {
      // Mode 1: File upload – parse CSV from buffer
      const csvText = req.file.buffer.toString('utf-8');
      const parsed = Papa.parse<string[]>(csvText, {
        header: false,
        skipEmptyLines: true,
      });

      if (parsed.errors.length > 0 && parsed.data.length === 0) {
        const errorMessages = parsed.errors
          .map((e) => `Row ${e.row}: ${e.message}`)
          .join('; ');
        res.status(400).json({
          success: false,
          error: `CSV parsing failed: ${errorMessages}`,
        } as ImportResponse);
        return;
      }

      if (parsed.data.length < 2) {
        res.status(400).json({
          success: false,
          error: 'CSV must contain a header row and at least one data row',
        } as ImportResponse);
        return;
      }

      headers = parsed.data[0];
      rows = parsed.data.slice(1);
    } else if (req.body && req.body.headers && req.body.rows) {
      // Mode 2: JSON body
      headers = req.body.headers;
      rows = req.body.rows;

      if (!Array.isArray(headers) || !Array.isArray(rows)) {
        res.status(400).json({
          success: false,
          error: 'Invalid body: headers must be string[] and rows must be string[][]',
        } as ImportResponse);
        return;
      }

      if (headers.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Headers array cannot be empty',
        } as ImportResponse);
        return;
      }

      if (rows.length === 0) {
        res.status(400).json({
          success: false,
          error: 'Rows array cannot be empty',
        } as ImportResponse);
        return;
      }
    } else {
      res.status(400).json({
        success: false,
        error:
          'No data provided. Either upload a CSV file or send JSON body with { headers, rows }',
      } as ImportResponse);
      return;
    }

    // Filter out completely empty rows
    const filteredRows = rows.filter((row) =>
      row.some((cell) => cell && cell.trim() !== '')
    );

    if (filteredRows.length === 0) {
      res.status(400).json({
        success: false,
        error: 'All data rows are empty',
      } as ImportResponse);
      return;
    }

    console.log(
      `[Import] Starting processing: ${filteredRows.length} rows, ${headers.length} columns`
    );

    // Process all rows through Gemini AI in batches
    const result = await processBatchesSequentially(
      headers,
      filteredRows,
      15,
      (progress) => {
        console.log(
          `[Import] Progress: ${progress.percentComplete}% (${progress.processedRows}/${progress.totalRows})`
        );
      }
    );

    console.log(
      `[Import] Complete: ${result.totalImported} imported, ${result.totalSkipped} skipped`
    );

    res.json({
      success: true,
      data: result,
    } as ImportResponse);
  } catch (error) {
    console.error('[Import] Unhandled error:', error);

    const message =
      error instanceof Error ? error.message : 'Internal server error';

    res.status(500).json({
      success: false,
      error: message,
    } as ImportResponse);
  }
}
