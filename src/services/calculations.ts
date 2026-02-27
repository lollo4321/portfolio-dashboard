import type {
  AssetClass,
  Holding,
  HoldingWithValue,
  PriceMap,
  PortfolioSummary,
  Transaction,
} from '@/types';

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

// ─── buildHoldingsFromTransactions ───────────────────────────────────────────

/**
 * Rebuilds the holdings list from a complete set of transactions.
 *
 * Uses the Weighted Average Cost Basis (WACB) method:
 *
 *   BUY:
 *     new_avgCost = (existing_qty × existing_avgCost + new_qty × new_price)
 *                  / (existing_qty + new_qty)
 *     This keeps the cost basis as the "fair average" across all buys.
 *
 *   SELL:
 *     The avgCostBasis does NOT change — only the quantity decreases.
 *     Under WACB, sells realise P&L but don't affect the remaining cost basis.
 *     (FIFO would change it, but WACB is simpler and standard for retail investors.)
 *
 * Transactions are processed in chronological order so that earlier buys
 * correctly establish the starting avgCost for later additions.
 *
 * Positions with negligible remaining quantity (< 0.000001) are excluded
 * to avoid floating-point dust after full exits.
 */
export function buildHoldingsFromTransactions(transactions: Transaction[]): Holding[] {
  // Sort ascending by date so we process buys/sells in the correct order
  const sorted = [...transactions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  type Position = { quantity: number; avgCostBasis: number; currency: string };
  const positions = new Map<string, Position>();

  for (const tx of sorted) {
    const pos = positions.get(tx.ticker);

    if (tx.type === 'buy') {
      if (!pos || pos.quantity < 0.000001) {
        // First buy for this ticker, or re-entering after a full exit
        positions.set(tx.ticker, {
          quantity: tx.quantity,
          avgCostBasis: tx.pricePerUnit,
          currency: tx.currency,
        });
      } else {
        // Add to existing position — weighted average of cost basis
        const totalQty = pos.quantity + tx.quantity;
        const newAvg =
          (pos.quantity * pos.avgCostBasis + tx.quantity * tx.pricePerUnit) / totalQty;
        positions.set(tx.ticker, { ...pos, quantity: totalQty, avgCostBasis: newAvg });
      }
    } else if (tx.type === 'sell') {
      if (pos) {
        // avgCostBasis is unchanged on a sell (WACB convention)
        positions.set(tx.ticker, {
          ...pos,
          quantity: Math.max(0, pos.quantity - tx.quantity),
        });
      }
    }
    // transfer_in / transfer_out: not modelled yet — will be added in a future session
  }

  return Array.from(positions.entries())
    .filter(([, pos]) => pos.quantity > 0.000001) // skip dust / fully-exited positions
    .map(([ticker, pos], index) => ({
      id: `tx-${index}`,
      ticker,
      name: ticker, // proper display name will come from a future asset registry
      assetClass: inferAssetClass(ticker),
      quantity: pos.quantity,
      avgCostBasis: pos.avgCostBasis,
      currency: pos.currency,
    }));
}

/**
 * Simple heuristic to infer asset class from a ticker symbol.
 * Used only inside buildHoldingsFromTransactions — not exported.
 * Will be replaced by a user-editable asset registry in a future session.
 */
function inferAssetClass(ticker: string): AssetClass {
  const t = ticker.toUpperCase();

  const CRYPTO = ['BTC', 'ETH', 'SOL', 'ADA', 'DOT', 'AVAX', 'MATIC', 'XRP', 'LTC', 'LINK'];
  const ETFS = ['VOO', 'VTI', 'SPY', 'QQQ', 'VXUS', 'IVV', 'SWRD', 'EIMI', 'CSPX'];

  if (CRYPTO.includes(t)) return 'crypto';
  if (ETFS.includes(t)) return 'etf';
  return 'stock';
}
