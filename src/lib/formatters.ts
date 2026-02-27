// Shared formatting utilities used by SummaryBar, HoldingsTable, and AllocationChart.
// Per CLAUDE.md: extract to a utility once needed in 2+ places.

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatCurrencyCompact(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPercent(value: number, showSign = true): string {
  const sign = showSign && value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
}

export function formatQuantity(value: number): string {
  if (value % 1 === 0) return value.toLocaleString('en-US');
  return value.toLocaleString('en-US', { maximumFractionDigits: 4 });
}
