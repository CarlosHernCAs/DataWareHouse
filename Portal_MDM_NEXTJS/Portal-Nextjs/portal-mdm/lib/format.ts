const dateFmt = new Intl.DateTimeFormat("es-PE", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const dateTimeFmt = new Intl.DateTimeFormat("es-PE", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const numberFmt = new Intl.NumberFormat("es-PE");

export function formatDate(iso: string): string {
  try {
    return dateFmt.format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatDateTime(iso: string): string {
  try {
    return dateTimeFmt.format(new Date(iso));
  } catch {
    return iso;
  }
}

export function formatNumber(n: number): string {
  return numberFmt.format(n);
}

export function formatPercent(n: number, fractionDigits = 1): string {
  return `${n.toFixed(fractionDigits)}%`;
}

export function formatDuration(sec: number | null): string {
  if (sec == null) return "—";
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return s === 0 ? `${m}m` : `${m}m ${s.toString().padStart(2, "0")}s`;
}

/**
 * Normaliza un string para búsquedas case-insensitive y accent-insensitive.
 *
 * La medición (ver `docs/decisiones/2026-06-17-catalogos-medicion.md`)
 * mostró que la collation default del DWH es `Modern_Spanish_CI_AS`
 * (accent-SENSITIVE). El cliente espejaba el mismo comportamiento al
 * usar `.toLowerCase().includes()`, así que tipear "garcia" no
 * encontraba "García". Este helper resuelve el caso client-side:
 *
 *   normalizeForSearch("García") === "garcia"
 *   normalizeForSearch("ÑOÑO")   === "nono"
 *
 * Implementación NFD + strip de marcas de combinación Unicode — la
 * técnica estándar. ~100ns por string en motores modernos, no es
 * un cuello de botella en filtros client-side.
 *
 * Para búsquedas server-side, ver el patrón
 * `COLLATE Modern_Spanish_CI_AI` aplicado en
 * `backend/repositorios/repo_catalogos.py::listar_geografia`.
 */
export function normalizeForSearch(s: string | null | undefined): string {
  if (s == null) return "";
  return s
    .toString()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase();
}
