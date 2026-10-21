import React, { useState } from 'react';
import {
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  RefreshCw,
  Sparkles,
  ArrowRight,
  Filter,
  BookOpen,
} from 'lucide-react';
import {
  ItemStatus,
  ProjectData,
  ReactivoDiagnostic,
  ReactivoItem,
} from '../types';

interface RevisarViewProps {
  project: ProjectData;
  onRunAiReview: (itemId: string) => Promise<void>;
  onNavigateToCorrect: (itemId: string) => void;
  onNavigateToSuggest: (itemId: string) => void;
}

export const RevisarView: React.FC<RevisarViewProps> = ({
  project,
  onRunAiReview,
  onNavigateToCorrect,
  onNavigateToSuggest,
}) => {
  const [filterStatus, setFilterStatus] = useState<'todos' | ItemStatus>('todos');
  const [selectedItemId, setSelectedItemId] = useState<string | null>(
    project.reactivosTrabajo[0]?.id || null
  );
  const [loadingAi, setLoadingAi] = useState<string | null>(null);

  const items = project.reactivosTrabajo;
  const filteredItems = items.filter((it) => {
    if (filterStatus === 'todos') return true;
    const diag = project.diagnosticos[it.id];
    return diag?.estado === filterStatus;
  });

  const selectedItem = items.find((i) => i.id === selectedItemId) || items[0];
  const diagnostic: ReactivoDiagnostic | undefined = selectedItem
    ? project.diagnosticos[selectedItem.id]
    : undefined;

  const handleReviewClick = async (itemId: string) => {
    setLoadingAi(itemId);
    try {
      await onRunAiReview(itemId);
    } finally {
      setLoadingAi(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Title Banner */}
      <div className="bg-white p-5 rounded-lg border border-[#E0E0E0] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#F4AE32] bg-[#1B1B1B] px-2.5 py-0.5 rounded">
              Módulo 1
            </span>
            <span className="text-xs font-semibold text-[#777777]">
              Revisión Académica sin Alteración
            </span>
          </div>
          <h1 className="text-lg font-bold text-[#1B1B1B]">
            Diagnóstico Integral por Reactivo
          </h1>
          <p className="text-xs text-[#777777] mt-0.5 max-w-2xl">
            Inspección determinista y disciplinar por capas: Estructura, Editorial, Pedagogía y Contraste con la Unidad.
          </p>
        </div>

        {/* Filter bar */}
        <div className="flex items-center gap-2 self-start sm:self-center">
          <Filter className="w-3.5 h-3.5 text-[#777777]" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as any)}
            className="text-xs border border-[#D5D5D5] rounded px-3 py-1.5 bg-white font-medium focus:outline-none focus:border-[#F4AE32]"
          >
            <option value="todos">Todos los reactivos ({items.length})</option>
            <option value="aprobada">Solo Aprobadas</option>
            <option value="requiere_ajustes">Requieren Ajustes</option>
            <option value="requiere_reconstruccion">Requieren Reconstrucción</option>
          </select>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="bg-white p-8 rounded-lg border border-dashed border-[#D5D5D5] text-center">
          <Search className="w-8 h-8 text-[#777777] mx-auto mb-2" />
          <h3 className="text-sm font-bold text-[#1B1B1B]">No hay reactivos para revisar</h3>
          <p className="text-xs text-[#777777] mt-1">
            Cargue un documento o pegue preguntas en el módulo «Documento y Temario».
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Question List Column */}
          <div className="lg:col-span-5 space-y-2.5">
            <div className="text-xs font-bold text-[#777777] uppercase tracking-wider px-1">
              Lista de Reactivos ({filteredItems.length})
            </div>

            {filteredItems.map((item, index) => {
              const diag = project.diagnosticos[item.id];
              const isSelected = selectedItem?.id === item.id;
              const hasCriticos = diag?.observaciones?.some((o) => o.gravedad === 'critico');

              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItemId(item.id)}
                  className={`p-3.5 rounded-lg border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-white border-[#F4AE32] shadow-sm ring-1 ring-[#F4AE32]'
                      : 'bg-white border-[#E0E0E0] hover:border-[#CCCCCC]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-xs font-bold text-[#1B1B1B]">
                      Pregunta {item.numero}
                    </span>

                    {/* Status badge */}
                    {diag?.estado === 'aprobada' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>Aprobada</span>
                      </span>
                    ) : diag?.estado === 'requiere_ajustes' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        <span>Requiere ajustes</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 text-red-800">
                        <XCircle className="w-3 h-3 text-red-600" />
                        <span>Reconstrucción</span>
                      </span>
                    )}
                  </div>

                  {item.apartado && (
                    <div className="text-[11px] font-mono text-[#777777] truncate mb-1">
                      {item.apartado}
                    </div>
                  )}

                  <p className="text-xs text-[#333333] line-clamp-2 leading-relaxed">
                    {item.enunciado}
                  </p>

                  <div className="mt-2.5 pt-2 border-t border-[#F0F0F0] flex items-center justify-between text-[11px] text-[#777777]">
                    <span>Nivel: {diag?.nivelCognitivo || 'Comprensión'}</span>
                    {diag?.verificacionDisciplinarPendiente && (
                      <span className="text-amber-700 font-medium">
                        Disciplinar pendiente
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detailed Diagnosis Column */}
          <div className="lg:col-span-7 space-y-4">
            {selectedItem && diagnostic ? (
              <div className="bg-white rounded-lg border border-[#E0E0E0] p-6 shadow-sm space-y-5">
                {/* Header detail */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-[#EAEAEA] gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-[#1B1B1B]">
                        Diagnóstico: Pregunta {selectedItem.numero}
                      </h2>
                      {diagnostic.estado === 'aprobada' ? (
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-emerald-100 text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Aprobada</span>
                        </span>
                      ) : diagnostic.estado === 'requiere_ajustes' ? (
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-amber-100 text-amber-800 flex items-center gap-1">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Requiere ajustes</span>
                        </span>
                      ) : (
                        <span className="text-xs font-bold px-2.5 py-0.5 rounded bg-red-100 text-red-800 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Requiere reconstrucción</span>
                        </span>
                      )}
                    </div>
                    {selectedItem.apartado && (
                      <div className="text-xs text-[#777777] mt-0.5">
                        Apartado temático: <strong className="text-[#1B1B1B]">{selectedItem.apartado}</strong>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleReviewClick(selectedItem.id)}
                      disabled={loadingAi === selectedItem.id}
                      className="text-xs font-semibold bg-[#F5F5F5] hover:bg-[#EAEAEA] text-[#1B1B1B] px-3 py-1.5 rounded border border-[#D0D0D0] flex items-center gap-1.5 transition-colors disabled:opacity-50"
                      title="Profundizar análisis con Gemini"
                    >
                      {loadingAi === selectedItem.id ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#F4AE32]" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5 text-[#F4AE32]" />
                      )}
                      <span>Auditar con Gemini</span>
                    </button>

                    {diagnostic.estado !== 'aprobada' && (
                      <button
                        onClick={() => onNavigateToCorrect(selectedItem.id)}
                        className="text-xs font-bold bg-[#1B1B1B] hover:bg-[#2C2C2C] text-[#F4AE32] px-3 py-1.5 rounded flex items-center gap-1 transition-colors"
                      >
                        <span>Ir a Corregir</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Question Presentation in Strict URSE Format */}
                <div className="bg-[#FBFBFB] p-4 rounded-md border border-[#E5E5E5] font-sans text-xs space-y-3">
                  <div className="text-[11px] font-bold text-[#777777] uppercase tracking-wider">
                    Presentación Literal del Reactivo
                  </div>

                  <div className="text-[#1B1B1B] leading-relaxed">
                    <span className="font-bold text-[#1B1B1B]">Enunciado: </span>
                    {selectedItem.enunciado}
                  </div>

                  {selectedItem.respuestasIncorrectas.map((dist, idx) => (
                    <div key={idx} className="text-[#555555]">
                      <span className="font-semibold text-[#777777]">
                        Respuesta incorrecta:
                      </span>{' '}
                      {dist}
                    </div>
                  ))}

                  <div className="text-[#1B1B1B] bg-white p-2.5 rounded border border-[#E0E0E0]">
                    <span className="font-bold text-[#F4AE32] bg-[#1B1B1B] px-1.5 py-0.5 rounded mr-1">
                      Respuesta correcta:
                    </span>{' '}
                    <span className="font-semibold">{selectedItem.respuestaCorrecta}</span>
                  </div>
                </div>

                {/* Automatic Metric Indicators */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                  <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
                    <div className="text-[#777777]">Demanda cognitiva:</div>
                    <div className="font-bold text-[#1B1B1B] mt-0.5">
                      {diagnostic.nivelCognitivo}
                    </div>
                  </div>

                  <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
                    <div className="text-[#777777]">Longitud equilibrada:</div>
                    <div
                      className={`font-bold mt-0.5 ${
                        diagnostic.resumenAutomatico.longitudEquilibrada
                          ? 'text-emerald-700'
                          : 'text-amber-700'
                      }`}
                    >
                      {diagnostic.resumenAutomatico.longitudEquilibrada
                        ? 'Simétrica'
                        : 'Desequilibrada'}
                    </div>
                  </div>

                  <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
                    <div className="text-[#777777]">¿Correcta es la más larga?:</div>
                    <div
                      className={`font-bold mt-0.5 ${
                        diagnostic.resumenAutomatico.correctaEsMasLarga
                          ? 'text-red-700'
                          : 'text-emerald-700'
                      }`}
                    >
                      {diagnostic.resumenAutomatico.correctaEsMasLarga ? 'SÍ (Defecto)' : 'No'}
                    </div>
                  </div>

                  <div className="p-2.5 bg-gray-50 rounded border border-gray-200">
                    <div className="text-[#777777]">Formulación positiva:</div>
                    <div
                      className={`font-bold mt-0.5 ${
                        diagnostic.resumenAutomatico.esPositiva
                          ? 'text-emerald-700'
                          : 'text-red-700'
                      }`}
                    >
                      {diagnostic.resumenAutomatico.esPositiva ? 'Positiva' : 'Negativa (Prohibida)'}
                    </div>
                  </div>
                </div>

                {/* Justification & Recommendations */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-[#1B1B1B] uppercase tracking-wider">
                    Dictamen Académico
                  </div>
                  <div className="p-3 bg-[#F9F9F9] rounded border border-[#E5E5E5] text-xs text-[#333333] leading-relaxed">
                    <p className="font-medium">{diagnostic.justificacion}</p>
                    <p className="mt-2 text-[#555555]">
                      <strong className="text-[#1B1B1B]">Recomendación:</strong>{' '}
                      {diagnostic.recomendacion}
                    </p>
                  </div>
                </div>

                {/* Disciplinary Evidence or Pending Warning */}
                {diagnostic.verificacionDisciplinarPendiente ? (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                    <div>
                      <strong className="font-bold">Verificación disciplinar pendiente:</strong>
                      <p className="mt-0.5">
                        {diagnostic.limitacionesVerificacion ||
                          'No se ha provisto el contenido de la unidad. La correspondencia temática y validez de la clave están condicionadas a la carga del documento.'}
                      </p>
                    </div>
                  </div>
                ) : diagnostic.evidenciaContenido ? (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs text-emerald-900">
                    <div className="font-bold flex items-center gap-1.5 mb-1 text-emerald-800">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Evidencia del Contenido Desarrollado</span>
                    </div>
                    <p className="italic text-[11px] font-mono leading-relaxed bg-white/70 p-2 rounded border border-emerald-200">
                      {diagnostic.evidenciaContenido}
                    </p>
                  </div>
                ) : null}

                {/* Observations list */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-[#1B1B1B] uppercase tracking-wider">
                      Hallazgos Identificados ({diagnostic.observaciones.length})
                    </div>
                  </div>

                  {diagnostic.observaciones.length === 0 ? (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded font-medium flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>
                        No se detectaron problemas de estructura, editorial o formulación en este reactivo.
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {diagnostic.observaciones.map((obs) => (
                        <div
                          key={obs.id}
                          className={`p-3 rounded border text-xs space-y-1.5 ${
                            obs.gravedad === 'critico'
                              ? 'bg-red-50 border-red-200 text-red-900'
                              : obs.gravedad === 'moderado'
                              ? 'bg-amber-50 border-amber-200 text-amber-900'
                              : 'bg-blue-50 border-blue-200 text-blue-900'
                          }`}
                        >
                          <div className="flex items-center justify-between font-bold">
                            <span className="flex items-center gap-1.5">
                              <span
                                className={`uppercase text-[10px] px-1.5 py-0.5 rounded font-black ${
                                  obs.gravedad === 'critico'
                                    ? 'bg-red-600 text-white'
                                    : obs.gravedad === 'moderado'
                                    ? 'bg-amber-600 text-white'
                                    : 'bg-blue-600 text-white'
                                }`}
                              >
                                {obs.gravedad === 'critico'
                                  ? 'Error Crítico'
                                  : obs.gravedad === 'moderado'
                                  ? 'Error Moderado'
                                  : 'Mejora Opcional'}
                              </span>
                              <span>{obs.problema}</span>
                            </span>
                            <span className="text-[10px] font-normal opacity-75">
                              Capa {obs.capa}
                            </span>
                          </div>

                          <div className="text-[11px] opacity-90">
                            <strong>Ubicación:</strong> {obs.ubicacion} |{' '}
                            <strong>Criterio:</strong> {obs.criterioIncumplido}
                          </div>

                          <div className="text-[11px] opacity-90">
                            <strong>Impacto:</strong> {obs.impacto}
                          </div>

                          <div className="text-[11px] font-medium pt-1 border-t border-black/10">
                            <strong>Solución requerida:</strong> {obs.comoCorregir}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
