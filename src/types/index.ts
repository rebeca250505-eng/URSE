export type InstrumentType = 'formativa' | 'evaluativo';

export type CognitiveLevel =
  | 'Comprensión'
  | 'Aplicación'
  | 'Análisis'
  | 'Evaluación'
  | 'Resolución de problemas';

export type ItemStatus = 'aprobada' | 'requiere_ajustes' | 'requiere_reconstruccion';

export type DefectSeverity = 'critico' | 'moderado' | 'opcional';

export type ValidationLayer =
  | 'Estructural'
  | 'Editorial'
  | 'Pedagógica'
  | 'Disciplinar'
  | 'Auditoría';

export interface DefectObservation {
  id: string;
  capa: ValidationLayer;
  gravedad: DefectSeverity;
  problema: string;
  ubicacion: 'Enunciado' | 'Respuestas incorrectas' | 'Respuesta correcta' | 'Estructura general' | 'Relación con la unidad';
  criterioIncumplido: string;
  impacto: string;
  comoCorregir: string;
  evidencia?: string;
}

export interface ReactivoItem {
  id: string;
  numero: number;
  apartado?: string; // Nomenclador e.g., "1.2 Principios procesales"
  enunciado: string;
  respuestasIncorrectas: [string, string, string]; // Exactly 3
  respuestaCorrecta: string; // Exactly 1 (always last)
  nivelCognitivo?: CognitiveLevel;
  esMinicaso?: boolean;
}

export interface ReactivoDiagnostic {
  itemId: string;
  estado: ItemStatus;
  verificacionDisciplinarPendiente: boolean;
  nivelCognitivo: CognitiveLevel;
  observaciones: DefectObservation[];
  justificacion: string;
  recomendacion: string;
  evidenciaContenido?: string;
  limitacionesVerificacion?: string;
  resumenAutomatico: {
    longitudEquilibrada: boolean;
    correctaEsMasLarga: boolean;
    pistasDetectadas: string[];
    esPositiva: boolean;
    cumpleFormatoExacto: boolean;
  };
}

export interface CorrectionProposal {
  itemId: string;
  original: ReactivoItem;
  propuesta: ReactivoItem;
  problemasCorregidos: string[];
  motivoModificacion: string;
  queCambio?: string;
  evidenciaUtilizada: string;
  cambioRespuestaCorrecta: boolean;
  estadoResultante: ItemStatus;
  decisionUsuario: 'pendiente' | 'aceptada' | 'rechazada' | 'editada';
  historialEdiciones?: ReactivoItem[];
}

export interface SuggestionItem {
  id: string;
  itemId: string;
  tipo: 'Necesaria' | 'Opcional';
  titulo: string;
  descripcion: string;
  criterioRelacionado: string;
  propuestaTexto?: {
    enunciado?: string;
    respuestasIncorrectas?: [string, string, string];
    respuestaCorrecta?: string;
  };
}

export interface SyllabusTopic {
  id: string;
  nomenclador: string; // e.g. "1.1"
  titulo: string;
  descripcionAprendizaje?: string;
}

export interface CoverageEntry {
  nomenclador: string;
  temaSubtema: string;
  aprendizajeEvaluable: string;
  preguntasAsignadas: number[]; // e.g. [1, 4]
  estado: 'Cubierto' | 'Parcial' | 'No cubierto';
  observaciones: string;
}

export interface AuditReportData {
  totalReactivos: number;
  aprobados: number;
  conAjustes: number;
  requierenReconstruccion: number;
  verificacionDisciplinarPendiente: boolean;
  apartadosTotales: number;
  apartadosCubiertos: number;
  apartadosPendientes: number;
  problemasCriticos: number;
  problemasModerados: number;
  mejorasOpcionales: number;
  dictamenGlobal: 'APROBADO' | 'REQUIERE AJUSTES' | 'NO APROBADO' | 'PENDIENTE DE CONTENIDO';
  resumenDictamen: string;
  matrizCobertura: CoverageEntry[];
  fechaAuditoria: string;
}

export interface ProjectMetadata {
  id: string;
  nombre: string;
  asignatura: string;
  numeroYNombreUnidad: string;
  nivelAcademico: 'Licenciatura' | 'Especialidad' | 'Maestría' | 'Doctorado' | 'Educación Continua';
  finAprendizaje?: string;
  tipoInstrumento: InstrumentType;
  contenidoUnidad: string; // Plain text extracted or pasted
  temario: SyllabusTopic[];
  documentoNombre?: string;
  documentoTamano?: number;
  documentoTipo?: 'docx' | 'pdf' | 'texto';
  fechaCreacion: string;
  ultimaModificacion: string;
  versionLineamientos: string;
}

export interface ProjectData {
  metadata: ProjectMetadata;
  reactivosOriginales: ReactivoItem[];
  reactivosTrabajo: ReactivoItem[]; // Working copy
  reactivosAprobados: ReactivoItem[];
  diagnosticos: Record<string, ReactivoDiagnostic>;
  propuestas: Record<string, CorrectionProposal>;
  sugerencias: SuggestionItem[];
  auditoria?: AuditReportData;
  historialAcciones: {
    fecha: string;
    accion: string;
    detalle: string;
  }[];
}
