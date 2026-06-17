"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertTriangle } from "lucide-react";

interface DwhPreviewDialogProps {
  tableName: string | null;
  onClose: () => void;
}

interface PreviewData {
  columns: string[];
  rows: Record<string, any>[];
}

export function DwhPreviewDialog({ tableName, onClose }: DwhPreviewDialogProps) {
  const [data, setData] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tableName) {
      setData(null);
      setError(null);
      return;
    }

    let ignore = false;
    setLoading(true);
    setError(null);
    setData(null);

    fetch(`/api/cc/dwh/preview/${encodeURIComponent(tableName)}`)
      .then((res) => {
        if (!res.ok) throw new Error("Error al obtener la vista previa");
        return res.json();
      })
      .then((json) => {
        if (ignore) return;
        if (json.error) {
          setError(json.error);
        } else {
          setData(json);
        }
      })
      .catch((err) => {
        if (!ignore) setError(err.message);
      })
      .finally(() => {
        if (!ignore) setLoading(false);
      });

    return () => {
      ignore = true;
    };
  }, [tableName]);

  return (
    <Dialog open={!!tableName} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Vista previa: {tableName}</DialogTitle>
          <DialogDescription>Mostrando las primeras 10 filas de la tabla.</DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto mt-4 rounded-md border border-[var(--color-border)]">
          {loading ? (
            <div className="p-4 space-y-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : error ? (
            <div className="p-6 flex items-center gap-3 text-[var(--color-destructive)] bg-[color-mix(in_oklab,var(--color-destructive)_10%,transparent)]">
              <AlertTriangle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          ) : data && data.columns.length > 0 ? (
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b border-[var(--color-border)] bg-[var(--color-surface-2)]">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    {data.columns.map((col) => (
                      <th key={col} className="h-10 px-4 text-left align-middle font-medium text-muted-foreground whitespace-nowrap font-mono text-xs">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {data.rows.map((row, i) => (
                    <tr key={i} className="border-b border-[var(--color-border)] transition-colors hover:bg-[var(--color-surface-2)] data-[state=selected]:bg-muted">
                      {data.columns.map((col) => (
                        <td key={col} className="p-4 align-middle whitespace-nowrap font-mono text-xs max-w-[300px] truncate" title={String(row[col] ?? "")}>
                          {row[col] === null ? (
                            <span className="text-[var(--color-text-muted)] italic">null</span>
                          ) : (
                            String(row[col])
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {data.rows.length === 0 && (
                    <tr>
                      <td colSpan={data.columns.length} className="p-4 align-middle text-center py-6 text-[var(--color-text-muted)]">
                        La tabla está vacía.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : (
             <div className="p-6 text-center text-[var(--color-text-muted)]">No se encontraron columnas.</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
