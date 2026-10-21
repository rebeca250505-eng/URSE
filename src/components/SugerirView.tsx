import React, { useState } from 'react';
import {
  Lightbulb,
  Sparkles,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  RefreshCw,
  Sliders,
} from 'lucide-react';
import { ProjectData, SuggestionItem } from '../types';

interface SugerirViewProps {
  project: ProjectData;
  onConvertSuggestionToProposal: (sug: SuggestionItem) => void;
  onGenerateSuggestions: (itemId: string) => Promise<void>;
  onNavigateToCorrect: (itemId: string) => void;
}

export const SugerirView: React.FC<SugerirViewProps> = ({
  project,
  onConvertSuggestionToProposal,
  onGenerateSuggestions,
  onNavigateToCorrect,
}) => {
  const items = project.reactivosTrabajo;
  const [selectedItemId, setSelectedItemId] = useState<string>(
    items[0]?.id || ''
  );
  const [loadingAi, setLoadingAi] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<'todas' | 'Necesaria' | 'Opcional'>('todas');

  const selectedItem = items.find((i) => i.id === selectedItemId) || items[0];
  const itemSuggestions = (project.sugerencias || []).filter(
    (s) => s.itemId === selectedItem?.id
  );

  const filteredSuggestions = itemSuggestions.filter((s) => {
    if (filterType === 'todas') return true;
    return s.tipo === filterType;
  });

  const handleGenerateClick = async (itemId: string) => {
    setLoadingAi(itemId);
    try {
      await onGenerateSuggestions(itemId);
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
              Módulo 3
            </span>
            <span className="text-xs font-semibold text-[#777777]">
              Recomendaciones Pedagógicas de Mejora
            </span>
          </div>
          <h1 className="text-lg font-bold text-[#1B1B1B]">
            Sugerencias de Optimización Académica
          </h1>
          <p className="text-xs text-[#777777] mt-0.5 max-w-2xl">
            Mejore la formulación de minicasos, eleve el nivel cognitivo y equilibre distractores sin modificar el reactivo original.
          </p>
        </div>

        {/* Selected question tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {items.map((it) => {
            const isSel = it.id === selectedItem?.id;
            const count = (project.sugerencias || []).filter(
              (s) => s.itemId === it.id
            ).length;

            return (
              <button
                key={it.id}
                onClick={() => setSelectedItemId(it.id)}
                className={`text-xs px-2.5 py-1.5 rounded font-bold transition-all border ${
                  isSel
                    ? 'bg-[#1B1B1B] text-[#F4AE32] border-[#1B1B1B]'
                    : count > 0
                    ? 'bg-blue-50 text-blue-900 border-blue-200'
                    : 'bg-white text-[#777777] border-gray-200 hover:border-gray-300'
                }`}
              >
                P{it.numero} {count > 0 && `(${count})`}
              </button>
            );
          })}
        </div>
      </div>

      {selectedItem ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Question context card */}
          <div className="lg:col-span-5 space-y-4">
            <div className="bg-white p-5 rounded-lg border border-[#E0E0E0] shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-[#EAEAEA]">
                <h3 className="text-sm font-bold text-[#1B1B1B]">
                  Pregunta {selectedItem.numero} (En revisión)
                </h3>
                {selectedItem.apartado && (
                  <span className="text-[11px] font-mono text-[#777777]">
                    {selectedItem.apartado}
                  </span>
                )}
              </div>

              <div className="text-xs space-y-2.5 leading-relaxed">
                <div>
                  <span className="font-bold text-[#1B1B1B]">Enunciado: </span>
                  <span className="text-[#333333]">{selectedItem.enunciado}</span>
                </div>

                {selectedItem.respuestasIncorrectas.map((dist, idx) => (
                  <div key={idx} className="text-[#555555]">
                    <span className="font-semibold text-[#777777]">
                      Respuesta incorrecta:
                    </span>{' '}
                    <span>{dist}</span>
                  </div>
                ))}

                <div className="bg-gray-50 p-2 rounded border border-gray-200 text-[#1B1B1B]">
                  <span className="font-bold">Respuesta correcta: </span>
                  <span className="font-semibold">
                    {selectedItem.respuestaCorrecta}
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => handleGenerateClick(selectedItem.id)}
                  disabled={loadingAi === selectedItem.id}
                  className="w-full text-xs font-bold bg-[#F4AE32] hover:bg-[#e09e2a] text-[#1B1B1B] py-2 rounded flex items-center justify-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
                >
                  {loadingAi === selectedItem.id ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  <span>Generar nuevas sugerencias con Gemini</span>
                </button>
              </div>
            </div>
          </div>

          {/* Suggestions List Column */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-[#1B1B1B] uppercase tracking-wider">
                Sugerencias Disponibles ({filteredSuggestions.length})
              </div>

              <div className="flex items-center gap-1.5 text-xs">
                <button
                  onClick={() => setFilterType('todas')}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium ${
                    filterType === 'todas'
                      ? 'bg-[#1B1B1B] text-white'
                      : 'bg-white text-[#777777] border border-gray-200'
                  }`}
                >
                  Todas
                </button>
                <button
                  onClick={() => setFilterType('Necesaria')}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium ${
                    filterType === 'Necesaria'
                      ? 'bg-amber-600 text-white'
                      : 'bg-white text-amber-800 border border-amber-200'
                  }`}
                >
                  Necesarias
                </button>
                <button
                  onClick={() => setFilterType('Opcional')}
                  className={`px-2.5 py-1 rounded text-[11px] font-medium ${
                    filterType === 'Opcional'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-blue-800 border border-blue-200'
                  }`}
                >
                  Opcionales
                </button>
              </div>
            </div>

            {filteredSuggestions.length === 0 ? (
              <div className="bg-white p-8 rounded-lg border border-dashed border-[#D5D5D5] text-center text-xs text-[#777777]">
                <Lightbulb className="w-8 h-8 text-[#F4AE32] mx-auto mb-2" />
                <p>No hay sugerencias registradas para esta pregunta.</p>
                <button
                  onClick={() => handleGenerateClick(selectedItem.id)}
                  disabled={loadingAi === selectedItem.id}
                  className="mt-3 text-xs font-bold bg-[#1B1B1B] text-[#F4AE32] px-3.5 py-1.5 rounded inline-flex items-center gap-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Solicitar análisis pedagógico a Gemini</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSuggestions.map((sug) => (
                  <div
                    key={sug.id}
                    className="bg-white rounded-lg border border-[#E0E0E0] p-4 shadow-sm hover:border-[#F4AE32] transition-colors space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] uppercase font-black px-2 py-0.5 rounded ${
                            sug.tipo === 'Necesaria'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : 'bg-blue-100 text-blue-800 border border-blue-300'
                          }`}
                        >
                          {sug.tipo === 'Necesaria'
                            ? 'Sugerencia Necesaria'
                            : 'Mejora Opcional'}
                        </span>
                        <h4 className="text-xs font-bold text-[#1B1B1B]">
                          {sug.titulo}
                        </h4>
                      </div>

                      <span className="text-[10px] text-[#777777] font-medium">
                        {sug.criterioRelacionado}
                      </span>
                    </div>

                    <p className="text-xs text-[#444444] leading-relaxed">
                      {sug.descripcion}
                    </p>

                    {/* Proposed text preview if included */}
                    {sug.propuestaTexto && (
                      <div className="p-3 bg-gray-50 rounded border border-gray-200 text-xs space-y-1.5">
                        <div className="font-bold text-[#1B1B1B] text-[11px]">
                          Texto propuesto sugerido:
                        </div>
                        {sug.propuestaTexto.enunciado && (
                          <div>
                            <span className="font-semibold text-[#777777]">
                              Enunciado:
                            </span>{' '}
                            {sug.propuestaTexto.enunciado}
                          </div>
                        )}
                        {sug.propuestaTexto.respuestaCorrecta && (
                          <div className="font-semibold text-emerald-800">
                            <span>Respuesta correcta: </span>
                            {sug.propuestaTexto.respuestaCorrecta}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Action button: Convert to proposal */}
                    <div className="pt-2 border-t border-[#F0F0F0] flex items-center justify-between">
                      <span className="text-[11px] text-[#777777]">
                        ¿Desea aplicar esta recomendación formalmente?
                      </span>

                      <button
                        onClick={() => {
                          onConvertSuggestionToProposal(sug);
                          onNavigateToCorrect(selectedItem.id);
                        }}
                        className="text-xs font-bold bg-[#1B1B1B] hover:bg-[#333333] text-[#F4AE32] px-3.5 py-1.5 rounded flex items-center gap-1.5 transition-colors shadow-sm"
                      >
                        <span>Convertir en propuesta de corrección</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
};
