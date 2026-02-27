// ─── Domain types (from CLAUDE.md) ───────────────────────────────────────────

export type AssetClass = 'stock' | 'etf' | 'crypto' | 'cash';

export type Holding = {
  id: string;
  ticker: string;       // e.g. "AAPL", "BTC-USD", "EUR_CASH"
  name: string;
  assetClass: AssetClass;
  quantity: number;
  avgCostBasis: number; // average purchase price in EUR per unit
  currency: string;     // e.g. "EUR"
};

export type Transaction = {
  id: string;
  date: string;          // ISO 8601
  ticker: string;
  type: 'buy' | 'sell' | 'transfer_in' | 'transfer_out';
  quantity: number;
  pricePerUnit: number;
  currency: string;
  fees: number;
  notes?: string;
  account?: string;      // source account column from CSV (multi-account support)
  totalAmount?: number;  // CSV Amount field — stored for future cross-validation
};

// ─── Derived / UI types ───────────────────────────────────────────────────────

// Holding enriched with computed live values — used by all UI components.
export type HoldingWithValue = Holding & {
  currentPrice: number; // latest price from pricesStore
  value: number;        // currentPrice * quantity
  costBasis: number;    // avgCostBasis * quantity
  pnl: number;          // value - costBasis
  pnlPercent: number;   // pnl / costBasis * 100
  weight: number;       // value / totalPortfolioValue * 100
};

// ticker → current price (in EUR)
export type PriceMap = Record<string, number>;

export type PortfolioSummary = {
  totalValue: number;
  totalCostBasis: number;
  totalPnl: number;
  totalPnlPercent: number;
};

// ─── CSV Import types ─────────────────────────────────────────────────────────

// One parsed + validated row shown in the import preview table.
export type ImportPreviewRow = {
  rowIndex: number;           // 1-based, for display
  // Parsed values — null means the field failed to parse
  date: string | null;        // ISO 8601 if valid
  ticker: string | null;
  type: 'buy' | 'sell' | null;
  quantity: number | null;
  pricePerUnit: number | null;
  totalAmount: number | null; // reference total from CSV
  currency: string;
  account: string;
  notes: string;
  // Validation result
  isValid: boolean;
  errors: string[];           // one error message per failing field
};

// Summary returned after the user confirms an import.
export type ImportResult = {
  imported: number;  // new transactions written to the store
  skipped: number;   // duplicates (same date + ticker + quantity already existed)
  errors: number;    // rows that had validation errors and were not imported
};
