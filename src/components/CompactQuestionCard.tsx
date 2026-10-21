import React, { useState } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Sparkles,
} from 'lucide-react';
import {
  CorrectionProposal,
  ReactivoDiagnostic,
  ReactivoItem,
} from '../types';

interface CompactQuestionCardProps {
  item: ReactivoItem;
  diagnostic?: ReactivoDiagnostic;
  proposal?: CorrectionProposal;
  isCorrectMode?: boolean;
  onAcceptProposal?: (itemId: string) => void;
  onRejectProposal?: (itemId: string) => void;
  onRequestProposal?: (itemId: string) => void;
  isLoadingAi?: boolean;
}

export const CompactQuestionCard: React.FC<CompactQuestionCardProps> = ({
  item,
  diagnostic,
  proposal,
  isCorrectMode = false,
  onAcceptProposal,
  onRejectProposal,
  onRequestProposal,
  isLoadingAi = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(isCorrectMode || diagnostic?.estado !== 'aprobada');

  const isApproved = diagnostic?.estado === 'aprobada';
  const isAjuste = diagnostic?.estado === 'requiere_ajustes';
  const isReconstruccion = diagnostic?.estado === 'requiere_reconstruccion';

  // Get primary problem and suggestion (1-2 sentences)
  const primaryObs = diagnostic?.observaciones?.[0];
  const problemaBreve = primaryObs
    ? primaryObs.problema
    : isApproved
    ? 'Cumple con los criterios editoriales, pedagógicos y estructurales URSE.'
    : 'Presenta inconsistencias con los lineamientos URSE.';

  const sugerenciaBreve = primaryObs
    ? primaryObs.comoCorregir
    : isApproved
    ? 'No requiere modificaciones.'
    : 'Revisar la formulación y balancear los distractores.';

  return (
    <div
      className={`bg-white rounded-lg border transition-all shadow-sm ${
        isApproved
          ? 'border-emerald-200'
          : isAjuste
          ? 'border-amber-200'
          : 'border-red-200'
      }`}
    >
      {/* Compact Card Header */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        className="p-3.5 flex items-start justify-between gap-3 cursor-pointer hover:bg-gray-50/80 transition-colors select-none"
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-xs text-[#1B1B1B]">
              Pregunta {item.numero}:
            </span>

            {isApproved ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Correcta.</span>
              </span>
            ) : isAjuste ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                <AlertTriangle className="w-3 h-3 text-amber-600" />
                <span>Requiere ajuste.</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-red-800 bg-red-100 px-2 py-0.5 rounded">
                <XCircle className="w-3 h-3 text-red-600" />
                <span>Requiere reconstrucción.</span>
              </span>
            )}

            {proposal && (
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${
                  proposal.decisionUsuario === 'aceptada'
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : proposal.decisionUsuario === 'rechazada'
                    ? 'bg-gray-100 text-gray-500 line-through'
                    : 'bg-[#F4AE32] text-[#1B1B1B]'
                }`}
              >
                {proposal.decisionUsuario === 'aceptada'
                  ? 'Corrección aceptada'
                  : proposal.decisionUsuario === 'rechazada'
                  ? 'Propuesta rechazada'
                  : 'Propuesta lista'}
              </span>
            )}
          </div>

          {/* If problematic, show concise Problem and Suggestion right in the compact view */}
          {!isApproved && (
            <div className="mt-1.5 text-xs text-[#333333] space-y-1">
              <div>
                <strong className="text-[#1B1B1B]">Problema:</strong>{' '}
                <span className="text-[#444444]">{problemaBreve}</span>
              </div>
              <div>
                <strong className="text-[#1B1B1B]">Sugerencia:</strong>{' '}
                <span className="text-[#444444]">{sugerenciaBreve}</span>
              </div>
            </div>
          )}

          {/* Short stem snippet */}
          <div className="text-[11px] text-[#777777] truncate mt-1">
            {item.enunciado}
          </div>
        </div>

        {/* Toggle chevron */}
        <button
          type="button"
          className="text-[#777777] hover:text-[#1B1B1B] p-1 shrink-0"
          title={isExpanded ? 'Ocultar detalles' : 'Ver detalles'}
        >
          {isExpanded ? (
            <ChevronUp className="w-4 h-4" />
          ) : (
            <ChevronDown className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="p-4 border-t border-[#EAEAEA] bg-[#FAFAFA] space-y-4 text-xs">
          {/* Mode 1: Correction Comparison Side-by-Side if proposal exists or requested */}
          {proposal ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Original */}
                <div className="p-3 bg-white rounded border border-[#E0E0E0] space-y-2">
                  <div className="font-bold text-[11px] uppercase tracking-wider text-[#777777] border-b pb-1">
                    Original
                  </div>
                  <div className="text-[#1B1B1B] leading-relaxed">
                    <span className="font-bold">Enunciado: </span>
                    {proposal.original.enunciado}
                  </div>
                  {proposal.original.respuestasIncorrectas.map((dist, idx) => (
                    <div key={idx} className="text-[#555555]">
                      <span className="font-semibold text-[#777777]">
                        Respuesta incorrecta:
                      </span>{' '}
                      {dist}
                    </div>
                  ))}
                  <div className="text-[#1B1B1B] pt-1">
                    <span className="font-bold text-[#1B1B1B]">
                      Respuesta correcta:
                    </span>{' '}
                    <span className="font-semibold">
                      {proposal.original.respuestaCorrecta}
                    </span>
                  </div>
                </div>

                {/* Propuesta Corregida */}
                <div className="p-3 bg-emerald-50/50 rounded border-2 border-emerald-300 space-y-2">
                  <div className="font-bold text-[11px] uppercase tracking-wider text-emerald-800 border-b border-emerald-200 pb-1 flex items-center justify-between">
                    <span>Propuesta de Corrección</span>
                    <span className="text-[10px] text-emerald-700 bg-white px-1.5 py-0.2 rounded border">
                      URSE
                    </span>
                  </div>
                  <div className="text-[#1B1B1B] leading-relaxed">
                    <span className="font-bold text-emerald-950">Enunciado: </span>
                    {proposal.propuesta.enunciado}
                  </div>
                  {proposal.propuesta.respuestasIncorrectas.map((dist, idx) => (
                    <div key={idx} className="text-[#333333]">
                      <span className="font-semibold text-[#777777]">
                        Respuesta incorrecta:
                      </span>{' '}
                      {dist}
                    </div>
                  ))}
                  <div className="text-[#1B1B1B] pt-1">
                    <span className="font-bold text-emerald-900">
                      Respuesta correcta:
                    </span>{' '}
                    <span className="font-bold text-emerald-950">
                      {proposal.propuesta.respuestaCorrecta}
                    </span>
                  </div>
                </div>
              </div>

              {/* Qué cambió */}
              <div className="p-2.5 bg-white rounded border border-[#E0E0E0] text-xs">
                <strong className="text-[#1B1B1B] block mb-0.5">Qué cambió:</strong>
                <p className="text-[#555555] leading-relaxed">
                  {proposal.queCambio || proposal.motivoModificacion}
                </p>
              </div>

              {/* Botones Aceptar / Rechazar */}
              {proposal.decisionUsuario === 'pendiente' && onAcceptProposal && onRejectProposal && (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => onAcceptProposal(item.id)}
                    className="text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white px-4 py-1.5 rounded flex items-center gap-1.5 transition-colors shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Aceptar propuesta</span>
                  </button>

                  <button
                    onClick={() => onRejectProposal(item.id)}
                    className="text-xs font-medium bg-white hover:bg-gray-100 text-red-700 border border-red-300 px-3 py-1.5 rounded flex items-center gap-1.5 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Rechazar</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Mode 2: Standard Full View of the Item */
            <div className="space-y-3">
              <div className="p-3 bg-white rounded border border-[#E0E0E0] space-y-2">
                <div className="text-[#1B1B1B] leading-relaxed">
                  <span className="font-bold">Enunciado: </span>
                  {item.enunciado}
                </div>

                {item.respuestasIncorrectas.map((dist, idx) => (
                  <div key={idx} className="text-[#555555]">
                    <span className="font-semibold text-[#777777]">
                      Respuesta incorrecta:
                    </span>{' '}
                    {dist}
                  </div>
                ))}

                <div className="text-[#1B1B1B] pt-1">
                  <span className="font-bold text-[#F4AE32] bg-[#1B1B1B] px-1.5 py-0.5 rounded mr-1">
                    Respuesta correcta:
                  </span>{' '}
                  <span className="font-semibold">{item.respuestaCorrecta}</span>
                </div>
              </div>

              {/* If item needs adjustment and no proposal yet, offer "Generar corrección" */}
              {!isApproved && onRequestProposal && (
                <div className="flex justify-end pt-1">
                  <button
                    onClick={() => onRequestProposal(item.id)}
                    disabled={isLoadingAi}
                    className="text-xs font-bold bg-[#F4AE32] hover:bg-[#e09e2a] text-[#1B1B1B] px-3.5 py-1.5 rounded flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Generar propuesta de corrección</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
