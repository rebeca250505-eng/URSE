import React, { useState } from 'react';
import {
  BookMarked,
  Shield,
  Search,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  Lock,
} from 'lucide-react';
import {
  URSE_GUIDELINES,
  URSE_GUIDELINES_VERSION,
} from '../constants/guidelines';

export const LineamientosView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSectionId, setExpandedSectionId] = useState<number | null>(1);

  const filteredSections = URSE_GUIDELINES.filter(
    (sec) =>
      sec.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sec.resumen.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sec.reglaAplicable.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Permanent Header Banner */}
      <div className="bg-[#1B1B1B] text-white p-6 rounded-lg border-2 border-[#F4AE32] shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-black uppercase tracking-wider text-[#1B1B1B] bg-[#F4AE32] px-2.5 py-0.5 rounded flex items-center gap-1">
              <Lock className="w-3 h-3" />
              <span>Lineamientos URSE | Solo lectura</span>
            </span>
            <span className="text-xs text-[#A0A0A0]">
              Versión normativa: <strong>{URSE_GUIDELINES_VERSION}</strong>
            </span>
          </div>
          <h1 className="text-xl font-bold text-white">
            Biblioteca Oficial de Criterios Editoriales y Pedagógicos
          </h1>
          <p className="text-xs text-[#CCCCCC] mt-1 max-w-3xl leading-relaxed">
            Normativa institucional inalterable que rige el diseño, revisión, corrección y auditoría de preguntas de selección única en la Universidad Regional del Sureste.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-72 shrink-0">
          <Search className="w-4 h-4 text-[#777777] absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar criterio o lineamiento..."
            className="w-full text-xs pl-9 pr-3 py-2 bg-[#262626] border border-[#444444] rounded text-white focus:outline-none focus:border-[#F4AE32]"
          />
        </div>
      </div>

      {/* Accordion / List of 13 Guidelines */}
      <div className="space-y-3">
        {filteredSections.map((sec) => {
          const isExpanded = expandedSectionId === sec.id;
          return (
            <div
              key={sec.id}
              className="bg-white rounded-lg border border-[#E0E0E0] shadow-sm overflow-hidden transition-all"
            >
              {/* Accordion Header */}
              <button
                onClick={() =>
                  setExpandedSectionId(isExpanded ? null : sec.id)
                }
                className="w-full text-left p-4 flex items-center justify-between hover:bg-gray-50/80 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="w-7 h-7 rounded-full bg-[#1B1B1B] text-[#F4AE32] font-bold text-xs flex items-center justify-center shrink-0">
                    {sec.id}
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-[#1B1B1B]">
                      {sec.id}. {sec.nombre}
                    </h3>
                    <p className="text-[11px] text-[#777777] mt-0.5">
                      {sec.resumen}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[10px] text-[#777777] font-semibold bg-gray-100 px-2 py-0.5 rounded hidden sm:inline">
                    Solo lectura
                  </span>
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-[#777777]" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-[#777777]" />
                  )}
                </div>
              </button>

              {/* Accordion Body */}
              {isExpanded && (
                <div className="p-5 border-t border-[#EAEAEA] bg-[#FCFCFC] space-y-4 text-xs">
                  {/* Regla Aplicable */}
                  <div className="p-3 bg-amber-50/70 border-l-4 border-[#F4AE32] rounded-r text-amber-950 font-medium">
                    <span className="font-bold text-[#1B1B1B] block mb-0.5">
                      Regla Institucional Aplicable:
                    </span>
                    <p className="leading-relaxed">{sec.reglaAplicable}</p>
                  </div>

                  {/* Criterios Detallados */}
                  <div>
                    <h4 className="text-[11px] font-bold text-[#1B1B1B] uppercase tracking-wider mb-2">
                      Criterios Específicos de Cumplimiento:
                    </h4>
                    <ul className="space-y-1.5 list-disc list-inside text-[#444444] leading-relaxed">
                      {sec.criteriosDetallados.map((crit, idx) => (
                        <li key={idx} className="pl-1">
                          {crit}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Ejemplos ilustrativos */}
                  {(sec.ejemploPositivo || sec.ejemploNegativo) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      {sec.ejemploPositivo && (
                        <div className="p-3 bg-emerald-50/60 rounded border border-emerald-200 text-emerald-950 space-y-1.5">
                          <div className="font-bold flex items-center gap-1.5 text-emerald-800 text-[11px]">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Ejemplo de Aplicación Correcta (URSE)</span>
                          </div>
                          <pre className="text-[11px] whitespace-pre-wrap font-sans bg-white p-2 rounded border border-emerald-200 text-emerald-900 leading-relaxed">
                            {sec.ejemploPositivo}
                          </pre>
                        </div>
                      )}

                      {sec.ejemploNegativo && (
                        <div className="p-3 bg-red-50/60 rounded border border-red-200 text-red-950 space-y-1.5">
                          <div className="font-bold flex items-center gap-1.5 text-red-800 text-[11px]">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Ejemplo Problemático Inadmisible</span>
                          </div>
                          <pre className="text-[11px] whitespace-pre-wrap font-sans bg-white p-2 rounded border border-red-200 text-red-900 leading-relaxed">
                            {sec.ejemploNegativo}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
