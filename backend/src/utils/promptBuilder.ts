/**
 * Builds a detailed extraction prompt for Gemini that maps arbitrary CSV data
 * into the fixed CRM lead schema.
 */
export function buildExtractionPrompt(
  headers: string[],
  rows: string[][]
): string {
  // Build a readable table representation of the data
  const headerRow = headers.map((h) => h.trim()).join(' | ');
  const separator = headers.map(() => '---').join(' | ');
  const dataRows = rows
    .map((row) =>
      row
        .map((cell) =>
          // Escape embedded newlines/pipes so the table stays intact
          cell
            .replace(/\n/g, '\\n')
            .replace(/\r/g, '\\r')
            .replace(/\|/g, '\\|')
        )
        .join(' | ')
    )
    .join('\n');

  const table = `| ${headerRow} |\n| ${separator} |\n${rows
    .map(
      (row) =>
        '| ' +
        row
          .map((cell) =>
            cell
              .replace(/\n/g, '\\n')
              .replace(/\r/g, '\\r')
              .replace(/\|/g, '\\|')
          )
          .join(' | ') +
        ' |'
    )
    .join('\n')}`;

  return `You are a precise data extraction engine. Your task is to convert raw CSV data into a structured CRM lead format.

## TARGET SCHEMA

Each extracted lead MUST have exactly these fields (use null for missing/unknown values):

- created_at (string|null): Date/time in "YYYY-MM-DD HH:mm:ss" format. Convert any date format you find to this format. If only a date is present without a time, use "00:00:00" for the time portion. If no date is found, use null.
- name (string|null): Full name of the lead/contact. Combine first name and last name if they are in separate columns.
- email (string|null): PRIMARY email address only. If multiple emails exist, put the FIRST valid one here and append the rest to crm_note.
- country_code (string|null): Phone country code (e.g., "+91", "+1"). Extract from phone number if embedded. Do NOT include in mobile_without_country_code.
- mobile_without_country_code (string|null): Phone number WITHOUT the country code. Strip the country code, spaces, dashes, and parentheses. If multiple phone numbers exist, put the FIRST one here and append the rest to crm_note.
- company (string|null): Company or organization name.
- city (string|null): City name.
- state (string|null): State or province name.
- country (string|null): Country name.
- lead_owner (string|null): Name of the person who owns/manages this lead.
- crm_status (string|null): MUST be one of EXACTLY these values or null:
    * "GOOD_LEAD_FOLLOW_UP"
    * "DID_NOT_CONNECT"
    * "BAD_LEAD"
    * "SALE_DONE"
  Map existing status/stage values intelligently:
    - "interested", "qualified", "follow up", "hot", "warm" → "GOOD_LEAD_FOLLOW_UP"
    - "no answer", "not reachable", "voicemail", "did not pick", "unreachable" → "DID_NOT_CONNECT"
    - "junk", "invalid", "not interested", "do not contact", "wrong number", "duplicate" → "BAD_LEAD"
    - "closed won", "converted", "purchased", "sale", "booked", "sold" → "SALE_DONE"
  If the value does not clearly match any of the above categories, use null. NEVER invent a status value not in this list.
- crm_note (string|null): Aggregate ALL of the following into this single field, separated by " | ":
    * Any secondary/additional email addresses beyond the primary
    * Any secondary/additional phone numbers beyond the primary
    * Values from columns that don't map to any other CRM field
    * Any remarks, comments, notes, or descriptions from the source data
    * Any tags, labels, or categories
  If there is nothing to aggregate, use null.
- data_source (string|null): MUST be one of EXACTLY these values or null:
    * "leads_on_demand"
    * "meridian_tower"
    * "eden_park"
    * "varah_swamy"
    * "sarjapur_plots"
  Look for these in source, campaign, project, or similar columns. Match case-insensitively. Examples:
    - "Leads On Demand" or "LOD" → "leads_on_demand"
    - "Meridian Tower" → "meridian_tower"
    - "Eden Park" → "eden_park"
    - "Varah Swamy" → "varah_swamy"
    - "Sarjapur Plots" → "sarjapur_plots"
  If the value does not clearly match any of the above, use null. NEVER invent a data_source value not in this list.
- possession_time (string|null): Expected possession or delivery timeline.
- description (string|null): Main description or summary of the lead if a dedicated description column exists. Do NOT duplicate crm_note content here.

## STRICT RULES

1. ENUM CLAMPING: crm_status and data_source MUST ONLY use the exact enum values listed above or null. No other values are permitted under any circumstances.
2. MULTI-VALUE HANDLING: When a row has multiple emails or phones, the FIRST goes to the primary field, ALL others go into crm_note prefixed with "Additional email: " or "Additional phone: ".
3. UNMAPPED COLUMNS: Any column that cannot be mapped to the schema fields above must have its header and value appended to crm_note as "ColumnName: value".
4. ESCAPE NEWLINES: Replace any literal newline characters within field values with a space.
5. DATE FORMATTING: All dates must be converted to "YYYY-MM-DD HH:mm:ss" format. Handle common formats: DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, DD-Mon-YYYY, Unix timestamps, ISO 8601, etc.
6. NULL HANDLING: Use null (not empty string, not "null", not "N/A", not "n/a", not "-") for missing or empty values.
7. PHONE PARSING: If a phone number contains the country code (e.g., "+919876543210"), split it into country_code ("+91") and mobile_without_country_code ("9876543210").
8. Return EXACTLY one object per input row, in the same order as the input rows.

## INPUT DATA

The CSV headers are:
${JSON.stringify(headers)}

Here is the data in table format:

${table}

## OUTPUT

Return a JSON array of objects. Each object corresponds to one row of input data, in order. Every object must have all fields from the target schema.`;
}
