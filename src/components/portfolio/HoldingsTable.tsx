import { useMemo } from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePortfolioStore } from '@/stores/portfolioStore';
import { usePricesStore } from '@/stores/pricesStore';
import { computeHoldingsWithValue } from '@/services/calculations';
import { formatCurrency, formatPercent, formatQuantity } from '@/lib/formatters';
import type { AssetClass } from '@/types';

// Maps asset class to a Badge colour variant
const CLASS_BADGE: Record<AssetClass, 'default' | 'secondary' | 'outline'> = {
  stock: 'default',
  etf: 'secondary',
  crypto: 'outline',
  cash: 'outline',
};

export function HoldingsTable() {
  const holdings = usePortfolioStore((s) => s.holdings);
  const prices = usePricesStore((s) => s.prices);

  const rows = useMemo(
    () => computeHoldingsWithValue(holdings, prices),
    [holdings, prices],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Holdings</CardTitle>
      </CardHeader>
      {/* px-0 lets the table scroll horizontally without card padding clipping */}
      <CardContent className="px-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Ticker</TableHead>
              <TableHead>Class</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Avg Cost</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead className="text-right">Value</TableHead>
              <TableHead className="text-right">P&amp;L</TableHead>
              <TableHead className="text-right">Weight</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((h) => {
              const pnlColor = h.pnl >= 0 ? 'text-green-600' : 'text-red-600';
              return (
                <TableRow key={h.id}>
                  <TableCell className="font-medium">{h.name}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {h.ticker}
                  </TableCell>
                  <TableCell>
                    <Badge variant={CLASS_BADGE[h.assetClass]}>{h.assetClass}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatQuantity(h.quantity)}</TableCell>
                  <TableCell className="text-right">{formatCurrency(h.avgCostBasis)}</TableCell>
                  {/* Cash has no meaningful market price — show em dash */}
                  <TableCell className="text-right">
                    {h.assetClass === 'cash' ? '—' : formatCurrency(h.currentPrice)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(h.value)}
                  </TableCell>
                  <TableCell className={`text-right ${pnlColor}`}>
                    <div>{formatCurrency(h.pnl)}</div>
                    <div className="text-xs">{formatPercent(h.pnlPercent)}</div>
                  </TableCell>
                  <TableCell className="text-right text-muted-foreground">
                    {h.weight.toFixed(1)}%
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
