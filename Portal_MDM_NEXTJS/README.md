# Portal MDM (Centro de Control Avanzado)

Bienvenido a la interfaz de usuario del Data Warehouse de ACP. Esta aplicación web actúa como el "Centro de Control" interactivo para los analistas, auditores y gerentes que necesitan interactuar con la información procesada. 

La aplicación está construida usando **Next.js** y **React**, lo que permite una experiencia de usuario rápida y moderna, y consumo asíncrono desde el Backend de FastAPI.

## ¿Qué puede hacer el Portal?

A diferencia de un simple visualizador de reportes estáticos, este portal es un sistema completo de Master Data Management (MDM) con las siguientes capacidades:

1. **Dashboard y Analítica Avanzada:** Tableros de control con gráficos interactivos sobre la proyección de la producción, ciclos fenológicos y estados de las fincas.
2. **Auditoría y Resolución de Cuarentenas:** Una interfaz dedicada para revisar los registros que el ETL identificó como "anómalos". El auditor puede aceptar los datos, forzar una corrección o descartarlos definitivamente de los reportes.
3. **Explorador Jerárquico DWH:** Un navegador tipo "árbol" para profundizar desde métricas anuales hasta el nivel del lote individual de forma fluida.
4. **Monitoreo de Procesos en Vivo:** Permite visualizar si el ETL o el procesamiento backend se está ejecutando en ese preciso momento (Live Runs Panel).

## Estructura de Directorios

- **`/app/`**: Sistema de enrutamiento basado en la App Router de Next.js. Aquí se definen las páginas principales (dashboard, login, centro de cuarentena).
- **`/components/`**: Bloques de construcción visual de la aplicación. Se dividen frecuentemente en componentes de Interfaz de Usuario UI general (botones, modales) y componentes específicos del dominio (por ejemplo, `live-runs-panel.tsx` o `csv-uploader.tsx`).
- **`/lib/`**: Lógica auxiliar de Front-End, incluyendo llamadas al Backend, autenticación, protección de rutas y utilidades de formato.
- **`/hooks/`**: Funciones personalizadas de React (Custom Hooks) para manejar estado asíncrono y lógica re-utilizable (ej. encuestas de estado de sistema).

## Desarrollo Local

Para iniciar el servidor de desarrollo del portal:

1. Asegúrate de tener Node.js instalado.
2. Instala las dependencias la primera vez:
   ```bash
   npm install
   ```
3. Ejecuta el servidor en modo desarrollo:
   ```bash
   npm run dev
   ```
4. Abre `http://localhost:3000` en tu navegador. Recuerda tener el Backend corriendo simultáneamente para que la interfaz web pueda cargar datos reales.
