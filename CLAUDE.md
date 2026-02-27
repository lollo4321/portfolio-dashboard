# CLAUDE.md — Investment Portfolio Dashboard

## Project Overview
A personal web application to track and visualize an investment portfolio.
Built as a learning project to explore Claude Code capabilities.

**Key constraint:** No external backend. All data is stored locally (localStorage + JSON files).
Price updates via a lightweight Yahoo Finance proxy (client-side only).

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | React 18 + TypeScript | Vite as build tool |
| UI Components | shadcn/ui + Tailwind CSS | Prefer shadcn components over custom ones |
| Charts | Recharts | Keep chart configs simple and readable |
| State Management | Zustand | One store per domain (portfolio, prices, ui) |
| Data Persistence | localStorage | JSON serialization, no external DB |
| Price Data | Yahoo Finance (yfinance proxy) | Via a local Vite proxy to avoid CORS |
| CSV Import | PapaParse | For parsing transaction files |

---

## Asset Classes Supported

- **Stocks & ETFs** — identified by ticker symbol (e.g. AAPL, VOO)
- **Cryptocurrencies** — identified by symbol (e.g. BTC, ETH). Prices from Yahoo Finance using `-USD` suffix (BTC-USD)
- **Cash / Accounts** — manual entries, no price feed needed, value is always face value

---

## Project Structure
```
src/
├── components/
│   ├── dashboard/        # Main dashboard widgets (overview, charts)
│   ├── portfolio/        # Portfolio table, asset rows, allocation chart
│   ├── transactions/     # Transaction list, import modal
│   └── ui/               # shadcn auto-generated components (do not edit manually)
├── stores/
│   ├── portfolioStore.ts # Holdings, transactions, cost basis
│   ├── pricesStore.ts    # Current prices, last updated timestamp
│   └── uiStore.ts        # Sidebar state, selected views, modals
├── services/
│   ├── csvImporter.ts    # PapaParse logic, CSV format validation
│   ├── priceService.ts   # Yahoo Finance fetch + cache logic
│   └── calculations.ts   # P&L, % return, portfolio weight calculations
├── types/
│   └── index.ts          # All shared TypeScript types
├── hooks/
│   └── usePrices.ts      # Hook for fetching and refreshing prices
└── App.tsx
```

---

## Core Data Types
```typescript
type AssetClass = 'stock' | 'etf' | 'crypto' | 'cash';

type Holding = {
  id: string;
  ticker: string;         // e.g. "AAPL", "BTC-USD", "EUR_CASH"
  name: string;
  assetClass: AssetClass;
  quantity: number;
  avgCostBasis: number;   // average purchase price in EUR
  currency: string;       // e.g. "EUR", "USD"
};

type Transaction = {
  id: string;
  date: string;           // ISO 8601
  ticker: string;
  type: 'buy' | 'sell' | 'transfer_in' | 'transfer_out';
  quantity: number;
  pricePerUnit: number;
  currency: string;
  fees: number;
  notes?: string;
};
```

---

## CSV Import Format

Expected column headers for transaction import:
```
date, ticker, type, quantity, price_per_unit, currency, fees, notes
```

- `date` → ISO format preferred (YYYY-MM-DD), but also accept DD/MM/YYYY
- `type` → must be one of: buy, sell, transfer_in, transfer_out
- `fees` → optional, defaults to 0
- `notes` → optional

Claude should validate headers on import and surface clear errors if the format doesn't match.

---

## Key Features to Build (in priority order)

1. **Portfolio Overview** — total value, total P&L (absolute + %), asset allocation donut chart
2. **Holdings Table** — per-asset: current price, quantity, value, P&L, % weight
3. **CSV Import** — drag & drop or file picker, preview before confirming, error reporting
4. **Price Refresh** — manual "Refresh Prices" button, shows last updated time
5. **Transaction History** — filterable list of all imported transactions
6. **Performance Chart** — historical portfolio value over time (from transaction history)

---

## How Claude Should Work on This Project

- **Always explain** architectural or pattern choices in comments or a brief note — this is a learning project
- **Prefer explicit over clever** — readable code over optimized one-liners
- **Component size** — if a component exceeds ~150 lines, suggest splitting it
- **No premature abstraction** — don't create utilities until they're needed by at least 2 places
- **Error handling** — always handle loading and error states in UI components
- **Commits** — after completing a feature, suggest a conventional commit message (feat:, fix:, chore:)

---

## Commands
```bash
npm run dev       # Start dev server (Vite)
npm run build     # Production build
npm run lint      # ESLint check
npm run typecheck # TypeScript check without emitting
```

---

## Out of Scope (for now)

- User authentication
- Cloud sync or external database
- Broker API integrations (Degiro, Interactive Brokers, etc.)
- Tax reporting
- Real-time price streaming (polling on demand is enough)