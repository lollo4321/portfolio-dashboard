import { create } from 'zustand';
import type { PriceMap } from '@/types';

interface PricesState {
  prices: PriceMap;
  lastUpdated: string | null;
  isLoading: boolean;
  error: string | null;
  setPrices: (prices: PriceMap) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

// Mock prices matching the mock holdings in portfolioStore.
// EUR_CASH price is always 1 (1 EUR = 1 EUR) — no market feed needed.
const MOCK_PRICES: PriceMap = {
  AAPL: 189,
  VOO: 445,
  'BTC-USD': 62000,
  'ETH-USD': 3100,
  EUR_CASH: 1,
};

// Prices are not persisted — they should always be refreshed on load.
export const usePricesStore = create<PricesState>()((set) => ({
  prices: MOCK_PRICES,
  lastUpdated: new Date().toISOString(),
  isLoading: false,
  error: null,
  setPrices: (prices) =>
    set({ prices, lastUpdated: new Date().toISOString(), error: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
