"use client";

import { createContext, useContext, useReducer, useCallback, useRef } from "react";
import type { ToastProps } from "@/components/ui/toast";

export interface ToastItem extends ToastProps {
  id: string;
  title?: string;
  description?: string;
  duration?: number;
  open: boolean;
}

interface ToastInput {
  title?: string;
  description?: string;
  variant?: ToastItem["variant"];
  duration?: number;
}

interface ToastContextValue {
  toasts: ToastItem[];
  toast: (input: ToastInput) => string;
  dismiss: (id: string) => void;
}

const DEFAULT_DURATION = 4000;

type Action =
  | { type: "ADD"; item: ToastItem }
  | { type: "DISMISS"; id: string }
  | { type: "REMOVE"; id: string };

function reducer(state: ToastItem[], action: Action): ToastItem[] {
  switch (action.type) {
    case "ADD":
      return [...state, action.item];
    case "DISMISS":
      return state.map((t) => (t.id === action.id ? { ...t, open: false } : t));
    case "REMOVE":
      return state.filter((t) => t.id !== action.id);
    default:
      return state;
  }
}

export const ToastContext = createContext<ToastContextValue | null>(null);

/**
 * Ventana de dedupe — si el mismo (title|description|variant) llega
 * dentro de este intervalo, se reutiliza el toast vigente en vez de
 * apilar uno idéntico. Evita spam cuando hay cascada de errores
 * (ej. 3 queries que fallan con el mismo mensaje al perder sesión).
 */
const DEDUPE_WINDOW_MS = 3000;

function fingerprint(input: ToastInput): string {
  return `${input.variant ?? "default"}|${input.title ?? ""}|${input.description ?? ""}`;
}

export function useToastState(): ToastContextValue {
  const [toasts, dispatch] = useReducer(reducer, []);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  /** fingerprint → { id, ts } del último toast emitido con esa firma. */
  const recentRef = useRef<Map<string, { id: string; ts: number }>>(new Map());

  const dismiss = useCallback((id: string) => {
    dispatch({ type: "DISMISS", id });
    const timer = setTimeout(() => {
      dispatch({ type: "REMOVE", id });
      timersRef.current.delete(id);
    }, 300); // match animation duration
    timersRef.current.set(`remove-${id}`, timer);
  }, []);

  const toast = useCallback(
    (input: ToastInput) => {
      const { title, description, variant = "default", duration = DEFAULT_DURATION } = input;
      const fp = fingerprint(input);
      const now = Date.now();
      const recent = recentRef.current.get(fp);
      if (recent && now - recent.ts < DEDUPE_WINDOW_MS) {
        // Toast idéntico aún visible — refrescar timestamp y retornar el id existente.
        recentRef.current.set(fp, { id: recent.id, ts: now });
        return recent.id;
      }

      const id = crypto.randomUUID();
      const item: ToastItem = { id, title, description, variant, duration, open: true };
      dispatch({ type: "ADD", item });
      recentRef.current.set(fp, { id, ts: now });

      const timer = setTimeout(() => {
        dismiss(id);
      }, duration);
      timersRef.current.set(id, timer);

      return id;
    },
    [dismiss],
  );

  return { toasts, toast, dismiss };
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <Toaster />. Make sure Toaster is mounted in app/layout.tsx.");
  return ctx;
}
