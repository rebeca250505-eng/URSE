import React from 'react';
import {
  LayoutDashboard,
  Search,
  Sparkles,
  Lightbulb,
  FilePlus,
  ClipboardCheck,
  BookMarked,
  FileText,
  Info,
} from 'lucide-react';
import { ProjectData } from '../types';

export type ActiveTab =
  | 'dashboard'
  | 'documento'
  | 'revisar'
  | 'corregir'
  | 'sugerir'
  | 'crear'
  | 'auditar'
  | 'lineamientos';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  project: ProjectData;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  project,
}) => {
  const total = project.reactivosTrabajo.length;
  const propuestasCount = Object.keys(project.propuestas || {}).length;
  const sugerenciasCount = (project.sugerencias || []).length;

  // Count items with observations
  let itemsConAjustes = 0;
  let itemsCriticos = 0;
  Object.values(project.diagnosticos || {}).forEach((d) => {
    if (d.estado === 'requiere_ajustes') itemsConAjustes++;
    if (d.estado === 'requiere_reconstruccion') itemsCriticos++;
  });

  const navItems = [
    {
      id: 'dashboard' as ActiveTab,
      label: 'Panel de Inicio',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'documento' as ActiveTab,
      label: 'Documento y Temario',
      icon: FileText,
      badge: project.metadata.temario.length > 0 ? `${project.metadata.temario.length} temas` : null,
      badgeColor: 'bg-[#E5E5E5] text-[#333333]',
    },
    {
      id: 'revisar' as ActiveTab,
      label: 'Módulo 1. Revisar',
      icon: Search,
      badge: itemsCriticos > 0 ? `${itemsCriticos} críticos` : itemsConAjustes > 0 ? `${itemsConAjustes} ajustes` : `${total} items`,
      badgeColor: itemsCriticos > 0 ? 'bg-red-100 text-red-800' : itemsConAjustes > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800',
    },
    {
      id: 'corregir' as ActiveTab,
      label: 'Módulo 2. Corregir',
      icon: Sparkles,
      badge: propuestasCount > 0 ? `${propuestasCount} prop.` : null,
      badgeColor: 'bg-[#F4AE32] text-[#1B1B1B] font-bold',
    },
    {
      id: 'sugerir' as ActiveTab,
      label: 'Módulo 3. Sugerir',
      icon: Lightbulb,
      badge: sugerenciasCount > 0 ? `${sugerenciasCount}` : null,
      badgeColor: 'bg-blue-100 text-blue-800',
    },
    {
      id: 'crear' as ActiveTab,
      label: 'Módulo 4. Crear',
      icon: FilePlus,
      badge: 'Desde cero',
      badgeColor: 'bg-purple-100 text-purple-800',
    },
    {
      id: 'auditar' as ActiveTab,
      label: 'Módulo 5. Auditar',
      icon: ClipboardCheck,
      badge: project.auditoria?.dictamenGlobal || null,
      badgeColor:
        project.auditoria?.dictamenGlobal === 'APROBADO'
          ? 'bg-emerald-100 text-emerald-800'
          : 'bg-amber-100 text-amber-800',
    },
    {
      id: 'lineamientos' as ActiveTab,
      label: 'Módulo 6. Lineamientos URSE',
      icon: BookMarked,
      badge: 'Solo lectura',
      badgeColor: 'bg-[#1B1B1B] text-[#F4AE32] font-semibold',
    },
  ];

  return (
    <aside className="w-full md:w-64 bg-white border-r border-[#E0E0E0] flex flex-col justify-between shrink-0 shadow-sm">
      <div className="p-3">
        <div className="px-3 py-2 text-[11px] font-bold text-[#777777] uppercase tracking-wider">
          Módulos Académicos
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-[#1B1B1B] text-[#F4AE32] shadow-sm font-semibold'
                    : 'text-[#333333] hover:bg-[#F5F5F5] hover:text-[#1B1B1B]'
                }`}
              >
                <div className="flex items-center space-x-2.5 truncate">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-[#F4AE32]' : 'text-[#777777]'
                    }`}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full shrink-0 ${item.badgeColor}`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer institutional info */}
      <div className="p-3 border-t border-[#EAEAEA] bg-[#FAFAFA] text-[11px] text-[#777777]">
        <div className="flex items-center space-x-1.5 text-[#1B1B1B] font-semibold mb-1">
          <Info className="w-3.5 h-3.5 text-[#F4AE32]" />
          <span>Lineamientos URSE 2026.1</span>
        </div>
        <p className="leading-tight text-[10px]">
          Almacenamiento local activo en este navegador. Las correcciones
          requieren aprobación explícita.
        </p>
      </div>
    </aside>
  );
};
