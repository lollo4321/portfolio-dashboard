import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePortfolioStore } from '@/stores/portfolioStore';
import { usePricesStore } from '@/stores/pricesStore';
import { computeHoldingsWithValue } from '@/services/calculations';
import { formatCurrencyCompact } from '@/lib/formatters';
import type { AssetClass } from '@/types';

// One colour per asset class — chosen to be distinct and accessible
const CLASS_COLORS: Record<AssetClass, string> = {
  stock: '#3b82f6',  // blue-500
  etf: '#8b5cf6',   // violet-500
  crypto: '#f59e0b', // amber-500
  cash: '#10b981',   // emerald-500
};

const CLASS_LABELS: Record<AssetClass, string> = {
  stock: 'Stocks',
  etf: 'ETFs',
  crypto: 'Crypto',
  cash: 'Cash',
};

type ChartEntry = { name: string; value: number; fill: string };

export function AllocationChart() {
  const holdings = usePortfolioStore((s) => s.holdings);
  const prices = usePricesStore((s) => s.prices);

  // Group holdings by asset class, summing their EUR values
  const chartData: ChartEntry[] = useMemo(() => {
    const withValues = computeHoldingsWithValue(holdings, prices);

    const byClass = withValues.reduce<Record<string, number>>((acc, h) => {
      acc[h.assetClass] = (acc[h.assetClass] ?? 0) + h.value;
      return acc;
    }, {});

    return Object.entries(byClass).map(([cls, value]) => ({
      name: CLASS_LABELS[cls as AssetClass] ?? cls,
      value: Math.round(value * 100) / 100,
      fill: CLASS_COLORS[cls as AssetClass] ?? '#94a3b8',
    }));
  }, [holdings, prices]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Asset Allocation</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={70}   // inner hole makes it a donut
              outerRadius={110}
              paddingAngle={3}
              dataKey="value"
            >
              {chartData.map((entry) => (
                <Cell key={entry.name} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [formatCurrencyCompact(value), 'Value']}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
