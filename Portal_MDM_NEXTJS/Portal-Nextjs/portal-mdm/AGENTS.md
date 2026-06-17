<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Convenciones del Portal

### Idioma de comentarios y UI

- **Comentarios de código y docstrings: español.** Toda explicación de
  "por qué" en código nuevo va en español. Es el idioma del equipo y de
  los stakeholders que leen reviews.
- **UI / labels / mensajes al usuario: español.** Sin excepciones.
- **Identifiers (variables, funciones, tipos): inglés.** Mantiene
  consistencia con APIs externas (React, Next, TanStack, Zod) y permite
  grep limpio. `useResolveQuarantine`, no `useResolverCuarentena`.
- **Mensajes de error técnicos (Error.message, console.warn) que pueden
  llegar a un dev: inglés** si describen un fallo de programación
  ("Invalid payload shape"), **español** si pueden burbujear hasta el
  usuario final ("No se pudo guardar").

Los archivos legacy que tienen comentarios en mixed ES/EN se dejan como
están — migrar 100s de comentarios no aporta valor. La regla aplica a
código nuevo y a archivos que estés tocando por otro motivo.
