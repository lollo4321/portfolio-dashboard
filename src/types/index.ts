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
  date: string;         // ISO 8601
  ticker: string;
  type: 'buy' | 'sell' | 'transfer_in' | 'transfer_out';
  quantity: number;
  pricePerUnit: number;
  currency: string;
  fees: number;
  notes?: string;
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
