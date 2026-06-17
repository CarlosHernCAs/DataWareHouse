"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Terminal, ListTree } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CorridaPaso } from "@/lib/schemas/control-center";
import type { LogEvent } from "@/hooks/use-etl-log-stream";

interface EtlExecutionLogProps {
  pasos: CorridaPaso[];
  logs?: LogEvent[];
  isRunning: boolean;
  className?: string;
}

function fmtTime(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleTimeString("es", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function fmtDur(sec: number | null, status: CorridaPaso["status"]): string {
  if (status === "running") return "ejecutando…";
  if (status === "queued") return "pendiente";
  if (status === "canceled") return "cancelado";
  if (sec == null) return "—";
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

const STATUS_CFG = {
  success: {
    icon: "✓",
    rowCls: "border-l-[var(--color-success)] bg-[color-mix(in_oklab,var(--color-success)_4%,transparent)]",
    iconCls: "text-[var(--color-success)]",
    nameCls: "text-[var(--color-text)]",
    durCls: "text-[var(--color-success)]",
  },
  running: {
    icon: "◉",
    rowCls: "border-l-[var(--color-info)] bg-[color-mix(in_oklab,var(--color-info)_8%,transparent)]",
    iconCls: "text-[var(--color-info)] animate-pulse",
    nameCls: "text-[var(--color-text)] font-semibold",
    durCls: "text-[var(--color-info)]",
  },
  failed: {
    icon: "✗",
    rowCls: "border-l-[var(--color-destructive)] bg-[color-mix(in_oklab,var(--color-destructive)_6%,transparent)]",
    iconCls: "text-[var(--color-destructive)]",
    nameCls: "text-[var(--color-destructive)]",
    durCls: "text-[var(--color-destructive)]",
  },
  queued: {
    icon: "○",
    rowCls: "border-l-transparent",
    iconCls: "text-[var(--color-text-muted)]",
    nameCls: "text-[var(--color-text-muted)]",
    durCls: "text-[var(--color-text-muted)]",
  },
  canceled: {
    icon: "—",
    rowCls: "border-l-transparent",
    iconCls: "text-[var(--color-text-muted)]",
    nameCls: "text-[var(--color-text-muted)] line-through",
    durCls: "text-[var(--color-text-muted)]",
  },
} satisfies Record<CorridaPaso["status"], object>;

export function EtlExecutionLog({
  pasos,
  logs = [],
  isRunning,
  className,
}: EtlExecutionLogProps) {
  const [activeTab, setActiveTab] = useState<"pasos" | "terminal">("terminal");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const sorted = [...pasos].sort((a, b) => a.orden - b.orden);

  useEffect(() => {
    if (!autoScroll || !scrollRef.current) return;
    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [pasos.length, logs.length, autoScroll, activeTab]);

  function handleScroll() {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setAutoScroll(scrollHeight - scrollTop - clientHeight < 40);
  }

  function scrollToEnd() {
    setAutoScroll(true);
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }

  const parseLogLine = (line: string) => {
    const levelMatch = line.match(/\[?(INFO|WARN|WARNING|ERROR|DEBUG|SUCCESS|CRITICAL)\]?/i);
    const level = levelMatch ? levelMatch[1].toUpperCase() : null;

    let levelColor = "text-[#a1a1aa]";
    let badgeBg = "bg-[#27272a]";
    
    if (level === "INFO") {
      levelColor = "text-[#38bdf8]";
      badgeBg = "bg-[#38bdf8]/10 border border-[#38bdf8]/20";
    } else if (level === "WARN" || level === "WARNING") {
      levelColor = "text-[#fbbf24]";
      badgeBg = "bg-[#fbbf24]/10 border border-[#fbbf24]/20";
    } else if (level === "ERROR" || level === "CRITICAL") {
      levelColor = "text-[#f87171]";
      badgeBg = "bg-[#f87171]/10 border border-[#f87171]/30";
    } else if (level === "SUCCESS") {
      levelColor = "text-[#4ade80]";
      badgeBg = "bg-[#4ade80]/10 border border-[#4ade80]/20";
    }

    if (levelMatch && levelMatch[0]) {
      const parts = line.split(levelMatch[0]);
      return (
        <span className="flex-1 break-all flex flex-wrap items-start gap-2">
          {parts[0] && <span className="text-[#a1a1aa] whitespace-pre-wrap">{parts[0]}</span>}
          <span className={cn("px-1.5 py-0.5 rounded-[4px] text-[10px] font-bold tracking-wider uppercase leading-none mt-0.5", levelColor, badgeBg)}>
            {level === "WARNING" ? "WARN" : level}
          </span>
          <span className={cn("whitespace-pre-wrap", level === "ERROR" || level === "CRITICAL" ? "text-[#f87171]" : "text-[#e4e4e7]")}>
            {parts.slice(1).join(levelMatch[0])}
          </span>
        </span>
      );
    }

    let fallbackColor = "text-[#e4e4e7]";
    if (line.includes("ERROR") || line.includes("Exception") || line.includes("Traceback")) {
      fallbackColor = "text-[#f87171]";
    } else if (line.includes("WARN")) {
      fallbackColor = "text-[#fbbf24]";
    }
    
    return <span className={cn("flex-1 break-all whitespace-pre-wrap", fallbackColor)}>{line}</span>;
  };

  const renderTerminalLogs = () => {
    if (logs.length === 0) {
      return (
        <p className="px-4 py-6 text-center font-mono text-xs text-[#52525b]">
          Esperando flujo de terminal...
        </p>
      );
    }
    
    return logs.map((log) => {
      return (
        <div 
          key={log.id} 
          className="flex gap-4 px-4 py-1.5 hover:bg-[#27272a]/50 transition-colors animate-in fade-in slide-in-from-bottom-1 duration-300"
        >
          <span className="w-[4.5rem] shrink-0 text-[#71717a] tabular-nums select-none pt-[2px]">
            {fmtTime(log.timestamp.toISOString())}
          </span>
          {parseLogLine(log.data)}
        </div>
      );
    });
  };

  return (
    <div
      className={cn(
        "flex flex-col overflow-hidden rounded-md border border-[var(--color-border)] shadow-sm",
        className,
      )}
    >
      {/* ── Tabs and Chrome ── */}
      <div className="flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-1.5">
        <div className="flex items-center gap-4">
          {/* macOS dots */}
          <div className="flex items-center gap-1.5 px-1" aria-hidden>
            <span className="h-3 w-3 rounded-full bg-[#FF5F57] border border-black/10 shadow-inner" />
            <span className="h-3 w-3 rounded-full bg-[#FFBD2E] border border-black/10 shadow-inner" />
            <span className="h-3 w-3 rounded-full bg-[#28C840] border border-black/10 shadow-inner" />
          </div>
          
          {/* Tab Switcher */}
          <div className="flex items-center rounded-md bg-[var(--color-surface)] p-0.5 border border-[var(--color-border)]/50">
            <button
              onClick={() => setActiveTab("pasos")}
              className={cn(
                "flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-medium transition-all duration-200",
                activeTab === "pasos" 
                  ? "bg-[var(--color-surface-2)] text-[var(--color-text)] shadow-sm" 
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              )}
            >
              <ListTree className="h-3.5 w-3.5" />
              Pasos
            </button>
            <button
              onClick={() => setActiveTab("terminal")}
              className={cn(
                "flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-medium transition-all duration-200",
                activeTab === "terminal" 
                  ? "bg-[var(--color-surface-2)] text-[var(--color-text)] shadow-sm" 
                  : "text-[var(--color-text-muted)] hover:text-[var(--color-text)]"
              )}
            >
              <Terminal className="h-3.5 w-3.5" />
              Consola
            </button>
          </div>

          {isRunning ? (
            <span className="flex items-center gap-1.5 text-xs">
              <span aria-hidden className="h-1.5 w-1.5 animate-ping rounded-full bg-[var(--color-info)]" />
              <span className="text-[var(--color-info)] font-medium">live</span>
            </span>
          ) : null}
        </div>

        {!autoScroll ? (
          <button
            onClick={scrollToEnd}
            className="flex items-center gap-1 rounded px-2 py-1 text-[10px] uppercase font-bold tracking-wider text-[var(--color-primary)] transition-colors hover:bg-[var(--color-primary)]/10"
            aria-label="Ir al final del log"
          >
            <ChevronDown aria-hidden className="h-3 w-3" />
            Bajar
          </button>
        ) : null}
      </div>

      {/* ── Log body ── */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        aria-label="Log de ejecución"
        aria-live={isRunning ? "polite" : "off"}
        aria-atomic="false"
        className={cn(
          "h-80 overflow-y-auto font-mono text-[11px] leading-relaxed transition-colors duration-300",
          activeTab === "terminal" ? "bg-[#09090b] text-[#fafafa] selection:bg-[#27272a] selection:text-white" : "bg-[var(--color-surface)]"
        )}
      >
        {activeTab === "pasos" ? (
          sorted.length === 0 ? (
            <p className="px-4 py-6 text-center text-xs text-[var(--color-text-muted)]">
              Esperando al runner para publicar pasos…
            </p>
          ) : (
            sorted.map((paso, idx) => {
              const cfg = STATUS_CFG[paso.status];
              const isLast = idx === sorted.length - 1;
              return (
                <div key={paso.idPaso} className="animate-in fade-in slide-in-from-left-2 duration-300">
                  <div
                    className={cn(
                      "flex items-center gap-3 border-l-2 px-4 py-3 transition-colors hover:bg-[var(--color-surface-2)]",
                      cfg.rowCls,
                      !isLast && "border-b border-[var(--color-border)]/40",
                    )}
                  >
                    <span className="w-5 shrink-0 select-none text-right text-[10px] tabular-nums text-[var(--color-text-muted)]">
                      {paso.orden}
                    </span>
                    <span aria-hidden className={cn("w-4 shrink-0 text-center text-sm leading-none", cfg.iconCls)}>
                      {cfg.icon}
                    </span>
                    <span className={cn("flex-1 truncate", cfg.nameCls)}>
                      {paso.nombre}
                    </span>
                    <span className="shrink-0 tabular-nums text-[var(--color-text-muted)]">
                      {fmtTime(paso.startedAt)}
                    </span>
                    <span className={cn("w-24 shrink-0 text-right tabular-nums", cfg.durCls)}>
                      {fmtDur(paso.durationSec, paso.status)}
                    </span>
                  </div>
                  {paso.error ? (
                    <div className="border-b border-[var(--color-border)]/40 border-l-2 border-l-[var(--color-destructive)] bg-[color-mix(in_oklab,var(--color-destructive)_5%,transparent)] px-4 py-2 pl-[3.25rem] text-[var(--color-destructive)]">
                      <span aria-hidden className="mr-2 opacity-50">└─</span>
                      {paso.error}
                    </div>
                  ) : null}
                </div>
              );
            })
          )
        ) : (
          <div className="py-2">
            {renderTerminalLogs()}
          </div>
        )}

        {/* Blinking cursor while running */}
        {isRunning ? (
          <div className={cn(
            "flex items-center gap-3 px-4 py-2 opacity-70",
            activeTab === "terminal" ? "border-none text-[#a1a1aa]" : "border-b border-[var(--color-border)]/40 text-[var(--color-text-muted)]"
          )}>
            <span className="w-5 shrink-0" />
            <span aria-hidden className="animate-pulse">
              ▋
            </span>
            <span className="animate-pulse">esperando salida...</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
