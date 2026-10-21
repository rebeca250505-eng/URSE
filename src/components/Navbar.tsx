import React from 'react';
import { Download, Plus, BookOpen, ShieldCheck, AlertCircle } from 'lucide-react';
import { ProjectData } from '../types';

interface NavbarProps {
  currentProject: ProjectData;
  allProjects: ProjectData[];
  onSelectProject: (id: string) => void;
  onNewProject: () => void;
  onOpenExport: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentProject,
  allProjects,
  onSelectProject,
  onNewProject,
  onOpenExport,
}) => {
  const meta = currentProject.metadata;
  const total = currentProject.reactivosTrabajo.length;
  const aprobados = currentProject.reactivosAprobados.length;

  return (
    <header className="bg-[#1B1B1B] text-white border-b border-[#333333] sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <div className="bg-[#F4AE32] text-[#1B1B1B] font-black text-xl px-2.5 py-1 rounded tracking-wider shadow-sm">
              URSE
            </div>
            <div className="hidden sm:block">
              <div className="text-sm font-semibold tracking-wide text-white">
                Control de Reactivos Académicos
              </div>
              <div className="text-[11px] text-[#A0A0A0]">
                Universidad Regional del Sureste
              </div>
            </div>
          </div>

          <div className="hidden md:block h-6 w-px bg-[#333333] mx-2" />

          {/* Project selector dropdown */}
          <div className="relative">
            <select
              value={meta.id}
              onChange={(e) => onSelectProject(e.target.value)}
              className="bg-[#262626] text-xs text-white border border-[#444444] rounded px-2.5 py-1.5 focus:outline-none focus:border-[#F4AE32] max-w-[220px] truncate"
              title="Cambiar de proyecto activo"
            >
              {allProjects.map((p) => (
                <option key={p.metadata.id} value={p.metadata.id}>
                  {p.metadata.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Center / Stats info */}
        <div className="hidden lg:flex items-center space-x-4 text-xs">
          <span className="text-[#A0A0A0] flex items-center gap-1.5">
            <BookOpen className="w-3.5 h-3.5 text-[#F4AE32]" />
            <span className="font-medium text-white truncate max-w-[180px]">
              {meta.asignatura || 'Sin Asignatura'}
            </span>
          </span>

          <span className="bg-[#2A2A2A] px-2.5 py-1 rounded text-[#F4AE32] font-semibold border border-[#3A3A3A]">
            {meta.tipoInstrumento === 'formativa'
              ? 'Actividad Formativa (3 preguntas)'
              : 'Cuestionario Evaluativo'}
          </span>

          <span className="flex items-center gap-1 text-[#C0C0C0]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              {aprobados} / {total} aprobadas
            </span>
          </span>
        </div>

        {/* Right Actions */}
        <div className="flex items-center space-x-2.5">
          <button
            onClick={onNewProject}
            className="flex items-center space-x-1.5 text-xs bg-[#2A2A2A] hover:bg-[#333333] text-white px-3 py-1.5 rounded border border-[#444444] transition-colors"
            title="Crear un nuevo proyecto académico"
          >
            <Plus className="w-3.5 h-3.5 text-[#F4AE32]" />
            <span className="hidden sm:inline">Nuevo Proyecto</span>
          </button>

          <button
            onClick={onOpenExport}
            className="flex items-center space-x-1.5 text-xs font-semibold bg-[#F4AE32] hover:bg-[#e09e2a] text-[#1B1B1B] px-3.5 py-1.5 rounded transition-colors shadow-sm"
            title="Descargar en Word, Informe o Python"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar</span>
          </button>
        </div>
      </div>
    </header>
  );
};
