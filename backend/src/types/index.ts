export interface CrmLead {
  created_at: string | null;
  name: string | null;
  email: string | null;
  country_code: string | null;
  mobile_without_country_code: string | null;
  company: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  lead_owner: string | null;
  crm_status:
    | 'GOOD_LEAD_FOLLOW_UP'
    | 'DID_NOT_CONNECT'
    | 'BAD_LEAD'
    | 'SALE_DONE'
    | null;
  crm_note: string | null;
  data_source:
    | 'leads_on_demand'
    | 'meridian_tower'
    | 'eden_park'
    | 'varah_swamy'
    | 'sarjapur_plots'
    | null;
  possession_time: string | null;
  description: string | null;
}

export interface ProcessingResult {
  imported: CrmLead[];
  skipped: SkippedRecord[];
  totalProcessed: number;
  totalImported: number;
  totalSkipped: number;
}

export interface SkippedRecord {
  rowIndex: number;
  originalData: Record<string, string>;
  reason: string;
}

export interface BatchProgress {
  currentBatch: number;
  totalBatches: number;
  processedRows: number;
  totalRows: number;
  percentComplete: number;
}

export interface ImportRequest {
  headers: string[];
  rows: string[][];
}

export interface ImportResponse {
  success: boolean;
  data?: ProcessingResult;
  error?: string;
}
