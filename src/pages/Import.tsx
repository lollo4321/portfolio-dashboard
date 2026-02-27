import { useState, useRef } from 'react';
import { CheckCircle, Download, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ImportDropzone } from '@/components/transactions/ImportDropzone';
import { PreviewTable } from '@/components/transactions/PreviewTable';
import { parseCSV } from '@/services/csvImporter';
import { usePortfolioStore } from '@/stores/portfolioStore';
import type { ImportPreviewRow, ImportResult, Transaction } from '@/types';

// Sample CSV matching the exact broker export format — used for the template download
const SAMPLE_CSV =
  'Date;Account;Asset;BUY/SELL;Nominal;Amount $/\u20ac;Price;CCY;Mov.Type;Note\n' +
  '01-09-21;BTC_LEDGER;BTC;BUY;0,013756; $692,66 ; $50.353,30 ; USD ;PTF;\n' +
  '03-10-21;BTC_LEDGER;BTC;BUY;0,0026; $129,07 ; $49.642,31 ; USD ;PTF;\n' +
  '15-11-21;BROKER;AAPL;BUY;5; $875,00 ; $175,00 ; USD ;PTF;Sample Apple buy';

export function Import() {
  const [previewRows, setPreviewRows] = useState<ImportPreviewRow[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const importTransactions = usePortfolioStore((s) => s.importTransactions);

  // Unused ref just keeps the reset function stable — avoids a stale closure warning
  const resetRef = useRef(handleReset);
  resetRef.current = handleReset;

  const hasErrors = previewRows.some((r) => !r.isValid);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  async function handleFile(file: File) {
    setIsLoading(true);
    setParseError(null);
    setImportResult(null);

    const result = await parseCSV(file);
    setIsLoading(false);

    if (!result.ok) {
      setParseError(result.error);
      return;
    }
    setPreviewRows(result.rows);
  }

  function handleConfirm() {
    const valid = previewRows.filter((r) => r.isValid);
    const errorCount = previewRows.length - valid.length;

    // Build Transaction objects from the valid preview rows.
    // Non-null assertions are safe here because we only include isValid rows.
    const transactions: Transaction[] = valid.map((r) => ({
      id: crypto.randomUUID(),
      date: r.date!,
      ticker: r.ticker!,
      type: r.type!,
      quantity: r.quantity!,
      pricePerUnit: r.pricePerUnit!,
      currency: r.currency,
      fees: 0,
      notes: r.notes || undefined,
      account: r.account || undefined,
      totalAmount: r.totalAmount ?? undefined,
    }));

    const { imported, skipped } = importTransactions(transactions);
    setImportResult({ imported, skipped, errors: errorCount });
    setPreviewRows([]);
  }

  function handleReset() {
    setPreviewRows([]);
    setImportResult(null);
    setParseError(null);
  }

  function downloadTemplate() {
    const blob = new Blob([SAMPLE_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'portfolio_template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Import CSV</h2>
        <Button variant="outline" size="sm" onClick={downloadTemplate}>
          <Download className="h-4 w-4" />
          Download Template
        </Button>
      </div>

      {/* Top-level parse error — wrong file / missing columns */}
      {parseError && (
        <Card className="mb-4 border-red-200 bg-red-50">
          <CardContent className="pt-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-red-800">Could not parse file</p>
              <p className="text-sm text-red-700 mt-1">{parseError}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success banner after confirmed import */}
      {importResult && (
        <Card className="mb-6 border-green-200 bg-green-50">
          <CardContent className="pt-4 flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-green-800">Import complete</p>
                <p className="text-sm text-green-700 mt-1">
                  <strong>{importResult.imported}</strong> transactions imported
                  {importResult.skipped > 0 && (
                    <>
                      {' · '}
                      <strong>{importResult.skipped}</strong> skipped (duplicates)
                    </>
                  )}
                  {importResult.errors > 0 && (
                    <>
                      {' · '}
                      <strong>{importResult.errors}</strong> rows had errors and were skipped
                    </>
                  )}
                </p>
                <p className="text-xs text-green-600 mt-1">
                  Dashboard now reflects your imported data.
                </p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleReset}>
              Import another file
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading indicator */}
      {isLoading && (
        <p className="text-muted-foreground text-sm mb-4 animate-pulse">Parsing file…</p>
      )}

      {/* Preview table + confirm / cancel buttons */}
      {previewRows.length > 0 && (
        <div className="space-y-4">
          <PreviewTable rows={previewRows} />

          {hasErrors && (
            <p className="text-sm text-red-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              Fix the highlighted rows before importing. Re-upload the corrected file.
            </p>
          )}

          <div className="flex items-center gap-3">
            {/* Disabled when any row has a validation error */}
            <Button onClick={handleConfirm} disabled={hasErrors}>
              Confirm Import
            </Button>
            <Button variant="outline" onClick={handleReset}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Idle state: show dropzone only when nothing else is displayed */}
      {!previewRows.length && !importResult && !isLoading && (
        <ImportDropzone
          onFile={handleFile}
          isDragging={isDragging}
          onDragChange={setIsDragging}
        />
      )}

      {/* Inline format reference */}
      <div className="mt-8 rounded-lg bg-muted p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground mb-2">Expected CSV format</p>
        <code className="text-xs block whitespace-pre font-mono leading-relaxed">
          {'Date;Account;Asset;BUY/SELL;Nominal;Amount $/€;Price;CCY;Mov.Type;Note\n'}
          {'01-09-21;BTC_LEDGER;BTC;BUY;0,013756; $692,66 ; $50.353,30 ; USD ;PTF;'}
        </code>
        <ul className="mt-3 space-y-1 text-xs list-disc list-inside">
          <li>Delimiter: semicolon (;)</li>
          <li>Date format: DD-MM-YY</li>
          <li>Numbers: European format — comma = decimal, period = thousands</li>
          <li>Currency symbols ($, €) are stripped automatically</li>
        </ul>
      </div>
    </div>
  );
}
