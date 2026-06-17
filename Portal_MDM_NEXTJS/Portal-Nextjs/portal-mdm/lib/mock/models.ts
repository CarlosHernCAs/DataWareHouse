export type ModelStatus = "produccion" | "staging" | "archivado";

export interface PredictiveModel {
  id: string;
  name: string;
  algorithm: string;
  target: string;
  accuracy: number;
  auc: number;
  f1: number;
  status: ModelStatus;
  trainedAt: string;
  predictions24h: number;
}

export const MODELS: PredictiveModel[] = [];

export const MODEL_STATUS_LABEL: Record<ModelStatus, string> = {
  produccion: "Producción",
  staging: "Staging",
  archivado: "Archivado",
};

/* -------------------------------------------------------------------------- */
/* Modelos propuestos para desarrollo                                          */
/* Basados en los datos disponibles en el DWH (medallón Bronce→Silver→Gold).   */
/* -------------------------------------------------------------------------- */

export type ProblemType =
  | "Series de tiempo"
  | "Regresión"
  | "Clasificación"
  | "Detección de anomalías"
  | "Clustering"
  | "Ranking / Matching";

export type Level = "Alto" | "Medio" | "Bajo";

export interface ProposedModel {
  id: string;
  name: string;
  /** Qué problema de negocio resuelve, en una frase. */
  objective: string;
  /** Variable objetivo a predecir. */
  target: string;
  problemType: ProblemType;
  /** Algoritmos candidatos para la primera iteración. */
  algorithms: string[];
  /** Tablas/vistas del DWH que alimentarían el modelo. */
  dataSources: string[];
  impact: Level;
  effort: Level;
  /** % estimado de datos ya disponibles y limpios para entrenar (0–100). */
  readiness: number;
}

export const PROPOSED_MODELS: ProposedModel[] = [
  {
    id: "pronostico-cosecha",
    name: "Pronóstico de cosecha",
    objective:
      "Anticipar los kilos a cosechar por semana y variedad para planificar packing, mano de obra y logística.",
    target: "Kg cosechados (semanal)",
    problemType: "Series de tiempo",
    algorithms: ["Holt-Winters", "SARIMA", "Prophet"],
    dataSources: ["Gold.Fact_Cosecha", "Dim_Tiempo", "Dim_Variedad", "Dim_Geografia"],
    impact: "Alto",
    effort: "Medio",
    readiness: 80,
  },
  {
    id: "prediccion-rendimiento",
    name: "Predicción de rendimiento (kg/planta)",
    objective:
      "Estimar el rendimiento esperado por lote según variedad, geografía, edad de planta y cuadrilla.",
    target: "Kg por planta",
    problemType: "Regresión",
    algorithms: ["XGBoost", "LightGBM", "Random Forest"],
    dataSources: ["Fact_Cosecha", "Dim_Variedad", "Dim_Geografia", "Dim_Personal"],
    impact: "Alto",
    effort: "Medio",
    readiness: 70,
  },
  {
    id: "anomalias-calidad",
    name: "Detección de anomalías de calidad",
    objective:
      "Detectar de forma temprana cargas con patrones atípicos que terminarían en cuarentena, antes de procesarlas.",
    target: "Probabilidad de rechazo / outlier",
    problemType: "Detección de anomalías",
    algorithms: ["Isolation Forest", "LOF", "Autoencoder"],
    dataSources: ["Cuarentena", "Bitacora_Carga", "Bronce.*_Raw"],
    impact: "Medio",
    effort: "Bajo",
    readiness: 90,
  },
  {
    id: "homologacion-asistida",
    name: "Homologación asistida (matching)",
    objective:
      "Sugerir automáticamente el valor canónico para registros en cuarentena, priorizando por confianza.",
    target: "Valor canónico + score de confianza",
    problemType: "Ranking / Matching",
    algorithms: ["Fuzzy matching", "Embeddings + kNN", "Gradient Boosting ranker"],
    dataSources: ["Cuarentena", "MDM.Catalogo_Variedades", "Dim_Personal", "Dim_Geografia"],
    impact: "Alto",
    effort: "Medio",
    readiness: 75,
  },
  {
    id: "productividad-cuadrillas",
    name: "Productividad de cuadrillas",
    objective:
      "Modelar jornales por hectárea y agrupar cuadrillas por desempeño para optimizar la planificación de labor.",
    target: "Jornales / ha",
    problemType: "Regresión",
    algorithms: ["XGBoost", "K-Means (segmentación)"],
    dataSources: ["Dim_Personal", "Fact_Cosecha", "Dim_Tiempo"],
    impact: "Medio",
    effort: "Medio",
    readiness: 60,
  },
  {
    id: "segmentacion-fundos",
    name: "Segmentación de fundos y variedades",
    objective:
      "Agrupar combinaciones fundo–variedad con comportamiento similar para benchmarking y decisiones de plantación.",
    target: "Clúster de desempeño",
    problemType: "Clustering",
    algorithms: ["K-Means", "HDBSCAN", "PCA + K-Means"],
    dataSources: ["Fact_Cosecha (agregado)", "Dim_Geografia", "Dim_Variedad"],
    impact: "Medio",
    effort: "Bajo",
    readiness: 85,
  },
];

export const PROBLEM_TYPE_ICON: Record<ProblemType, string> = {
  "Series de tiempo": "trending-up",
  Regresión: "line-chart",
  Clasificación: "git-branch",
  "Detección de anomalías": "shield-alert",
  Clustering: "boxes",
  "Ranking / Matching": "list-ordered",
};
