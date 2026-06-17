"use client";

/**
 * components/control-center/dwh-fact-panel-actions.tsx
 * =====================================================
 * Barras de acciones de DwhFactPanel.
 *
 * - `SecondaryActions` — botones condicionales (Explicar, Preview, Comparar).
 * - `FactActions`      — acciones de fact (Re-procesar, Descargar, Upload CSV,
 *                        Ver corridas). Solo se monta cuando `fact` está presente.
 */

import Link from "next/link";
import {
  ArrowRight,
  Database,
  Download,
  HelpCircle,
  PlayCircle,
  Split,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CsvUploader } from "./csv-uploader";
import type { DwhNode, FactSummary } from "@/lib/schemas/dwh";

/* ── SecondaryActions ────────────────────────────────────────────────────── */

interface SecondaryActionsProps {
  node: DwhNode;
  onExplain?: () => void;
  onPreview?: () => void;
  onCompare?: () => void;
}

export function SecondaryActions({
  node,
  onExplain,
  onPreview,
  onCompare,
}: SecondaryActionsProps) {
  const hasAny = onExplain || onPreview || onCompare;
  if (!hasAny) return null;

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      {onExplain && node.status !== "ok" ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onExplain}
          aria-label="¿Por qué este nodo está así?"
        >
          <HelpCircle aria-hidden className="h-4 w-4" />
          ¿Por qué está así?
        </Button>
      ) : null}
      {onPreview ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onPreview}
          aria-label="Ver muestra de datos de la tabla"
        >
          <Database aria-hidden className="h-4 w-4" />
          Vista Previa
        </Button>
      ) : null}
      {onCompare ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCompare}
          aria-label="Comparar con otro nodo"
          title="Shift+click otro nodo para comparar"
        >
          <Split aria-hidden className="h-4 w-4" />
          Comparar…
        </Button>
      ) : null}
    </div>
  );
}

/* ── FactActions ─────────────────────────────────────────────────────────── */

interface FactActionsProps {
  node: DwhNode;
  fact: FactSummary;
  onClose: () => void;
}

export function FactActions({ node, fact, onClose }: FactActionsProps) {
  return (
    <div className="mt-5 flex flex-wrap items-center gap-2">
      <Button asChild variant="primary" size="sm" onClick={onClose}>
        <Link
          href={`/etl-monitor/lanzar?fact=${encodeURIComponent(fact.nombre)}`}
        >
          <PlayCircle aria-hidden className="h-4 w-4" />
          Re-procesar
        </Link>
      </Button>
      <Button
        asChild
        variant="outline"
        size="sm"
        className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-500/20"
      >
        <a href={`/api/cc/ingesta/descargar/${node.fullName}`} download>
          <Download aria-hidden className="h-4 w-4 mr-1.5" />
          Descargar CSV
        </a>
      </Button>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Upload aria-hidden className="h-4 w-4 mr-1.5" />
            Ajustes CSV
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Subir Ajustes para {node.fullName}</DialogTitle>
            <DialogDescription>
              Sube un archivo CSV con las columnas correspondientes para
              inyectar datos manuales a esta tabla antes del procesamiento.
            </DialogDescription>
          </DialogHeader>
          <CsvUploader tablaDestino={node.fullName} />
        </DialogContent>
      </Dialog>
      <Button asChild variant="ghost" size="sm" onClick={onClose}>
        <Link href="/etl-monitor">
          Ver corridas
          <ArrowRight aria-hidden className="h-4 w-4" />
        </Link>
      </Button>
    </div>
  );
}
