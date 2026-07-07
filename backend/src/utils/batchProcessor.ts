import { generateContent, Type } from '../config/gemini';
import { buildExtractionPrompt } from './promptBuilder';
import { retryWithBackoff } from './retryWithBackoff';
import {
  CrmLead,
  ProcessingResult,
  SkippedRecord,
  BatchProgress,
} from '../types';

/**
 * Splits an array into uniform-sized chunks.
 */
export function createBatches<T>(items: T[], batchSize: number = 15): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }
  return batches;
}

/**
 * The Gemini responseSchema that enforces the CRM lead structure.
 * Uses the @google/genai Type enum for proper schema definition.
 */
const CRM_LEAD_RESPONSE_SCHEMA = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      created_at: { type: Type.STRING, nullable: true },
      name: { type: Type.STRING, nullable: true },
      email: { type: Type.STRING, nullable: true },
      country_code: { type: Type.STRING, nullable: true },
      mobile_without_country_code: { type: Type.STRING, nullable: true },
      company: { type: Type.STRING, nullable: true },
      city: { type: Type.STRING, nullable: true },
      state: { type: Type.STRING, nullable: true },
      country: { type: Type.STRING, nullable: true },
      lead_owner: { type: Type.STRING, nullable: true },
      crm_status: {
        type: Type.STRING,
        nullable: true,
        enum: [
          'GOOD_LEAD_FOLLOW_UP',
          'DID_NOT_CONNECT',
          'BAD_LEAD',
          'SALE_DONE',
        ],
      },
      crm_note: { type: Type.STRING, nullable: true },
      data_source: {
        type: Type.STRING,
        nullable: true,
        enum: [
          'leads_on_demand',
          'meridian_tower',
          'eden_park',
          'varah_swamy',
          'sarjapur_plots',
        ],
      },
      possession_time: { type: Type.STRING, nullable: true },
      description: { type: Type.STRING, nullable: true },
    },
    required: [
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
    ],
  },
};

/**
 * Processes a single batch through Gemini and returns the extracted CRM leads.
 */
async function extractBatch(
  headers: string[],
  batchRows: string[][]
): Promise<CrmLead[]> {
  const prompt = buildExtractionPrompt(headers, batchRows);

  const leads = await retryWithBackoff<CrmLead[]>(async () => {
    return await generateContent<CrmLead[]>(prompt, CRM_LEAD_RESPONSE_SCHEMA);
  });

  return leads;
}

/**
 * Determines whether a lead should be skipped (no email AND no phone).
 */
function shouldSkipLead(lead: CrmLead): boolean {
  const hasEmail = lead.email !== null && lead.email.trim() !== '';
  const hasPhone =
    lead.mobile_without_country_code !== null &&
    lead.mobile_without_country_code.trim() !== '';
  return !hasEmail && !hasPhone;
}

/**
 * Processes all CSV rows sequentially in batches through Gemini AI.
 *
 * @param headers   - Array of CSV column headers
 * @param rows      - 2D array of all CSV row values
 * @param batchSize - Number of rows per batch (default 15)
 * @param onProgress - Optional callback invoked after each batch completes
 * @returns ProcessingResult with imported leads, skipped records, and totals
 */
export async function processBatchesSequentially(
  headers: string[],
  rows: string[][],
  batchSize: number = 15,
  onProgress?: (progress: BatchProgress) => void
): Promise<ProcessingResult> {
  const batches = createBatches(rows, batchSize);
  const totalBatches = batches.length;
  const totalRows = rows.length;

  const imported: CrmLead[] = [];
  const skipped: SkippedRecord[] = [];

  let processedRows = 0;
  let globalRowIndex = 0;

  for (let batchIndex = 0; batchIndex < totalBatches; batchIndex++) {
    const batch = batches[batchIndex];

    console.log(
      `[Batch ${batchIndex + 1}/${totalBatches}] Processing ${batch.length} rows...`
    );

    try {
      const extractedLeads = await extractBatch(headers, batch);

      for (let i = 0; i < extractedLeads.length; i++) {
        const lead = extractedLeads[i];
        const rowIdx = globalRowIndex + i;

        if (shouldSkipLead(lead)) {
          // Build an originalData record from headers + row values
          const originalData: Record<string, string> = {};
          const sourceRow = batch[i];
          headers.forEach((h, colIdx) => {
            originalData[h] = sourceRow?.[colIdx] ?? '';
          });

          skipped.push({
            rowIndex: rowIdx + 1, // 1-indexed for display
            originalData,
            reason: 'No email and no phone number found',
          });
        } else {
          imported.push(lead);
        }
      }
    } catch (error) {
      // If the entire batch fails after retries, mark every row as skipped
      console.error(
        `[Batch ${batchIndex + 1}/${totalBatches}] Failed after all retries:`,
        error
      );

      for (let i = 0; i < batch.length; i++) {
        const originalData: Record<string, string> = {};
        const sourceRow = batch[i];
        headers.forEach((h, colIdx) => {
          originalData[h] = sourceRow?.[colIdx] ?? '';
        });

        skipped.push({
          rowIndex: globalRowIndex + i + 1,
          originalData,
          reason: `AI extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
      }
    }

    globalRowIndex += batch.length;
    processedRows += batch.length;

    const progress: BatchProgress = {
      currentBatch: batchIndex + 1,
      totalBatches,
      processedRows,
      totalRows,
      percentComplete: Math.round((processedRows / totalRows) * 100),
    };

    console.log(
      `[Batch ${batchIndex + 1}/${totalBatches}] Complete. Progress: ${progress.percentComplete}%`
    );

    if (onProgress) {
      onProgress(progress);
    }
  }

  return {
    imported,
    skipped,
    totalProcessed: totalRows,
    totalImported: imported.length,
    totalSkipped: skipped.length,
  };
}
