import { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { usePortfolioStore } from '@/stores/portfolioStore';
import { usePricesStore } from '@/stores/pricesStore';
import { computeHoldingsWithValue, computePortfolioSummary } from '@/services/calculations';
import { formatCurrency, formatPercent } from '@/lib/formatters';

export function SummaryBar() {
  const holdings = usePortfolioStore((s) => s.holdings);
  const { prices, lastUpdated } = usePricesStore();

  // Recompute only when holdings or prices change — avoids redundant recalculations
  const summary = useMemo(() => {
    const withValues = computeHoldingsWithValue(holdings, prices);
    return computePortfolioSummary(withValues);
  }, [holdings, prices]);

  const isPnlPositive = summary.totalPnl >= 0;
  const pnlColor = isPnlPositive ? 'text-green-600' : 'text-red-600';

  const lastUpdatedText = lastUpdated
    ? new Date(lastUpdated).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Never';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground mb-1">Total Value</p>
          <p className="text-2xl font-bold">{formatCurrency(summary.totalValue)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground mb-1">Total P&amp;L</p>
          <p className={`text-2xl font-bold ${pnlColor}`}>
            {formatCurrency(summary.totalPnl)}
          </p>
          <p className={`text-sm font-medium ${pnlColor}`}>
            {formatPercent(summary.totalPnlPercent)}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground mb-1">Last Updated</p>
          <p className="text-2xl font-bold">{lastUpdatedText}</p>
          <p className="text-sm text-muted-foreground">mock data</p>
        </CardContent>
      </Card>
    </div>
  );
}
