import React, { useState } from 'react';
import {
  X,
  FileDown,
  FileCode,
  Copy,
  Check,
  Download,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { ProjectData } from '../types';
import { generateUrseQuestionsDocx, generateUrseAuditReportDocx } from '../utils/docxExporter';
import { exportToContenidoUnidadPy } from '../utils/pythonExporter';
import { formatAllReactivosToUrseText } from '../utils/parser';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ProjectData;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'word' | 'auditoria' | 'python' | 'json'>('word');
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const meta = project.metadata;
  const items = project.reactivosTrabajo;
  const audit = project.auditoria;

  // Prepare Python code
  const pythonCode = exportToContenidoUnidadPy(
    items,
    meta.tipoInstrumento,
    meta.numeroYNombreUnidad
  );

  // Prepare Plain Text
  const plainText = formatAllReactivosToUrseText(
    items,
    `${meta.asignatura} - ${meta.numeroYNombreUnidad}`
  );

  const handleCopyPython = () => {
    navigator.clipboard.writeText(pythonCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(plainText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQuestionsDocx = async () => {
    setDownloading(true);
    try {
      const blob = await generateUrseQuestionsDocx(items, meta);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `URSE_Reactivos_${meta.numeroYNombreUnidad.replace(/\s+/g, '_') || 'Unidad'}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadAuditDocx = async () => {
    if (!audit) return;
    setDownloading(true);
    try {
      const blob = await generateUrseAuditReportDocx(audit, meta);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `URSE_Informe_Auditoria_${meta.numeroYNombreUnidad.replace(/\s+/g, '_') || 'Unidad'}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadPython = () => {
    const blob = new Blob([pythonCode], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contenido_unidad_${meta.tipoInstrumento}.py`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadJson = () => {
    const jsonStr = JSON.stringify(project, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `URSE_Proyecto_${meta.numeroYNombreUnidad.replace(/\s+/g, '_') || 'Unidad'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full overflow-hidden border border-[#E0E0E0] flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-[#1B1B1B] text-white p-4 flex items-center justify-between border-b border-[#333333]">
          <div className="flex items-center gap-2">
            <div className="bg-[#F4AE32] text-[#1B1B1B] font-black text-xs px-2 py-0.5 rounded">
              URSE
            </div>
            <h3 className="text-sm font-bold text-white">
              Centro de Exportación y Descargas Académicas
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector */}
        <div className="flex border-b border-[#E0E0E0] bg-[#FAFAFA] text-xs font-bold overflow-x-auto">
          <button
            onClick={() => setActiveTab('word')}
            className={`px-4 py-3 flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'word'
                ? 'border-[#F4AE32] text-[#1B1B1B] bg-white'
                : 'border-transparent text-[#777777] hover:text-[#1B1B1B]'
            }`}
          >
            <FileDown className="w-4 h-4 text-[#F4AE32]" />
            <span>A. Documento Word (.docx)</span>
          </button>

          <button
            onClick={() => setActiveTab('auditoria')}
            className={`px-4 py-3 flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'auditoria'
                ? 'border-[#F4AE32] text-[#1B1B1B] bg-white'
                : 'border-transparent text-[#777777] hover:text-[#1B1B1B]'
            }`}
          >
            <FileText className="w-4 h-4 text-[#F4AE32]" />
            <span>B. Informe de Auditoría</span>
          </button>

          <button
            onClick={() => setActiveTab('python')}
            className={`px-4 py-3 flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'python'
                ? 'border-[#F4AE32] text-[#1B1B1B] bg-white'
                : 'border-transparent text-[#777777] hover:text-[#1B1B1B]'
            }`}
          >
            <FileCode className="w-4 h-4 text-[#F4AE32]" />
            <span>D. Formato contenido_unidad.py</span>
          </button>

          <button
            onClick={() => setActiveTab('json')}
            className={`px-4 py-3 flex items-center gap-1.5 border-b-2 transition-all ${
              activeTab === 'json'
                ? 'border-[#F4AE32] text-[#1B1B1B] bg-white'
                : 'border-transparent text-[#777777] hover:text-[#1B1B1B]'
            }`}
          >
            <Download className="w-4 h-4 text-[#F4AE32]" />
            <span>C. JSON Estructurado</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'word' && (
            <div className="space-y-4 text-xs">
              <p className="text-[#555555]">
                Genera un archivo Microsoft Word (.docx) listo para impresión o entrega institucional, cumpliendo rigurosamente el formato URSE:
              </p>
              <div className="p-3 bg-gray-50 rounded border border-gray-200 font-mono text-[11px] space-y-1">
                <div>Pregunta 1</div>
                <div>Enunciado: [...]</div>
                <div>Respuesta incorrecta: [...]</div>
                <div>Respuesta incorrecta: [...]</div>
                <div>Respuesta incorrecta: [...]</div>
                <div className="font-bold text-amber-800">Respuesta correcta: [...]</div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleDownloadQuestionsDocx}
                  disabled={downloading}
                  className="w-full py-3 bg-[#F4AE32] hover:bg-[#e09e2a] text-[#1B1B1B] font-bold rounded flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <FileDown className="w-4 h-4" />
                  <span>
                    {downloading
                      ? 'Compilando documento Word...'
                      : `Descargar ${items.length} Reactivos en Word (.docx)`}
                  </span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'auditoria' && (
            <div className="space-y-4 text-xs">
              <p className="text-[#555555]">
                Descargue el dictamen oficial con datos de identificación de la unidad, matriz de cobertura temática por nomencladores, recuento de defectos críticos/moderados y dictamen institucional URSE.
              </p>

              <div className="p-3 bg-gray-50 rounded border border-gray-200 space-y-2">
                <div className="flex justify-between">
                  <span>Dictamen actual:</span>
                  <strong className="text-[#1B1B1B] uppercase">{audit?.dictamenGlobal}</strong>
                </div>
                <div className="flex justify-between">
                  <span>Cobertura de apartados:</span>
                  <strong className="text-[#1B1B1B]">{audit?.apartadosCubiertos} de {audit?.apartadosTotales}</strong>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleDownloadAuditDocx}
                  disabled={downloading || !audit}
                  className="w-full py-3 bg-[#1B1B1B] hover:bg-[#2C2C2C] text-[#F4AE32] font-bold rounded flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <FileText className="w-4 h-4" />
                  <span>Descargar Informe de Auditoría (.docx)</span>
                </button>
              </div>
            </div>
          )}

          {activeTab === 'python' && (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <p className="text-[#555555]">
                  Estructura Python compatible con la plataforma URSE ({meta.tipoInstrumento === 'formativa' ? 'FORMATIVA = [...]' : 'TEST = [...]'}):
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyPython}
                    className="text-xs bg-[#F5F5F5] hover:bg-[#EAEAEA] text-[#1B1B1B] font-semibold px-2.5 py-1.5 rounded border border-[#D0D0D0] flex items-center gap-1"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#F4AE32]" />}
                    <span>{copied ? 'Copiado' : 'Copiar Código'}</span>
                  </button>

                  <button
                    onClick={handleDownloadPython}
                    className="text-xs bg-[#1B1B1B] text-[#F4AE32] font-bold px-3 py-1.5 rounded flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar .py</span>
                  </button>
                </div>
              </div>

              <pre className="bg-[#1B1B1B] text-[#E0E0E0] p-4 rounded font-mono text-[11px] overflow-x-auto max-h-72 leading-relaxed">
                {pythonCode}
              </pre>
            </div>
          )}

          {activeTab === 'json' && (
            <div className="space-y-3 text-xs">
              <p className="text-[#555555]">
                Exporta el objeto íntegro del proyecto (metadatos, reactivos originales, copias de trabajo, diagnósticos, propuestas y matriz de auditoría):
              </p>

              <button
                onClick={handleDownloadJson}
                className="w-full py-3 bg-[#F4AE32] hover:bg-[#e09e2a] text-[#1B1B1B] font-bold rounded flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" />
                <span>Descargar Archivo JSON del Proyecto</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#FAFAFA] border-t border-[#EAEAEA] flex justify-end">
          <button
            onClick={onClose}
            className="text-xs px-4 py-2 border rounded font-medium text-[#777777] hover:bg-gray-100"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
