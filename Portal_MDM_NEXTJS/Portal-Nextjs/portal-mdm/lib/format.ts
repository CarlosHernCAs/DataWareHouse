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
