import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Holding, Transaction } from '@/types';
import { buildHoldingsFromTransactions } from '@/services/calculations';

interface PortfolioState {
  holdings: Holding[];
  transactions: Transaction[];
  setHoldings: (holdings: Holding[]) => void;
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (transaction: Transaction) => void;
  /**
   * Merges new transactions into the store (deduplicating by date+ticker+quantity),
   * then rebuilds holdings using the Weighted Average Cost Basis algorithm.
   * Returns a summary of what happened.
   */
  importTransactions: (
    newTxs: Transaction[],
  ) => { imported: number; skipped: number };
}

// Mock data seeded for the MVP. Will be replaced by CSV import in a later session.
// Cash is modelled as: quantity = face value in EUR, avgCostBasis = 1 (1 EUR = 1 EUR).
// This keeps the calculation engine uniform for all asset classes.
const MOCK_HOLDINGS: Holding[] = [
  {
    id: '1',
    ticker: 'AAPL',
    name: 'Apple Inc.',
    assetClass: 'stock',
    quantity: 10,
    avgCostBasis: 150,
    currency: 'EUR',
  },
  {
    id: '2',
    ticker: 'VOO',
    name: 'Vanguard S&P 500 ETF',
    assetClass: 'etf',
    quantity: 5,
    avgCostBasis: 380,
    currency: 'EUR',
  },
  {
    id: '3',
    ticker: 'BTC-USD',
    name: 'Bitcoin',
    assetClass: 'crypto',
    quantity: 0.5,
    avgCostBasis: 28000,
    currency: 'EUR',
  },
  {
    id: '4',
    ticker: 'ETH-USD',
    name: 'Ethereum',
    assetClass: 'crypto',
    quantity: 3,
    avgCostBasis: 1800,
    currency: 'EUR',
  },
  {
    id: '5',
    ticker: 'EUR_CASH',
    name: 'EUR Cash',
    assetClass: 'cash',
    quantity: 5000, // 5000 units of EUR
    avgCostBasis: 1, // 1 EUR per unit — cost = face value, P&L always 0
    currency: 'EUR',
  },
];

export const usePortfolioStore = create<PortfolioState>()(
  // persist saves to localStorage so holdings survive a page refresh
  persist(
    (set, get) => ({
      holdings: MOCK_HOLDINGS,
      transactions: [],

      setHoldings: (holdings) => set({ holdings }),
      setTransactions: (transactions) => set({ transactions }),
      addTransaction: (transaction) =>
        set((state) => ({ transactions: [...state.transactions, transaction] })),

      importTransactions: (newTxs) => {
        const state = get();

        // Deduplication key: date + ticker + quantity.
        // This catches the same trade imported twice from the same file.
        const existingKeys = new Set(
          state.transactions.map((t) => `${t.date}|${t.ticker}|${t.quantity}`),
        );

        const unique = newTxs.filter(
          (t) => !existingKeys.has(`${t.date}|${t.ticker}|${t.quantity}`),
        );
        const skipped = newTxs.length - unique.length;

        const merged = [...state.transactions, ...unique];

        // Rebuild holdings from scratch using all transactions (including the new ones).
        // This ensures avgCostBasis is always the correct weighted average.
        const rebuilt = buildHoldingsFromTransactions(merged);

        set({ transactions: merged, holdings: rebuilt });

        return { imported: unique.length, skipped };
      },
    }),
    { name: 'portfolio-storage' },
  ),
);
