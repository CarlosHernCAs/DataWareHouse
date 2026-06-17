"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, Loader2, XCircle, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadAndValidateCsv, ValidationResult } from "@/lib/api/ingesta";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface CsvUploaderProps {
  tablaDestino: string;
  onValidationSuccess?: (result: ValidationResult) => void;
}

export function CsvUploader({ tablaDestino, onValidationSuccess }: CsvUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState<ValidationResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setResult(null); // Reset anterior
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith(".csv")) {
        setFile(droppedFile);
        setResult(null);
      } else {
        alert("Por favor, sube solo archivos CSV.");
      }
    }
  };

  const handleValidate = async () => {
    if (!file) return;
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("archivo", file);
      formData.append("tabla_destino", tablaDestino);

      const res = await uploadAndValidateCsv(formData);
      setResult(res);
      if (res.valido && onValidationSuccess) {
        onValidationSuccess(res);
      }
    } catch (error) {
      console.error(error);
      setResult({ valido: false, error_general: "Error de red al conectar con el servidor." });
    } finally {
      setIsUploading(false);
    }
  };

  const clearSelection = () => {
    setFile(null);
    setResult(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="w-full max-w-4xl space-y-4">
      <div 
        className={cn(
          "relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-colors",
          file ? "border-[var(--color-primary)]/50 bg-[var(--color-primary)]/5" : "border-[var(--color-border)] hover:bg-[var(--color-surface-2)]/50"
        )}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          accept=".csv" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleFileChange}
        />
        
        {!file ? (
          <>
            <div className="mb-4 rounded-full bg-[var(--color-surface-2)] p-4 text-[var(--color-text-muted)]">
              <UploadCloud className="h-8 w-8" />
            </div>
            <h3 className="mb-1 text-lg font-semibold">Subir archivo para {tablaDestino}</h3>
            <p className="mb-4 text-sm text-[var(--color-text-muted)]">
              Arrastra un archivo CSV aquí o haz clic para seleccionar
            </p>
            <Button onClick={() => fileInputRef.current?.click()} variant="outline">
              Seleccionar CSV
            </Button>
          </>
        ) : (
          <div className="flex w-full items-center justify-between rounded-lg bg-[var(--color-surface)] p-4 shadow-sm border border-[var(--color-border)]/50">
            <div className="flex items-center gap-3">
              <div className="rounded-md bg-blue-500/10 p-2 text-blue-500">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <p className="font-medium text-sm">{file.name}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="ghost" onClick={clearSelection} disabled={isUploading}>
                <XCircle className="h-4 w-4 mr-1" /> Cancelar
              </Button>
              <Button size="sm" onClick={handleValidate} disabled={isUploading}>
                {isUploading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Validando...</>
                ) : (
                  "Validar con Polars"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Resultados de Validación */}
      {result && (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            {result.valido && (result.filas_con_errores?.length === 0) ? (
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            ) : (
              <AlertTriangle className="h-6 w-6 text-amber-500" />
            )}
            <h3 className="text-lg font-semibold">Diagnóstico de Ingesta</h3>
          </div>

          {!result.valido && result.error_general ? (
            <div className="rounded-md bg-red-500/10 p-4 text-sm text-red-600 dark:text-red-400">
              {result.error_general}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="flex gap-4">
                <Badge variant="outline" className="bg-[var(--color-surface-2)]">
                  Total Filas: {result.total_filas}
                </Badge>
                <Badge variant="outline" className="border-emerald-500/20 bg-emerald-500/10 text-emerald-600">
                  Válidas: {result.filas_validas?.length || 0}
                </Badge>
                <Badge variant="outline" className="border-amber-500/20 bg-amber-500/10 text-amber-600">
                  Con Errores: {result.filas_con_errores?.length || 0}
                </Badge>
              </div>

              {result.filas_con_errores && result.filas_con_errores.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2 text-[var(--color-text-muted)]">Filas que requieren revisión:</h4>
                  <div className="overflow-x-auto rounded-md border border-[var(--color-border)]">
                    <table className="w-full text-xs">
                      <thead className="bg-[var(--color-surface-2)]">
                        <tr className="text-left text-[var(--color-text-muted)]">
                          <th className="p-2 font-medium">Fila</th>
                          <th className="p-2 font-medium">Errores Detectados</th>
                          <th className="p-2 font-medium w-1/2">Datos Brutos</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--color-border)]">
                        {result.filas_con_errores.slice(0, 10).map((err, i) => (
                          <tr key={i} className="hover:bg-[var(--color-surface-2)]/50">
                            <td className="p-2 font-mono text-[var(--color-text-muted)]">#{err.fila_id}</td>
                            <td className="p-2">
                              <ul className="list-inside list-disc text-amber-600 dark:text-amber-400">
                                {err.errores.map((e, j) => <li key={j}>{e}</li>)}
                              </ul>
                            </td>
                            <td className="p-2 font-mono opacity-80 truncate max-w-[200px]">
                              {JSON.stringify(err.datos)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {result.filas_con_errores.length > 10 && (
                    <p className="text-xs text-[var(--color-text-muted)] mt-2 italic">
                      Mostrando los primeros 10 errores...
                    </p>
                  )}
                </div>
              )}

              {result.filas_con_errores?.length === 0 && (
                <div className="flex w-full flex-col items-center justify-center p-6 text-center">
                  <p className="text-sm text-[var(--color-text-muted)] mb-4">
                    Todas las filas pasaron la validación de Polars. El archivo está listo para ser ingestados al Data Warehouse.
                  </p>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    Confirmar e Inyectar a BD
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
