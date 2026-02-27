import Papa from 'papaparse';
import type { ImportPreviewRow } from '@/types';

// ─── cleanValue ───────────────────────────────────────────────────────────────

/**
 * Converts a European-formatted number string (as found in broker CSV exports)
 * into a JavaScript float.
 *
 * The broker format uses:
 *   - Periods  as thousands separators:  "50.353,30"  → 50353.30
 *   - Commas   as decimal separators:    "0,013756"   → 0.013756
 *   - Currency symbols with spaces:      " $692,66 "  → 692.66
 *
 * This function must be called on every numeric field from the CSV before use.
 * Returns NaN if the string cannot be parsed (caller should validate).
 */
export function cleanValue(raw: string): number {
  // Step 1 — Remove leading/trailing whitespace.
  //   Values in the CSV are often padded: " $692,66 " → "$692,66"
  let s = raw.trim();

  // Step 2 — Strip currency symbols ($, €, £, ¥).
  //   The Amount column mixes USD/EUR symbols: "$692,66" → "692,66"
  s = s.replace(/[$€£¥]/g, '');

  // Step 3 — Trim again: symbol removal may leave inner spaces.
  //   e.g. "$ 692,66" → " 692,66" → "692,66"
  s = s.trim();

  // Step 4 — Remove ALL period characters.
  //   In European format, the period is ONLY a thousands separator, never a decimal point.
  //   Removing every period is therefore safe for this CSV source.
  //   "50.353,30" → "50353,30"  |  "692,66" → "692,66" (no change)
  s = s.replace(/\./g, '');

  // Step 5 — Replace the decimal comma with a decimal point.
  //   JavaScript's parseFloat expects a period as the decimal separator.
  //   "50353,30" → "50353.30"  |  "0,013756" → "0.013756"
  s = s.replace(',', '.');

  // Step 6 — Parse to float. Returns NaN for empty strings or malformed input.
  return parseFloat(s);
}

// ─── parseDate ────────────────────────────────────────────────────────────────

/**
 * Converts a date string in DD-MM-YY format to ISO 8601 (YYYY-MM-DD).
 * Returns null if the input cannot be parsed or produces an invalid date.
 *
 * Two-digit year heuristic (common convention):
 *   year < 70  → 2000s  ("21" → 2021)
 *   year ≥ 70  → 1900s  ("85" → 1985)
 */
export function parseDate(raw: string): string | null {
  const parts = raw.trim().split('-');
  if (parts.length !== 3) return null;

  const [dayStr, monthStr, yearStr] = parts;
  const yearNum = parseInt(yearStr, 10);
  if (isNaN(yearNum)) return null;

  const fullYear = yearNum < 70 ? 2000 + yearNum : 1900 + yearNum;
  const iso = `${fullYear}-${monthStr.padStart(2, '0')}-${dayStr.padStart(2, '0')}`;

  // Validate that the date actually exists (guards against "2021-02-30" etc.)
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;

  return iso;
}

// ─── Column validation ────────────────────────────────────────────────────────

const REQUIRED_COLUMNS = ['Date', 'Asset', 'BUY/SELL', 'Nominal', 'Price'];

function validateHeaders(fields: string[]): string | null {
  const trimmed = fields.map((f) => f.trim());
  for (const col of REQUIRED_COLUMNS) {
    if (!trimmed.includes(col)) {
      return `Missing required column: "${col}". Found: ${trimmed.join(', ')}`;
    }
  }
  return null;
}

// ─── Row parsing & validation ─────────────────────────────────────────────────

function parseRow(raw: Record<string, string>, rowIndex: number): ImportPreviewRow {
  const errors: string[] = [];

  // Date — must parse from DD-MM-YY
  const rawDate = raw['Date'] ?? '';
  const date = parseDate(rawDate);
  if (!date) errors.push(`Invalid date "${rawDate}" — expected DD-MM-YY`);

  // Ticker — required, normalised to uppercase
  const tickerRaw = (raw['Asset'] ?? '').trim();
  const ticker = tickerRaw ? tickerRaw.toUpperCase() : null;
  if (!ticker) errors.push('Asset is required');

  // Transaction type — must be BUY or SELL (case insensitive)
  const typeRaw = (raw['BUY/SELL'] ?? '').trim().toUpperCase();
  let type: 'buy' | 'sell' | null = null;
  if (typeRaw === 'BUY') type = 'buy';
  else if (typeRaw === 'SELL') type = 'sell';
  else errors.push(`BUY/SELL must be "BUY" or "SELL", got "${typeRaw}"`);

  // Quantity (Nominal column)
  const qtyRaw = raw['Nominal'] ?? '';
  const quantity = cleanValue(qtyRaw);
  if (isNaN(quantity) || quantity <= 0) {
    errors.push(`Nominal "${qtyRaw}" must be a positive number`);
  }

  // Price per unit
  const priceRaw = raw['Price'] ?? '';
  const pricePerUnit = cleanValue(priceRaw);
  if (isNaN(pricePerUnit) || pricePerUnit <= 0) {
    errors.push(`Price "${priceRaw}" must be a positive number`);
  }

  // Total amount — optional reference field (not validated, just stored)
  const amountRaw = (raw['Amount $/€'] ?? '').trim();
  const totalAmount = amountRaw ? cleanValue(amountRaw) : null;

  // Currency — trim surrounding spaces that appear in the real CSV
  const currency = (raw['CCY'] ?? '').trim();

  // Account (optional but useful for multi-account setups)
  const account = (raw['Account'] ?? '').trim();

  // Notes — concatenate Mov.Type and Note with a separator when both exist
  const movType = (raw['Mov.Type'] ?? '').trim();
  const note = (raw['Note'] ?? '').trim();
  const notes = [movType, note].filter(Boolean).join(' | ');

  return {
    rowIndex,
    date,
    ticker,
    type,
    quantity: isNaN(quantity) ? null : quantity,
    pricePerUnit: isNaN(pricePerUnit) ? null : pricePerUnit,
    totalAmount: totalAmount !== null && isNaN(totalAmount) ? null : totalAmount,
    currency,
    account,
    notes,
    isValid: errors.length === 0,
    errors,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

export type ParseCSVResult =
  | { ok: true; rows: ImportPreviewRow[] }
  | { ok: false; error: string };

/**
 * Parses a CSV file using PapaParse and validates every row.
 * Returns a discriminated union so callers can handle errors without try/catch.
 *
 * Important PapaParse options used:
 *   delimiter: ";"      — broker uses semicolons, not commas
 *   header: true        — first row is treated as column names
 *   skipEmptyLines: true — ignores blank trailing lines
 *   transformHeader     — trims whitespace from column names for safety
 */
export function parseCSV(file: File): Promise<ParseCSVResult> {
  return new Promise((resolve) => {
    Papa.parse<Record<string, string>>(file, {
      delimiter: ';',
      header: true,
      skipEmptyLines: true,
      // Trim column names so " Date " and "Date" both match
      transformHeader: (h) => h.trim(),
      complete(results) {
        const fields = results.meta.fields ?? [];
        const headerError = validateHeaders(fields);
        if (headerError) {
          resolve({ ok: false, error: headerError });
          return;
        }

        const rows = results.data.map((raw, i) => parseRow(raw, i + 1));
        resolve({ ok: true, rows });
      },
      error(err) {
        resolve({ ok: false, error: err.message });
      },
    });
  });
}
