"use client";
import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { TableStatus } from "@/lib/schemas/dwh";

export type DwhView = "lineage" | "table";
export type DwhDensity = "comfortable" | "compact";
export type DwhLayer = "bronce" | "silver" | "gold";

export const DWH_ALL_STATUSES: TableStatus[] = [
  "ok",
  "warning",
  "failed",
  "stale",
  "unknown",
];

export const DWH_ALL_LAYERS: DwhLayer[] = ["bronce", "silver", "gold"];

export interface DwhUrlSnapshot {
  view: DwhView;
  q: string;
  density: DwhDensity;
  statuses: TableStatus[];
  layers: DwhLayer[];
  collapsed: DwhLayer[];
  selectedId: string | null;
}

export interface DwhUrlState {
  view: DwhView;
  setView: (v: DwhView) => void;
  q: string;
  setQ: (v: string) => void;
  statuses: Set<TableStatus>;
  toggleStatus: (s: TableStatus) => void;
  clearStatuses: () => void;
  layers: Set<DwhLayer>;
  toggleLayer: (l: DwhLayer) => void;
  clearLayers: () => void;
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  compareId: string | null;
  setCompareId: (id: string | null) => void;
  density: DwhDensity;
  setDensity: (d: DwhDensity) => void;
  collapsed: Set<DwhLayer>;
  toggleCollapsedLayer: (l: DwhLayer) => void;
  expandAllLayers: () => void;
  applySnapshot: (snap: DwhUrlSnapshot) => void;
  takeSnapshot: () => DwhUrlSnapshot;
  hasFilters: boolean;
  resetAll: () => void;
}

export function useDwhUrlState(): DwhUrlState {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  const view: DwhView =
    search.get("view") === "table" ? "table" : "lineage";
  const q = search.get("q") ?? "";
  const selectedId = search.get("node");
  const compareId = search.get("cmp");
  const density: DwhDensity =
    search.get("density") === "compact" ? "compact" : "comfortable";

  const collapsed = useMemo<Set<DwhLayer>>(() => {
    const raw = search.get("collapsed");
    if (!raw) return new Set();
    const wanted = raw.split(",").filter((s): s is DwhLayer =>
      (DWH_ALL_LAYERS as string[]).includes(s),
    );
    return new Set(wanted);
  }, [search]);

  const statuses = useMemo<Set<TableStatus>>(() => {
    const raw = search.get("status");
    if (!raw) return new Set(DWH_ALL_STATUSES);
    const wanted = raw.split(",").filter((s): s is TableStatus =>
      (DWH_ALL_STATUSES as string[]).includes(s),
    );
    return wanted.length ? new Set(wanted) : new Set(DWH_ALL_STATUSES);
  }, [search]);

  const layers = useMemo<Set<DwhLayer>>(() => {
    const raw = search.get("layers");
    if (!raw) return new Set(DWH_ALL_LAYERS);
    const wanted = raw.split(",").filter((s): s is DwhLayer =>
      (DWH_ALL_LAYERS as string[]).includes(s),
    );
    return wanted.length ? new Set(wanted) : new Set(DWH_ALL_LAYERS);
  }, [search]);

  const replace = useCallback(
    // eslint-disable-next-line react-hooks/preserve-manual-memoization
    (patch: Record<string, string | null>) => {
      const next = new URLSearchParams(search.toString());
      for (const [k, v] of Object.entries(patch)) {
        if (v == null || v === "") next.delete(k);
        else next.set(k, v);
      }
      const qs = next.toString();
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router, pathname, search],
  );

  const setView = useCallback(
    (v: DwhView) => replace({ view: v === "lineage" ? null : "table" }),
    [replace],
  );
  const setQ = useCallback((v: string) => replace({ q: v || null }), [replace]);
  const setSelectedId = useCallback(
    (id: string | null) => replace({ node: id || null }),
    [replace],
  );
  const setCompareId = useCallback(
    (id: string | null) => replace({ cmp: id || null }),
    [replace],
  );
  const setDensity = useCallback(
    (d: DwhDensity) => replace({ density: d === "compact" ? "compact" : null }),
    [replace],
  );

  const toggleCollapsedLayer = useCallback(
    (l: DwhLayer) => {
      const next = new Set(collapsed);
      if (next.has(l)) next.delete(l);
      else next.add(l);
      if (next.size === DWH_ALL_LAYERS.length) next.delete(l);
      replace({ collapsed: next.size === 0 ? null : Array.from(next).join(",") });
    },
    [collapsed, replace],
  );

  const expandAllLayers = useCallback(() => replace({ collapsed: null }), [replace]);

  const toggleStatus = useCallback(
    (s: TableStatus) => {
      const isAll = statuses.size === DWH_ALL_STATUSES.length;
      const next = new Set(isAll ? [] : statuses);
      if (next.has(s)) {
        next.delete(s);
        if (next.size === 0) {
          for (const st of DWH_ALL_STATUSES) next.add(st);
        }
      } else {
        next.add(s);
        if (next.size === DWH_ALL_STATUSES.length) {
          next.clear();
          for (const st of DWH_ALL_STATUSES) next.add(st);
        }
      }
      replace({ status: next.size === DWH_ALL_STATUSES.length ? null : Array.from(next).join(",") });
    },
    [statuses, replace],
  );

  const clearStatuses = useCallback(() => replace({ status: null }), [replace]);

  const toggleLayer = useCallback(
    (l: DwhLayer) => {
      const isAll = layers.size === DWH_ALL_LAYERS.length;
      const next = new Set(isAll ? [] : layers);
      if (next.has(l)) {
        next.delete(l);
        if (next.size === 0) {
          for (const lay of DWH_ALL_LAYERS) next.add(lay);
        }
      } else {
        next.add(l);
        if (next.size === DWH_ALL_LAYERS.length) {
          next.clear();
          for (const lay of DWH_ALL_LAYERS) next.add(lay);
        }
      }
      replace({ layers: next.size === DWH_ALL_LAYERS.length ? null : Array.from(next).join(",") });
    },
    [layers, replace],
  );

  const clearLayers = useCallback(() => replace({ layers: null }), [replace]);

  const hasFilters =
    q.trim().length > 0 ||
    statuses.size !== DWH_ALL_STATUSES.length ||
    layers.size !== DWH_ALL_LAYERS.length ||
    selectedId != null ||
    compareId != null ||
    collapsed.size > 0;

  const resetAll = useCallback(() => {
    replace({
      q: null,
      status: null,
      layers: null,
      node: null,
      cmp: null,
      collapsed: null,
    });
  }, [replace]);

  const takeSnapshot = useCallback<DwhUrlState["takeSnapshot"]>(
    () => ({
      view,
      q,
      density,
      statuses: Array.from(statuses),
      layers: Array.from(layers),
      collapsed: Array.from(collapsed),
      selectedId,
    }),
    [view, q, density, statuses, layers, collapsed, selectedId],
  );

  const applySnapshot = useCallback<DwhUrlState["applySnapshot"]>(
    (snap) => {
      replace({
        view: snap.view === "lineage" ? null : snap.view,
        q: snap.q || null,
        density: snap.density === "compact" ? "compact" : null,
        status:
          snap.statuses.length === 0 ||
            snap.statuses.length === DWH_ALL_STATUSES.length
            ? null
            : snap.statuses.join(","),
        layers:
          snap.layers.length === 0 ||
            snap.layers.length === DWH_ALL_LAYERS.length
            ? null
            : snap.layers.join(","),
        collapsed: snap.collapsed.length === 0 ? null : snap.collapsed.join(","),
        node: snap.selectedId || null,
        cmp: null,
      });
    },
    [replace],
  );

  return {
    view,
    setView,
    q,
    setQ,
    statuses,
    toggleStatus,
    clearStatuses,
    layers,
    toggleLayer,
    clearLayers,
    selectedId,
    setSelectedId,
    compareId,
    setCompareId,
    density,
    setDensity,
    collapsed,
    toggleCollapsedLayer,
    expandAllLayers,
    applySnapshot,
    takeSnapshot,
    hasFilters,
    resetAll,
  };
}
