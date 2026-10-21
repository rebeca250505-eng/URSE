import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  Search,
  Sparkles,
  Lightbulb,
  FilePlus,
  ClipboardCheck,
  BookMarked,
  ArrowRight,
  Upload,
  Download,
  RotateCcw,
} from 'lucide-react';
import { ProjectData } from '../types';
import { ActiveTab } from './Sidebar';

interface DashboardProps {
  project: ProjectData;
  onNavigate: (tab: ActiveTab) => void;
  onExportJsonBackup: () => void;
  onImportJsonBackup: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onResetToSample: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  project,
  onNavigate,
  onExportJsonBackup,
  onImportJsonBackup,
  onResetToSample,
}) => {
  const meta = project.metadata;
  const items = project.reactivosTrabajo;
  const total = items.length;

  let aprobadas = 0;
  let conAjustes = 0;
  let requierenReconstruccion = 0;
  let pendientesDisciplinar = 0;

  items.forEach((it) => {
    const diag = project.diagnosticos[it.id];
    if (diag) {
      if (diag.estado === 'aprobada') aprobadas++;
      else if (diag.estado === 'requiere_ajustes') conAjustes++;
      else if (diag.estado === 'requiere_reconstruccion') requierenReconstruccion++;

      if (diag.verificacionDisciplinarPendiente) pendientesDisciplinar++;
    }
  });

  const propuestasCount = Object.keys(project.propuestas || {}).length;
  const sugerenciasCount = (project.sugerencias || []).length;
  const temarioCount = meta.temario.length;
  const audit = project.auditoria;

  return (
    <div className="space-y-6">
      {/* Top Banner with Project Context */}
      <div className="bg-white rounded-lg p-6 border border-[#E0E0E0] shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider text-[#F4AE32] bg-[#1B1B1B] px-2.5 py-0.5 rounded">
                {meta.tipoInstrumento === 'formativa'
                  ? 'Actividad Formativa (3 preguntas)'
                  : 'Cuestionario Evaluativo (Test)'}
              </span>
              <span className="text-xs text-[#777777]">
                Nivel: <strong className="text-[#1B1B1B]">{meta.nivelAcademico}</strong>
              </span>
            </div>
            <h1 className="text-xl font-bold text-[#1B1B1B]">
              {meta.numeroYNombreUnidad || meta.nombre}
            </h1>
            <p className="text-xs text-[#777777] mt-1 max-w-3xl">
              {meta.finAprendizaje ||
                'Instrumento de evaluación académica estructurado bajo los lineamientos editoriales y disciplinares de la Universidad Regional del Sureste.'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigate('documento')}
              className="text-xs bg-[#F5F5F5] hover:bg-[#EBEBEB] text-[#1B1B1B] font-semibold px-3 py-2 rounded border border-[#D5D5D5] flex items-center gap-1.5 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-[#F4AE32]" />
              <span>Ver Unidad y Temario</span>
            </button>
            <button
              onClick={() => onNavigate('auditar')}
              className="text-xs bg-[#1B1B1B] hover:bg-[#2C2C2C] text-[#F4AE32] font-semibold px-3.5 py-2 rounded flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>Ver Auditoría Global</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Questions */}
        <div className="bg-white p-4 rounded-lg border border-[#E0E0E0] shadow-sm">
          <div className="text-xs text-[#777777] font-medium">Reactivos del Instrumento</div>
          <div className="text-2xl font-bold text-[#1B1B1B] mt-1">{total}</div>
          <div className="text-[11px] text-[#777777] mt-1 flex items-center gap-1">
            <span>Objetivo:</span>
            <strong className="text-[#1B1B1B]">
              {meta.tipoInstrumento === 'formativa' ? 'Exactamente 3' : '10 a 15 preguntas'}
            </strong>
          </div>
        </div>

        {/* Aprobadas */}
        <div className="bg-white p-4 rounded-lg border border-[#E0E0E0] shadow-sm">
          <div className="text-xs text-[#777777] font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Preguntas Aprobadas</span>
          </div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{aprobadas}</div>
          <div className="text-[11px] text-[#777777] mt-1">
            {total > 0 ? Math.round((aprobadas / total) * 100) : 0}% de cumplimiento
          </div>
        </div>

        {/* Con Ajustes */}
        <div className="bg-white p-4 rounded-lg border border-[#E0E0E0] shadow-sm">
          <div className="text-xs text-[#777777] font-medium flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            <span>Requieren Ajustes</span>
          </div>
          <div className="text-2xl font-bold text-amber-700 mt-1">{conAjustes}</div>
          <div className="text-[11px] text-[#777777] mt-1">
            {propuestasCount} propuesta(s) lista(s)
          </div>
        </div>

        {/* Requieren Reconstrucción */}
        <div className="bg-white p-4 rounded-lg border border-[#E0E0E0] shadow-sm">
          <div className="text-xs text-[#777777] font-medium flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5 text-red-600" />
            <span>Requieren Reconstrucción</span>
          </div>
          <div className="text-2xl font-bold text-red-700 mt-1">{requierenReconstruccion}</div>
          <div className="text-[11px] text-[#777777] mt-1">
            Problemas críticos de fondo
          </div>
        </div>
      </div>

      {/* Global Verdict summary box */}
      <div
        className={`p-4 rounded-lg border flex items-start justify-between gap-4 ${
          audit?.dictamenGlobal === 'APROBADO'
            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
            : audit?.dictamenGlobal === 'REQUIERE AJUSTES'
            ? 'bg-amber-50 border-amber-200 text-amber-900'
            : audit?.dictamenGlobal === 'PENDIENTE DE CONTENIDO'
            ? 'bg-gray-100 border-gray-300 text-gray-800'
            : 'bg-red-50 border-red-200 text-red-900'
        }`}
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded bg-white border">
              Dictamen URSE: {audit?.dictamenGlobal || 'EN REVISIÓN'}
            </span>
            {pendientesDisciplinar > 0 && (
              <span className="text-xs bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-medium">
                Verificación disciplinar pendiente
              </span>
            )}
          </div>
          <p className="text-xs mt-2 font-medium">
            {audit?.resumenDictamen ||
              'Ejecute el módulo de Auditoría para obtener el dictamen formal del instrumento académico.'}
          </p>
        </div>

        <button
          onClick={() => onNavigate('auditar')}
          className="shrink-0 text-xs font-bold underline hover:no-underline flex items-center gap-1"
        >
          <span>Examinar auditoría</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Quick Navigation to the 6 Modules */}
      <div>
        <h2 className="text-sm font-bold text-[#1B1B1B] uppercase tracking-wider mb-3">
          Flujo de Trabajo Especializado URSE
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Módulo 1 */}
          <div
            onClick={() => onNavigate('revisar')}
            className="bg-white p-4 rounded-lg border border-[#E0E0E0] hover:border-[#F4AE32] hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#F4AE32] bg-[#1B1B1B] px-2 py-0.5 rounded">
                Módulo 1
              </span>
              <Search className="w-4 h-4 text-[#777777] group-hover:text-[#F4AE32]" />
            </div>
            <h3 className="text-sm font-bold text-[#1B1B1B] group-hover:text-[#F4AE32] transition-colors">
              Revisar Reactivos
            </h3>
            <p className="text-xs text-[#777777] mt-1">
              Analiza cada pregunta sin alterarla: detecta errores estructurales, pistas involuntarias y contraste con la unidad.
            </p>
            <div className="mt-3 text-[11px] font-semibold text-[#1B1B1B] flex items-center gap-1">
              <span>Abrir revisión</span>
              <ArrowRight className="w-3 h-3 text-[#F4AE32]" />
            </div>
          </div>

          {/* Módulo 2 */}
          <div
            onClick={() => onNavigate('corregir')}
            className="bg-white p-4 rounded-lg border border-[#E0E0E0] hover:border-[#F4AE32] hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#F4AE32] bg-[#1B1B1B] px-2 py-0.5 rounded">
                Módulo 2
              </span>
              <Sparkles className="w-4 h-4 text-[#777777] group-hover:text-[#F4AE32]" />
            </div>
            <h3 className="text-sm font-bold text-[#1B1B1B] group-hover:text-[#F4AE32] transition-colors">
              Corregir (Propuestas)
            </h3>
            <p className="text-xs text-[#777777] mt-1">
              Compara el reactivo original vs. la propuesta de mejora lado a lado. Permite aceptar, rechazar o editar propuestas.
            </p>
            <div className="mt-3 text-[11px] font-semibold text-[#1B1B1B] flex items-center gap-1">
              <span>Ver {propuestasCount} propuesta(s)</span>
              <ArrowRight className="w-3 h-3 text-[#F4AE32]" />
            </div>
          </div>

          {/* Módulo 3 */}
          <div
            onClick={() => onNavigate('sugerir')}
            className="bg-white p-4 rounded-lg border border-[#E0E0E0] hover:border-[#F4AE32] hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#F4AE32] bg-[#1B1B1B] px-2 py-0.5 rounded">
                Módulo 3
              </span>
              <Lightbulb className="w-4 h-4 text-[#777777] group-hover:text-[#F4AE32]" />
            </div>
            <h3 className="text-sm font-bold text-[#1B1B1B] group-hover:text-[#F4AE32] transition-colors">
              Sugerir Mejoras
            </h3>
            <p className="text-xs text-[#777777] mt-1">
              Recomendaciones pedagógicas clasificadas en necesarias u opcionales (minicasos, nivel cognitivo, equilibrio).
            </p>
            <div className="mt-3 text-[11px] font-semibold text-[#1B1B1B] flex items-center gap-1">
              <span>Consultar {sugerenciasCount} sugerencia(s)</span>
              <ArrowRight className="w-3 h-3 text-[#F4AE32]" />
            </div>
          </div>

          {/* Módulo 4 */}
          <div
            onClick={() => onNavigate('crear')}
            className="bg-white p-4 rounded-lg border border-[#E0E0E0] hover:border-[#F4AE32] hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#F4AE32] bg-[#1B1B1B] px-2 py-0.5 rounded">
                Módulo 4
              </span>
              <FilePlus className="w-4 h-4 text-[#777777] group-hover:text-[#F4AE32]" />
            </div>
            <h3 className="text-sm font-bold text-[#1B1B1B] group-hover:text-[#F4AE32] transition-colors">
              Crear Reactivos
            </h3>
            <p className="text-xs text-[#777777] mt-1">
              Genera desde cero preguntas completas (3 formativas o 10 a 15 evaluativas) fundamentadas en el temario de la unidad.
            </p>
            <div className="mt-3 text-[11px] font-semibold text-[#1B1B1B] flex items-center gap-1">
              <span>Generar reactivos</span>
              <ArrowRight className="w-3 h-3 text-[#F4AE32]" />
            </div>
          </div>

          {/* Módulo 5 */}
          <div
            onClick={() => onNavigate('auditar')}
            className="bg-white p-4 rounded-lg border border-[#E0E0E0] hover:border-[#F4AE32] hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#F4AE32] bg-[#1B1B1B] px-2 py-0.5 rounded">
                Módulo 5
              </span>
              <ClipboardCheck className="w-4 h-4 text-[#777777] group-hover:text-[#F4AE32]" />
            </div>
            <h3 className="text-sm font-bold text-[#1B1B1B] group-hover:text-[#F4AE32] transition-colors">
              Auditar Instrumento
            </h3>
            <p className="text-xs text-[#777777] mt-1">
              Matriz de cobertura por nomenclador, detección de redundancias y dictamen institucional global.
            </p>
            <div className="mt-3 text-[11px] font-semibold text-[#1B1B1B] flex items-center gap-1">
              <span>Revisar cobertura ({temarioCount} apartados)</span>
              <ArrowRight className="w-3 h-3 text-[#F4AE32]" />
            </div>
          </div>

          {/* Módulo 6 */}
          <div
            onClick={() => onNavigate('lineamientos')}
            className="bg-white p-4 rounded-lg border border-[#E0E0E0] hover:border-[#F4AE32] hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#F4AE32] bg-[#1B1B1B] px-2 py-0.5 rounded">
                Módulo 6
              </span>
              <BookMarked className="w-4 h-4 text-[#777777] group-hover:text-[#F4AE32]" />
            </div>
            <h3 className="text-sm font-bold text-[#1B1B1B] group-hover:text-[#F4AE32] transition-colors">
              Lineamientos URSE
            </h3>
            <p className="text-xs text-[#777777] mt-1">
              Biblioteca institucional de solo lectura con las 13 normas oficiales de elaboración y ejemplos ilustrativos.
            </p>
            <div className="mt-3 text-[11px] font-semibold text-[#1B1B1B] flex items-center gap-1">
              <span>Consultar biblioteca</span>
              <ArrowRight className="w-3 h-3 text-[#F4AE32]" />
            </div>
          </div>
        </div>
      </div>

      {/* Project Backup & Storage tools */}
      <div className="bg-white rounded-lg p-5 border border-[#E0E0E0]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1B1B1B]">
              Gestión y Respaldo del Proyecto
            </h3>
            <p className="text-[11px] text-[#777777] mt-0.5">
              Descargue un respaldo íntegro en JSON o restaure datos para cambiar de dispositivo de trabajo.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <label className="cursor-pointer text-xs bg-[#F5F5F5] hover:bg-[#EAEAEA] text-[#1B1B1B] font-medium px-3 py-1.5 rounded border border-[#D5D5D5] flex items-center gap-1.5 transition-colors">
              <Upload className="w-3.5 h-3.5 text-[#F4AE32]" />
              <span>Importar Respaldo JSON</span>
              <input
                type="file"
                accept=".json"
                className="hidden"
                onChange={onImportJsonBackup}
              />
            </label>

            <button
              onClick={onExportJsonBackup}
              className="text-xs bg-[#F5F5F5] hover:bg-[#EAEAEA] text-[#1B1B1B] font-medium px-3 py-1.5 rounded border border-[#D5D5D5] flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-[#F4AE32]" />
              <span>Descargar Respaldo JSON</span>
            </button>

            <button
              onClick={onResetToSample}
              className="text-xs bg-white hover:bg-gray-50 text-[#777777] hover:text-[#1B1B1B] px-3 py-1.5 rounded border border-gray-200 flex items-center gap-1.5 transition-colors"
              title="Restaurar proyecto modelo URSE"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restaurar Muestra</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
