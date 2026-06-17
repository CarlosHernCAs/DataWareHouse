"use server";

import { cookies } from "next/headers";
import { JWT_COOKIE_NAME } from "../auth/session";

export interface ValidationResult {
  valido: boolean;
  total_filas?: number;
  columnas?: string[];
  filas_validas?: Array<{ fila_id: number; datos: Record<string, any> }>;
  filas_con_errores?: Array<{ fila_id: number; datos: Record<string, any>; errores: string[] }>;
  error_general?: string;
}

export async function uploadAndValidateCsv(formData: FormData): Promise<ValidationResult> {
  const store = await cookies();
  const token = store.get(JWT_COOKIE_NAME)?.value;

  const headers: Record<string, string> = {};
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  // Reconstruir el FormData usando la API nativa de Node para evitar
  // problemas de serialización del polyfill de Next.js
  const outFormData = new FormData();
  const tablaDestino = formData.get("tabla_destino");
  const file = formData.get("archivo") as File;
  
  if (tablaDestino) outFormData.append("tabla_destino", tablaDestino);
  if (file) {
    // Convertimos el File de Next.js a un Blob nativo para asegurar la transferencia binaria
    const arrayBuffer = await file.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: file.type });
    outFormData.append("archivo", blob, file.name);
  }

  // Reenviar el outFormData al servidor de FastAPI
  const response = await fetch(`${apiUrl}/api/v1/ingesta/validar`, {
    method: "POST",
    headers,
    body: outFormData,
  });

  if (!response.ok) {
    let errorDetail = "Error al validar el archivo";
    try {
      const text = await response.text();
      console.error("[uploadAndValidateCsv] Backend error:", response.status, text);
      const errorJson = JSON.parse(text);
      errorDetail = errorJson.detail || errorDetail;
    } catch (e) {
      console.error("[uploadAndValidateCsv] Could not parse error response", e);
    }
    return { valido: false, error_general: errorDetail };
  }

  return response.json();
}
