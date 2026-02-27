import { CheckCircle, XCircle } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { formatQuantity } from '@/lib/formatters';
import type { ImportPreviewRow } from '@/types';

const PREVIEW_LIMIT = 10;

type Props = { rows: ImportPreviewRow[] };

export function PreviewTable({ rows }: Props) {
  const validCount = rows.filter((r) => r.isValid).length;
  const errorCount = rows.length - validCount;
  const preview = rows.slice(0, PREVIEW_LIMIT);

  return (
    <div className="space-y-3">
      {/* Summary line above the table */}
      <div className="flex items-center gap-4 text-sm">
        <span className="text-muted-foreground">
          {rows.length} rows parsed
          {rows.length > PREVIEW_LIMIT && ` — showing first ${PREVIEW_LIMIT}`}
        </span>
        <span className="flex items-center gap-1 text-green-600 font-medium">
          <CheckCircle className="h-3.5 w-3.5" />
          {validCount} valid
        </span>
        {errorCount > 0 && (
          <span className="flex items-center gap-1 text-red-600 font-medium">
            <XCircle className="h-3.5 w-3.5" />
            {errorCount} invalid
          </span>
        )}
      </div>

      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">#</TableHead>
              <TableHead className="w-8"></TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Asset</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="text-right">Qty</TableHead>
              <TableHead className="text-right">Price</TableHead>
              <TableHead>CCY</TableHead>
              <TableHead>Notes / Errors</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {preview.map((row) => (
              <TableRow
                key={row.rowIndex}
                className={row.isValid ? '' : 'bg-red-50 hover:bg-red-100'}
              >
                <TableCell className="text-muted-foreground text-xs">{row.rowIndex}</TableCell>
                <TableCell>
                  {row.isValid ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500" />
                  )}
                </TableCell>
                <TableCell className="font-mono text-xs">{row.date ?? '—'}</TableCell>
                <TableCell className="font-medium">{row.ticker ?? '—'}</TableCell>
                <TableCell>
                  {row.type ? (
                    <span
                      className={
                        row.type === 'buy' ? 'text-green-700 font-medium' : 'text-red-700 font-medium'
                      }
                    >
                      {row.type.toUpperCase()}
                    </span>
                  ) : (
                    '—'
                  )}
                </TableCell>
                <TableCell className="text-right font-mono text-xs">
                  {row.quantity !== null ? formatQuantity(row.quantity) : '—'}
                </TableCell>
                <TableCell className="text-right font-mono text-xs">
                  {row.pricePerUnit !== null ? row.pricePerUnit.toLocaleString('en-US') : '—'}
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{row.currency}</TableCell>
                <TableCell className="text-xs">
                  {row.isValid ? (
                    <span className="text-muted-foreground">{row.notes || '—'}</span>
                  ) : (
                    <ul className="text-red-700 space-y-0.5">
                      {row.errors.map((e, i) => (
                        <li key={i}>• {e}</li>
                      ))}
                    </ul>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
