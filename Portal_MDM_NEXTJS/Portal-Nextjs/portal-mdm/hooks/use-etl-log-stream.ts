import { useEffect, useState, useRef } from "react";
import { SESSION_EXPIRED_EVENT } from "@/lib/api/session-events";

export interface LogEvent {
  id: string;
  type: string;
  data: string;
  timestamp: Date;
}

export function useEtlLogStream(idCorrida: string, enabled: boolean = true) {
  const [logs, setLogs] = useState<LogEvent[]>([]);
  const closedRef = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    let source: EventSource | null = null;
    let reconnectTimer: number | null = null;
    closedRef.current = false;
    let currentLogs: LogEvent[] = [];
    let pendingLogs: LogEvent[] = [];
    let rafId: number | null = null;

    const flushLogs = () => {
      if (pendingLogs.length > 0) {
        currentLogs = [...currentLogs, ...pendingLogs];
        pendingLogs = [];
        setLogs(currentLogs);
      }
      rafId = null;
    };

    const connect = () => {
      if (closedRef.current) return;
      
      const url = `/api/cc/etl/runs/${encodeURIComponent(idCorrida)}/events`;
      source = new EventSource(url, { withCredentials: true });

      const handleEvent = (e: MessageEvent, type: string) => {
        const newEvent: LogEvent = {
          id: e.lastEventId || Math.random().toString(36).slice(2),
          type,
          data: e.data,
          timestamp: new Date(),
        };
        pendingLogs.push(newEvent);
        
        if (!rafId) {
          rafId = window.requestAnimationFrame(flushLogs);
        }
      };

      source.addEventListener("log", (e) => handleEvent(e as MessageEvent, "log"));
      source.addEventListener("inicio_paso", (e) => handleEvent(e as MessageEvent, "inicio_paso"));
      source.addEventListener("fin_paso", (e) => handleEvent(e as MessageEvent, "fin_paso"));
      source.addEventListener("error", (e) => handleEvent(e as MessageEvent, "error"));
      source.addEventListener("fin", (e) => handleEvent(e as MessageEvent, "fin"));

      source.onerror = () => {
        if (closedRef.current) return;
        source?.close();
        source = null;
        reconnectTimer = window.setTimeout(connect, 3000);
      };
    };

    const onSessionExpired = () => {
      closedRef.current = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      if (rafId) window.cancelAnimationFrame(rafId);
      source?.close();
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);

    connect();

    return () => {
      closedRef.current = true;
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      if (rafId) window.cancelAnimationFrame(rafId);
      source?.close();
      window.removeEventListener(SESSION_EXPIRED_EVENT, onSessionExpired);
    };
  }, [enabled, idCorrida]);

  return logs;
}
