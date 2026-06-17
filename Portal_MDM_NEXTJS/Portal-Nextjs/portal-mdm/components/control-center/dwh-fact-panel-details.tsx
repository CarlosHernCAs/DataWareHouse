"use client";

/**
 * components/control-center/dwh-fact-panel-details.tsx
 * =====================================================
 * Sub-vistas de contenido para DwhFactPanel.
 *
 * - `FactDetail`    — muestra estrategia, fuentes, deps y marts de un fact.
 * - `NonFactDetail` — muestra los facts asociados a nodos Bronce/Gold.
 *
 * Ambos son puramente presentacionales: reciben datos ya tipados y
 * delegan el render atómico a `dwh-fact-panel-primitives`.
 */

import { Database, GitBranch, Layers } from "lucide-react";
import type { DwhNode, FactSummary } from "@/lib/schemas/dwh";
import { Section, TableList, Empty } from "./dwh-fact-panel-primitives";

/* ── FactDetail ──────────────────────────────────────────────────────────── */

export function FactDetail({ fact }: { fact: FactSummary }) {
  return (
    <>
      <Section title="Estrategia de rerun">
        <p className="text-sm text-[var(--color-text-secondary)]">
          {fact.estrategiaRerun}
        </p>
      </Section>

      <Section title="Fuentes Bronce" icon={<Database className="h-3.5 w-3.5" />}>
        {fact.fuentesBronce.length === 0 ? (
          <Empty>No declara fuentes Bronce</Empty>
        ) : (
          <TableList items={fact.fuentesBronce} />
        )}
      </Section>

      {fact.dependencias.length > 0 ? (
        <Section
          title="Dependencias de facts"
          icon={<GitBranch className="h-3.5 w-3.5" />}
        >
          <TableList items={fact.dependencias} />
        </Section>
      ) : null}

      <Section title="Marts Gold" icon={<Layers className="h-3.5 w-3.5" />}>
        {fact.marts.length === 0 ? (
          <Empty>No genera marts Gold</Empty>
        ) : (
          <TableList items={fact.marts} />
        )}
      </Section>
    </>
  );
}

/* ── NonFactDetail ───────────────────────────────────────────────────────── */

export function NonFactDetail({ node }: { node: DwhNode }) {
  return (
    <Section
      title={
        node.layer === "bronce"
          ? "Facts que consumen esta tabla"
          : "Facts que alimentan este mart"
      }
      icon={
        node.layer === "bronce" ? (
          <Database className="h-3.5 w-3.5" />
        ) : (
          <Layers className="h-3.5 w-3.5" />
        )
      }
    >
      {node.facts.length === 0 ? (
        <Empty>Sin facts asociados</Empty>
      ) : (
        <TableList items={node.facts} />
      )}
    </Section>
  );
}
