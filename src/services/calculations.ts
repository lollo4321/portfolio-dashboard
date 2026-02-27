import type { Holding, HoldingWithValue, PriceMap, PortfolioSummary } from '@/types';

/**
 * Enriches raw holdings with computed values (price, P&L, weight).
 * All price lookups go through the PriceMap — cash always has price 1 in the map.
 * Returns holdings sorted by value descending (largest position first).
 */
export function computeHoldingsWithValue(
  holdings: Holding[],
  prices: PriceMap,
): HoldingWithValue[] {
  // First pass: compute values to calculate weights
  const withValues = holdings.map((h) => {
    const currentPrice = prices[h.ticker] ?? 0;
    const value = currentPrice * h.quantity;
    const costBasis = h.avgCostBasis * h.quantity;
    const pnl = value - costBasis;
    const pnlPercent = costBasis > 0 ? (pnl / costBasis) * 100 : 0;
    return { ...h, currentPrice, value, costBasis, pnl, pnlPercent, weight: 0 };
  });

  const totalValue = withValues.reduce((sum, h) => sum + h.value, 0);

  // Second pass: assign portfolio weight %
  return withValues
    .map((h) => ({
      ...h,
      weight: totalValue > 0 ? (h.value / totalValue) * 100 : 0,
    }))
    .sort((a, b) => b.value - a.value);
}

export function computePortfolioSummary(
  holdingsWithValue: HoldingWithValue[],
): PortfolioSummary {
  const totalValue = holdingsWithValue.reduce((sum, h) => sum + h.value, 0);
  const totalCostBasis = holdingsWithValue.reduce((sum, h) => sum + h.costBasis, 0);
  const totalPnl = totalValue - totalCostBasis;
  const totalPnlPercent = totalCostBasis > 0 ? (totalPnl / totalCostBasis) * 100 : 0;

  return { totalValue, totalCostBasis, totalPnl, totalPnlPercent };
}
