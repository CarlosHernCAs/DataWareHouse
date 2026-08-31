/**
 * lib/hypr/keymap.ts
 * ==================
 * Catálogo declarativo de atajos del compositor Hypr. Fuente ÚNICA de verdad
 * para la hoja de atajos (`hypr-keymap-help.tsx`); el handler de teclado vive
 * en `hypr-shell.tsx` y debe mantenerse en sincronía con esta tabla.
 *
 * Leader = Alt (seguro en navegador; SUPER/Meta lo intercepta el SO).
 */

export interface HyprShortcut {
  /** Teclas mostradas como <kbd> (en orden). */
  keys: string[];
  label: string;
}

export interface HyprShortcutGroup {
  title: string;
  shortcuts: HyprShortcut[];
}

export const HYPR_KEYMAP: HyprShortcutGroup[] = [
  {
    title: "Lanzador",
    shortcuts: [
      { keys: ["Ctrl", "K"], label: "Abrir / cerrar el lanzador" },
      { keys: ["Alt", "D"], label: "Abrir el lanzador (estilo Hyprland)" },
    ],
  },
  {
    title: "Workspaces",
    shortcuts: [
      { keys: ["Alt", "1…5"], label: "Ir al workspace" },
      { keys: ["Alt", "Shift", "1…5"], label: "Mover la ventana activa a un workspace" },
    ],
  },
  {
    title: "Ventana",
    shortcuts: [
      { keys: ["Alt", "F"], label: "Pantalla completa (maximizar / restaurar)" },
      { keys: ["Alt", "Shift", "F"], label: "Flotar / anclar la ventana activa" },
      { keys: ["Alt", "Ctrl", "←"], label: "Reducir ancho" },
      { keys: ["Alt", "Ctrl", "→"], label: "Aumentar ancho" },
      { keys: ["Alt", "Ctrl", "↑"], label: "Reducir alto" },
      { keys: ["Alt", "Ctrl", "↓"], label: "Aumentar alto" },
      { keys: ["Alt", "Q"], label: "Cerrar la ventana activa" },
    ],
  },
  {
    title: "Compositor",
    shortcuts: [
      { keys: ["Alt", ","], label: "Abrir / cerrar la configuración del compositor" },
    ],
  },
  {
    title: "Ayuda",
    shortcuts: [{ keys: ["?"], label: "Mostrar / ocultar esta ayuda" }],
  },
];
