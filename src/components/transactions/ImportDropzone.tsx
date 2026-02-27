import { useRef } from 'react';
import { Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  onFile: (file: File) => void;
  isDragging: boolean;
  onDragChange: (dragging: boolean) => void;
};

export function ImportDropzone({ onFile, isDragging, onDragChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault(); // required to allow dropping
    onDragChange(true);
  }

  function handleDragLeave(e: React.DragEvent) {
    // Only fire when leaving the dropzone entirely (not just moving between child elements)
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      onDragChange(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    onDragChange(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onFile(file);
    // Reset input so the same file can be selected again if needed
    e.target.value = '';
  }

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        'flex flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed p-16 cursor-pointer transition-colors select-none',
        isDragging
          ? 'border-primary bg-primary/5'
          : 'border-border hover:border-primary/50 hover:bg-muted/30',
      )}
    >
      <Upload
        className={cn('h-10 w-10', isDragging ? 'text-primary' : 'text-muted-foreground')}
      />
      <div className="text-center">
        <p className="font-medium text-foreground">
          {isDragging ? 'Release to import' : 'Drop your CSV file here'}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          or click to browse — semicolon-delimited format
        </p>
      </div>

      {/* Hidden file input — triggered by clicking the zone */}
      <input
        ref={inputRef}
        type="file"
        accept=".csv,text/csv"
        className="hidden"
        onChange={handleInputChange}
      />
    </div>
  );
}
