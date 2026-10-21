import React from 'react';
import {
  ClipboardCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  FileDown,
  RefreshCw,
  Layers,
  Award,
  ListOrdered,
} from 'lucide-react';
import { ProjectData } from '../types';
import { generateUrseAuditReportDocx } from '../utils/docxExporter';

interface AuditarViewProps {
  project: ProjectData;
  onReaudit: () => void;
  onOpenExport: () => void;
}

export const AuditarView: React.FC<AuditarViewProps> = ({
  project,
  onReaudit,
  onOpenExport,
}) => {
  const audit = project.auditoria;
  const meta = project.metadata;

  const handleDownloadWordAudit = async () => {
    if (!audit) return;
    try {
      const blob = await generateUrseAuditReportDocx(audit, meta);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Informe_Auditoria_URSE_${meta.numeroYNombreUnidad.replace(/\s+/g, '_') || 'Unidad'}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error al generar informe Word:', err);
    }
  };

  if (!audit) {
    return (
      <div className="bg-white p-8 rounded-lg border border-[#E0E0E0] text-center text-xs text-[#777777]">
        <ClipboardCheck className="w-8 h-8 text-[#F4AE32] mx-auto mb-2" />
        <p>No se ha calculado el informe de auditoría.</p>
        <button
          onClick={onReaudit}
          className="mt-3 text-xs font-bold bg-[#1B1B1B] text-[#F4AE32] px-4 py-2 rounded"
        >
          Calcular Auditoría Ahora
        </button>
      </div>
    );
  }

  const isApproved = audit.dictamenGlobal === 'APROBADO';
  const isAjustes = audit.dictamenGlobal === 'REQUIERE AJUSTES';
  const isNoAprobado = audit.dictamenGlobal === 'NO APROBADO';
  const isPendiente = audit.dictamenGlobal === 'PENDIENTE DE CONTENIDO';

  return (
    <div className="space-y-6">
      {/* Module Title Banner */}
      <div className="bg-white p-5 rounded-lg border border-[#E0E0E0] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#F4AE32] bg-[#1B1B1B] px-2.5 py-0.5 rounded">
              Módulo 5
            </span>
            <span className="text-xs font-semibold text-[#777777]">
              Auditoría Integral y Matriz de Cobertura
            </span>
          </div>
          <h1 className="text-lg font-bold text-[#1B1B1B]">
            Dictamen Institucional de Calidad URSE
          </h1>
          <p className="text-xs text-[#777777] mt-0.5 max-w-2xl">
            Inspección global del instrumento: suficiencia de preguntas, distribución por apartados y validez psicométrica.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onReaudit}
            className="text-xs bg-[#F5F5F5] hover:bg-[#EAEAEA] text-[#1B1B1B] font-semibold px-3 py-2 rounded border border-[#D5D5D5] flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5 text-[#F4AE32]" />
            <span>Re-Auditar Instrumento</span>
          </button>

          <button
            onClick={handleDownloadWordAudit}
            className="text-xs bg-[#1B1B1B] hover:bg-[#2C2C2C] text-[#F4AE32] font-bold px-3.5 py-2 rounded flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Descargar Informe Word (.docx)</span>
          </button>
        </div>
      </div>

      {/* Global Verdict Banner */}
      <div
        className={`rounded-lg p-6 border shadow-sm ${
          isApproved
            ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
            : isAjustes
            ? 'bg-amber-50 border-amber-300 text-amber-950'
            : isPendiente
            ? 'bg-gray-100 border-gray-300 text-gray-900'
            : 'bg-red-50 border-red-300 text-red-950'
        }`}
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded bg-[#1B1B1B] text-[#F4AE32]">
                Dictamen Global
              </span>
              <span className="text-sm font-extrabold uppercase">
                {audit.dictamenGlobal}
              </span>
            </div>
            <p className="text-xs font-medium leading-relaxed max-w-3xl">
              {audit.resumenDictamen}
            </p>
          </div>

          <div className="text-right text-xs shrink-0 font-medium">
            <div>Fecha de dictamen: {audit.fechaAuditoria}</div>
            <div className="text-[11px] opacity-75 mt-0.5">
              Universidad Regional del Sureste
            </div>
          </div>
        </div>
      </div>

      {/* Statistical Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-lg border border-[#E0E0E0] shadow-sm">
          <div className="text-[11px] text-[#777777] font-medium">Total Reactivos</div>
          <div className="text-xl font-bold text-[#1B1B1B] mt-0.5">{audit.totalReactivos}</div>
          <div className="text-[10px] text-[#777777] mt-0.5">
            {meta.tipoInstrumento === 'formativa' ? 'Meta: 3' : 'Meta: 10 a 15'}
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-[#E0E0E0] shadow-sm">
          <div className="text-[11px] text-[#777777] font-medium flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Aprobados</span>
          </div>
          <div className="text-xl font-bold text-emerald-700 mt-0.5">{audit.aprobados}</div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">
            {audit.totalReactivos > 0 ? Math.round((audit.aprobados / audit.totalReactivos) * 100) : 0}% listos
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-[#E0E0E0] shadow-sm">
          <div className="text-[11px] text-[#777777] font-medium flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>Con Ajustes</span>
          </div>
          <div className="text-xl font-bold text-amber-700 mt-0.5">{audit.conAjustes}</div>
          <div className="text-[10px] text-amber-700 mt-0.5">Subsanables</div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-[#E0E0E0] shadow-sm">
          <div className="text-[11px] text-[#777777] font-medium flex items-center gap-1">
            <XCircle className="w-3 h-3 text-red-600" />
            <span>Reconstrucción</span>
          </div>
          <div className="text-xl font-bold text-red-700 mt-0.5">{audit.requierenReconstruccion}</div>
          <div className="text-[10px] text-red-700 mt-0.5">Defectos de fondo</div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-[#E0E0E0] shadow-sm">
          <div className="text-[11px] text-[#777777] font-medium">Apartados Cubiertos</div>
          <div className="text-xl font-bold text-[#1B1B1B] mt-0.5">
            {audit.apartadosCubiertos} / {audit.apartadosTotales}
          </div>
          <div className="text-[10px] text-[#777777] mt-0.5">
            {audit.apartadosPendientes > 0 ? `${audit.apartadosPendientes} sin evaluar` : 'Cobertura completa'}
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-lg border border-[#E0E0E0] shadow-sm">
          <div className="text-[11px] text-[#777777] font-medium">Problemas Críticos</div>
          <div className={`text-xl font-bold mt-0.5 ${audit.problemasCriticos > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
            {audit.problemasCriticos}
          </div>
          <div className="text-[10px] text-[#777777] mt-0.5">
            {audit.problemasModerados} moderados
          </div>
        </div>
      </div>

      {/* Matriz de Cobertura Temática */}
      <div className="bg-white rounded-lg border border-[#E0E0E0] p-6 shadow-sm space-y-4">
        <div>
          <h2 className="text-sm font-bold text-[#1B1B1B] uppercase tracking-wider flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#F4AE32]" />
            <span>Matriz de Cobertura Temática y Nomencladores</span>
          </h2>
          <p className="text-xs text-[#777777] mt-0.5">
            Comprobación de que las preguntas evalúan el contenido sustantivo y no se concentran en un único subtema.
          </p>
        </div>

        <div className="overflow-x-auto border border-[#E0E0E0] rounded-lg">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAFAFA] border-b border-[#E0E0E0] text-[#777777] uppercase text-[10px] font-bold">
              <tr>
                <th className="py-3 px-3 w-28">Nomenclador</th>
                <th className="py-3 px-3">Apartado / Subtema Desarrollado</th>
                <th className="py-3 px-3">Aprendizaje Evaluable</th>
                <th className="py-3 px-3 text-center w-28">Reactivos Asignados</th>
                <th className="py-3 px-3 text-center w-28">Estado</th>
                <th className="py-3 px-3">Observaciones de Cobertura</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEAEA]">
              {audit.matrizCobertura.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-[#777777]">
                    No se han registrado temas o apartados. Ingrese el temario en «Documento y Temario».
                  </td>
                </tr>
              ) : (
                audit.matrizCobertura.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/80">
                    <td className="py-2.5 px-3 font-mono font-bold text-[#1B1B1B]">
                      {row.nomenclador}
                    </td>
                    <td className="py-2.5 px-3 font-medium text-[#1B1B1B]">
                      {row.temaSubtema}
                    </td>
                    <td className="py-2.5 px-3 text-[#555555]">
                      {row.aprendizajeEvaluable}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {row.preguntasAsignadas.length > 0 ? (
                        <span className="font-bold text-[#1B1B1B] bg-gray-100 px-2 py-0.5 rounded">
                          {row.preguntasAsignadas.map(p => `P${p}`).join(', ')}
                        </span>
                      ) : (
                        <span className="text-gray-400 italic">Ninguna</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                          row.estado === 'Cubierto'
                            ? 'bg-emerald-100 text-emerald-800'
                            : row.estado === 'Parcial'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {row.estado}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-[#555555]">
                      {row.observaciones}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
