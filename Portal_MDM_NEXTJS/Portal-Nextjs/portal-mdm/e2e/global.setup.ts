import { FullConfig } from "@playwright/test";
import { execSync } from "child_process";
import path from "path";

/**
 * Orquestador Global para Pruebas E2E Reales.
 * Se ejecuta una sola vez antes de todos los workers.
 */
async function globalSetup(config: FullConfig) {
  console.log("=======================================");
  console.log("  INICIANDO ENTORNO DE PRUEBAS E2E     ");
  console.log("=======================================");

  const dbName = process.env.DB_NOMBRE;
  if (!dbName || !dbName.toLowerCase().includes("test")) {
    throw new Error(
      `[CRÍTICO] La base de datos configurada para las pruebas es '${dbName}'.\n` +
      `Para evitar borrar la BD de desarrollo o producción, la variable DB_NOMBRE ` +
      `en .env.test debe contener la palabra 'test' (ej: ACP_DataWarehouse_Test).`
    );
  }

  console.log(`[1/2] Base de datos de pruebas configurada: ${dbName}`);

  // Ejecutar el ETL (Carga de Datos) apuntando a la base de pruebas.
  // Esto simula la ingesta en producción.
  const etlDir = path.resolve(__dirname, "../../../../ETL");
  const pythonPath = path.resolve(__dirname, "../../../../.venv/Scripts/python.exe");

  console.log(`[2/2] Ejecutando ETL (Pipeline) para sembrar datos en ${dbName}...`);
  try {
    // Si queremos correr el pipeline completo, usamos:
    // python pipeline.py --modo-ejecucion completo
    // Si queremos que sea rápido, solo cargamos los maestros y un par de facts.
    // Usaremos el default (completo) ya que el usuario pidió "todo como en producción".
    
    const output = execSync(`"${pythonPath}" pipeline.py`, {
      cwd: etlDir,
      env: process.env, // Pasa las variables de entorno, incluyendo DB_NOMBRE de prueba
      stdio: "pipe",
    });
    
    console.log("[OK] ETL finalizó exitosamente. Datos sembrados.");
    // console.log(output.toString()); // Descomentar para ver logs del ETL
  } catch (error: any) {
    console.error("[ERROR] Falló la ejecución del ETL durante el setup global.");
    if (error.stdout) console.error(error.stdout.toString());
    if (error.stderr) console.error(error.stderr.toString());
    throw error;
  }

  console.log("=======================================");
  console.log("  ENTORNO LISTO. CORRIENDO PRUEBAS...  ");
  console.log("=======================================");
}

export default globalSetup;
