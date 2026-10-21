import React, { useState } from 'react';
import {
  Sparkles,
  Check,
  X,
  Edit3,
  RotateCcw,
  GitCompare,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import {
  CorrectionProposal,
  ProjectData,
  ReactivoItem,
} from '../types';

interface CorregirViewProps {
  project: ProjectData;
  onAcceptProposal: (itemId: string) => void;
  onRejectProposal: (itemId: string) => void;
  onSaveEditedProposal: (itemId: string, edited: ReactivoItem) => void;
  onRestoreOriginal: (itemId: string) => void;
  onGenerateProposal: (itemId: string) => Promise<void>;
}

export const CorregirView: React.FC<CorregirViewProps> = ({
  project,
  onAcceptProposal,
  onRejectProposal,
  onSaveEditedProposal,
  onRestoreOriginal,
  onGenerateProposal,
}) => {
  const items = project.reactivosTrabajo;
  const [selectedItemId, setSelectedItemId] = useState<string>(
    items[0]?.id || ''
  );
  const [isEditing, setIsEditing] = useState(false);
  const [loadingAi, setLoadingAi] = useState<string | null>(null);

  const selectedItem = items.find((i) => i.id === selectedItemId) || items[0];
  const proposal: CorrectionProposal | undefined = selectedItem
    ? project.propuestas[selectedItem.id]
    : undefined;

  // Editing state for inline modification
  const [editEnunciado, setEditEnunciado] = useState('');
  const [editInc1, setEditInc1] = useState('');
  const [editInc2, setEditInc2] = useState('');
  const [editInc3, setEditInc3] = useState('');
  const [editCorrecta, setEditCorrecta] = useState('');

  const handleStartEdit = () => {
    if (!proposal) return;
    setEditEnunciado(proposal.propuesta.enunciado);
    setEditInc1(proposal.propuesta.respuestasIncorrectas[0] || '');
    setEditInc2(proposal.propuesta.respuestasIncorrectas[1] || '');
    setEditInc3(proposal.propuesta.respuestasIncorrectas[2] || '');
    setEditCorrecta(proposal.propuesta.respuestaCorrecta || '');
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!selectedItem) return;
    const edited: ReactivoItem = {
      id: `edited-${selectedItem.id}`,
      numero: selectedItem.numero,
      apartado: selectedItem.apartado,
      enunciado: editEnunciado,
      respuestasIncorrectas: [editInc1, editInc2, editInc3],
      respuestaCorrecta: editCorrecta,
      nivelCognitivo: selectedItem.nivelCognitivo,
    };
    onSaveEditedProposal(selectedItem.id, edited);
    setIsEditing(false);
  };

  const handleGenerateClick = async (itemId: string) => {
    setLoadingAi(itemId);
    try {
      await onGenerateProposal(itemId);
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
              Módulo 2
            </span>
            <span className="text-xs font-semibold text-[#777777]">
              Propuestas de Corrección Controladas
            </span>
          </div>
          <h1 className="text-lg font-bold text-[#1B1B1B]">
            Comparación de Versiones y Aprobación
          </h1>
          <p className="text-xs text-[#777777] mt-0.5 max-w-2xl">
            Las propuestas no modifican las preguntas originales automáticamente. Cada cambio requiere su validación explícita.
          </p>
        </div>

        {/* Selected question tabs */}
        <div className="flex flex-wrap items-center gap-1.5">
          {items.map((it) => {
            const hasProp = !!project.propuestas[it.id];
            const isSel = it.id === selectedItem?.id;
            const propState = project.propuestas[it.id]?.decisionUsuario;

            return (
              <button
                key={it.id}
                onClick={() => {
                  setSelectedItemId(it.id);
                  setIsEditing(false);
                }}
                className={`text-xs px-2.5 py-1.5 rounded font-bold transition-all border ${
                  isSel
                    ? 'bg-[#1B1B1B] text-[#F4AE32] border-[#1B1B1B]'
                    : hasProp
                    ? propState === 'aceptada'
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                      : propState === 'rechazada'
                      ? 'bg-gray-100 text-gray-500 border-gray-200 line-through'
                      : 'bg-[#F4AE32]/10 text-[#1B1B1B] border-[#F4AE32]'
                    : 'bg-white text-[#777777] border-gray-200 hover:border-gray-300'
                }`}
              >
                P{it.numero}
              </button>
            );
          })}
        </div>
      </div>

      {selectedItem ? (
        <div className="space-y-6">
          {/* Action Toolbar for Current Item */}
          <div className="bg-white p-4 rounded-lg border border-[#E0E0E0] flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#1B1B1B]">
                Pregunta {selectedItem.numero}
              </span>
              {proposal ? (
                <span
                  className={`text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wider ${
                    proposal.decisionUsuario === 'aceptada'
                      ? 'bg-emerald-100 text-emerald-800'
                      : proposal.decisionUsuario === 'rechazada'
                      ? 'bg-red-100 text-red-800'
                      : proposal.decisionUsuario === 'editada'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  Propuesta {proposal.decisionUsuario}
                </span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded font-medium bg-gray-100 text-gray-600">
                  Sin propuesta generada
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleGenerateClick(selectedItem.id)}
                disabled={loadingAi === selectedItem.id}
                className="text-xs font-bold bg-[#F4AE32] hover:bg-[#e09e2a] text-[#1B1B1B] px-3.5 py-1.5 rounded flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
              >
                {loadingAi === selectedItem.id ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>
                  {proposal ? 'Regenerar con Gemini' : 'Generar Propuesta con Gemini'}
                </span>
              </button>

              {proposal && !isEditing && (
                <>
                  <button
                    onClick={() => onAcceptProposal(selectedItem.id)}
                    className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 rounded flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Aceptar Propuesta</span>
                  </button>

                  <button
                    onClick={() => onRejectProposal(selectedItem.id)}
                    className="text-xs font-medium bg-white hover:bg-gray-50 text-red-700 border border-red-300 px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Rechazar</span>
                  </button>

                  <button
                    onClick={handleStartEdit}
                    className="text-xs font-medium bg-white hover:bg-gray-50 text-[#1B1B1B] border border-[#D0D0D0] px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors"
                  >
                    <Edit3 className="w-3.5 h-3.5 text-[#F4AE32]" />
                    <span>Editar Propuesta</span>
                  </button>
                </>
              )}

              <button
                onClick={() => onRestoreOriginal(selectedItem.id)}
                className="text-xs text-[#777777] hover:text-[#1B1B1B] px-2.5 py-1.5 rounded flex items-center gap-1 transition-colors"
                title="Deshacer cambios y restaurar versión original"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Restaurar Original</span>
              </button>
            </div>
          </div>

          {/* Side by Side Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Columna Izquierda: Original */}
            <div className="bg-white rounded-lg border border-[#E0E0E0] p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-[#EAEAEA]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                  <h3 className="text-sm font-bold text-[#1B1B1B]">
                    Reactivo Original (Sin alteraciones)
                  </h3>
                </div>
                <span className="text-[11px] text-[#777777] font-mono">
                  Versión original intacta
                </span>
              </div>

              <div className="space-y-3 text-xs leading-relaxed">
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

                <div className="bg-gray-50 p-2.5 rounded border border-gray-200">
                  <span className="font-bold text-[#1B1B1B]">
                    Respuesta correcta:
                  </span>{' '}
                  <span className="font-semibold text-[#1B1B1B]">
                    {selectedItem.respuestaCorrecta}
                  </span>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Propuesta Corregida */}
            <div className="bg-white rounded-lg border-2 border-[#F4AE32]/60 p-5 shadow-sm space-y-4 relative">
              <div className="flex items-center justify-between pb-3 border-b border-[#EAEAEA]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#F4AE32]" />
                  <h3 className="text-sm font-bold text-[#1B1B1B]">
                    Propuesta de Corrección URSE
                  </h3>
                </div>
                {proposal && (
                  <span className="text-[11px] font-bold text-[#F4AE32] bg-[#1B1B1B] px-2 py-0.5 rounded">
                    Estado resultante: {proposal.estadoResultante}
                  </span>
                )}
              </div>

              {proposal ? (
                isEditing ? (
                  /* Inline Editor */
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-bold text-[#1B1B1B] mb-1">
                        Enunciado:
                      </label>
                      <textarea
                        rows={3}
                        value={editEnunciado}
                        onChange={(e) => setEditEnunciado(e.target.value)}
                        className="w-full text-xs p-2 border border-[#F4AE32] rounded focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#777777] mb-1">
                        Respuesta incorrecta 1:
                      </label>
                      <input
                        type="text"
                        value={editInc1}
                        onChange={(e) => setEditInc1(e.target.value)}
                        className="w-full text-xs p-2 border border-gray-300 rounded focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#777777] mb-1">
                        Respuesta incorrecta 2:
                      </label>
                      <input
                        type="text"
                        value={editInc2}
                        onChange={(e) => setEditInc2(e.target.value)}
                        className="w-full text-xs p-2 border border-gray-300 rounded focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-[#777777] mb-1">
                        Respuesta incorrecta 3:
                      </label>
                      <input
                        type="text"
                        value={editInc3}
                        onChange={(e) => setEditInc3(e.target.value)}
                        className="w-full text-xs p-2 border border-gray-300 rounded focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-[#1B1B1B] mb-1">
                        Respuesta correcta (siempre al final):
                      </label>
                      <input
                        type="text"
                        value={editCorrecta}
                        onChange={(e) => setEditCorrecta(e.target.value)}
                        className="w-full text-xs p-2 border border-emerald-400 rounded focus:outline-none bg-emerald-50/50"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="text-xs px-3 py-1.5 border rounded text-[#777777] hover:bg-gray-50"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        className="text-xs px-3.5 py-1.5 bg-[#1B1B1B] text-[#F4AE32] font-bold rounded"
                      >
                        Guardar Cambios de Propuesta
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Display Proposal */
                  <div className="space-y-3 text-xs leading-relaxed">
                    <div>
                      <span className="font-bold text-[#1B1B1B]">Enunciado: </span>
                      <span className="text-[#1B1B1B] bg-emerald-50 px-1 py-0.5 rounded">
                        {proposal.propuesta.enunciado}
                      </span>
                    </div>

                    {proposal.propuesta.respuestasIncorrectas.map((dist, idx) => (
                      <div key={idx} className="text-[#333333]">
                        <span className="font-semibold text-[#777777]">
                          Respuesta incorrecta:
                        </span>{' '}
                        <span>{dist}</span>
                      </div>
                    ))}

                    <div className="bg-emerald-50/60 p-2.5 rounded border border-emerald-300">
                      <span className="font-bold text-emerald-800">
                        Respuesta correcta:
                      </span>{' '}
                      <span className="font-bold text-emerald-950">
                        {proposal.propuesta.respuestaCorrecta}
                      </span>
                    </div>
                  </div>
                )
              ) : (
                <div className="p-8 text-center text-[#777777] text-xs">
                  <p>No se ha generado una propuesta de corrección para este reactivo.</p>
                  <button
                    onClick={() => handleGenerateClick(selectedItem.id)}
                    disabled={loadingAi === selectedItem.id}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold bg-[#F4AE32] hover:bg-[#e09e2a] text-[#1B1B1B] px-4 py-2 rounded shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generar propuesta con Gemini</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Proposal Rationale & Changes Box */}
          {proposal && (
            <div className="bg-white rounded-lg border border-[#E0E0E0] p-5 shadow-sm space-y-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#1B1B1B]">
                Detalle y Fundamentación de la Corrección
              </h3>

              {proposal.cambioRespuestaCorrecta && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-900 rounded text-xs flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                  <div>
                    <strong className="font-bold">Advertencia disciplinar importante:</strong>
                    <p className="mt-0.5">
                      La respuesta correcta original fue reemplazada o reestructurada porque presentaba vicios conceptuales o discordancia con la unidad académica.
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-3 bg-gray-50 rounded border border-gray-200">
                  <span className="font-bold text-[#1B1B1B] block mb-1">
                    Problemas Corregidos:
                  </span>
                  <ul className="list-disc list-inside space-y-1 text-[#555555]">
                    {proposal.problemasCorregidos.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 bg-gray-50 rounded border border-gray-200">
                  <span className="font-bold text-[#1B1B1B] block mb-1">
                    Motivo de las Modificaciones:
                  </span>
                  <p className="text-[#555555] leading-relaxed">
                    {proposal.motivoModificacion}
                  </p>
                </div>

                <div className="p-3 bg-gray-50 rounded border border-gray-200">
                  <span className="font-bold text-[#1B1B1B] block mb-1">
                    Evidencia Utilizada:
                  </span>
                  <p className="italic text-[#555555] leading-relaxed">
                    {proposal.evidenciaUtilizada}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};
