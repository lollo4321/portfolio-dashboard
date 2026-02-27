import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Holding, Transaction } from '@/types';

interface PortfolioState {
  holdings: Holding[];
  transactions: Transaction[];
  setHoldings: (holdings: Holding[]) => void;
  setTransactions: (transactions: Transaction[]) => void;
  addTransaction: (transaction: Transaction) => void;
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
    (set) => ({
      holdings: MOCK_HOLDINGS,
      transactions: [],
      setHoldings: (holdings) => set({ holdings }),
      setTransactions: (transactions) => set({ transactions }),
      addTransaction: (transaction) =>
        set((state) => ({ transactions: [...state.transactions, transaction] })),
    }),
    { name: 'portfolio-storage' },
  ),
);
