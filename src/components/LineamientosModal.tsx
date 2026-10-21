import React, { useState } from 'react';
import { X, Search, ChevronDown, ChevronRight, Lock, BookOpen } from 'lucide-react';
import { URSE_GUIDELINES, URSE_GUIDELINES_VERSION } from '../constants/guidelines';

interface LineamientosModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LineamientosModal: React.FC<LineamientosModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState<number | null>(1);

  const filtered = URSE_GUIDELINES.filter(
    (g) =>
      g.nombre.toLowerCase().includes(search.toLowerCase()) ||
      g.resumen.toLowerCase().includes(search.toLowerCase()) ||
      g.reglaAplicable.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full overflow-hidden border border-[#E0E0E0] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#1B1B1B] text-white p-4 flex items-center justify-between border-b border-[#333333]">
          <div className="flex items-center gap-2">
            <span className="bg-[#F4AE32] text-[#1B1B1B] font-bold text-xs px-2 py-0.5 rounded flex items-center gap-1">
              <Lock className="w-3 h-3" />
              <span>Lineamientos URSE | Solo lectura</span>
            </span>
            <span className="text-xs text-[#A0A0A0]">
              v{URSE_GUIDELINES_VERSION}
            </span>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-3 bg-gray-50 border-b border-gray-200">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar criterio o lineamiento..."
              className="w-full text-xs pl-9 pr-3 py-1.5 bg-white border border-gray-300 rounded focus:outline-none focus:border-[#F4AE32]"
            />
          </div>
        </div>

        {/* Content list */}
        <div className="p-4 overflow-y-auto flex-1 space-y-2.5 text-xs">
          {filtered.map((item) => {
            const isOpen = openId === item.id;
            return (
              <div
                key={item.id}
                className="border border-gray-200 rounded-lg overflow-hidden bg-white"
              >
                <button
                  type="button"
                  onClick={() => setOpenId(isOpen ? null : item.id)}
                  className="w-full text-left p-3 flex items-center justify-between hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-2 font-bold text-[#1B1B1B]">
                    <span className="w-5 h-5 rounded-full bg-[#1B1B1B] text-[#F4AE32] flex items-center justify-center text-[10px]">
                      {item.id}
                    </span>
                    <span>{item.nombre}</span>
                  </div>
                  {isOpen ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                </button>

                {isOpen && (
                  <div className="p-3.5 bg-[#FAF9F6] border-t border-gray-200 space-y-2 text-[#444444] leading-relaxed">
                    <div className="p-2.5 bg-amber-50/80 border-l-3 border-[#F4AE32] rounded-r text-amber-950 font-medium">
                      <strong>Regla:</strong> {item.reglaAplicable}
                    </div>

                    <ul className="list-disc list-inside space-y-1 text-[11px] text-[#555555]">
                      {item.criteriosDetallados.map((c, i) => (
                        <li key={i}>{c}</li>
                      ))}
                    </ul>

                    {item.ejemploPositivo && (
                      <div className="mt-2 p-2 bg-emerald-50 rounded border border-emerald-200">
                        <strong className="text-emerald-800 text-[10px] uppercase block mb-1">
                          Ejemplo adecuado:
                        </strong>
                        <pre className="text-[11px] whitespace-pre-wrap font-sans text-emerald-950">
                          {item.ejemploPositivo}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="text-xs px-4 py-1.5 border border-gray-300 rounded text-gray-700 hover:bg-gray-100"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
