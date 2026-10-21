import React, { useState } from 'react';
import {
  Upload,
  FileText,
  FileCode,
  AlertCircle,
  CheckCircle2,
  ListTree,
  Plus,
  Trash2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { InstrumentType, ProjectMetadata, SyllabusTopic } from '../types';
import { extractSyllabusTopics, parseReactivosFromText } from '../utils/parser';

interface DocumentInputProps {
  metadata: ProjectMetadata;
  onUpdateMetadata: (updated: Partial<ProjectMetadata>) => void;
  onLoadParsedQuestions: (rawText: string) => void;
  onExtractTopicsFromUnit: () => void;
}

export const DocumentInput: React.FC<DocumentInputProps> = ({
  metadata,
  onUpdateMetadata,
  onLoadParsedQuestions,
  onExtractTopicsFromUnit,
}) => {
  const [activeTab, setActiveTab] = useState<'archivo' | 'pegar_unidad' | 'pegar_preguntas'>('archivo');
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadWarning, setUploadWarning] = useState<string | null>(null);
  const [rawQuestionsInput, setRawQuestionsInput] = useState('');
  const [unitTextInput, setUnitTextInput] = useState(metadata.contenidoUnidad || '');
  const [newTopicNomenclador, setNewTopicNomenclador] = useState('');
  const [newTopicTitulo, setNewTopicTitulo] = useState('');

  // Handle file upload to /api/parse-document
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadLoading(true);
    setUploadError(null);
    setUploadWarning(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const base64Data = (reader.result as string).split(',')[1];
          const response = await fetch('/api/parse-document', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileData: base64Data,
              fileName: file.name,
              fileType: file.name.endsWith('.docx') ? 'docx' : file.name.endsWith('.pdf') ? 'pdf' : 'texto',
            }),
          });

          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || 'Error al procesar el archivo.');
          }

          // If warnings were returned (e.g. low char count, scan issue)
          if (data.warnings && data.warnings.length > 0) {
            setUploadWarning(data.warnings.join(' '));
          }

          setUnitTextInput(data.text);
          onUpdateMetadata({
            contenidoUnidad: data.text,
            documentoNombre: file.name,
            documentoTamano: file.size,
            documentoTipo: file.name.endsWith('.docx') ? 'docx' : 'pdf',
            temario: data.topics?.length > 0 ? data.topics : metadata.temario,
          });

          // Check if file also contained questions
          const { items: detectedQuestions } = parseReactivosFromText(data.text);
          if (detectedQuestions.length > 0) {
            onLoadParsedQuestions(data.text);
          }
        } catch (err: any) {
          setUploadError(err.message || 'Error en el servidor al leer el documento.');
        } finally {
          setUploadLoading(false);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setUploadError(err.message);
      setUploadLoading(false);
    }
  };

  const handleApplyUnitText = () => {
    const detected = extractSyllabusTopics(unitTextInput);
    onUpdateMetadata({
      contenidoUnidad: unitTextInput,
      temario: detected.length > 0 ? detected : metadata.temario,
    });
  };

  const handleApplyPastedQuestions = () => {
    if (!rawQuestionsInput.trim()) return;
    onLoadParsedQuestions(rawQuestionsInput);
  };

  const handleAddTopic = () => {
    if (!newTopicNomenclador.trim() || !newTopicTitulo.trim()) return;
    const newTopic: SyllabusTopic = {
      id: `topic-${Date.now()}`,
      nomenclador: newTopicNomenclador.trim(),
      titulo: newTopicTitulo.trim(),
    };
    onUpdateMetadata({
      temario: [...metadata.temario, newTopic],
    });
    setNewTopicNomenclador('');
    setNewTopicTitulo('');
  };

  const handleRemoveTopic = (id: string) => {
    onUpdateMetadata({
      temario: metadata.temario.filter(t => t.id !== id),
    });
  };

  return (
    <div className="space-y-6">
      {/* Unit Metadata Header Form */}
      <div className="bg-white rounded-lg p-6 border border-[#E0E0E0] shadow-sm">
        <h2 className="text-base font-bold text-[#1B1B1B] mb-1">
          Información de la Unidad Académica
        </h2>
        <p className="text-xs text-[#777777] mb-4">
          Ingrese o confirme los datos de referencia institucional para contextualizar el análisis y la matriz de cobertura.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#1B1B1B] mb-1">
              Asignatura
            </label>
            <input
              type="text"
              value={metadata.asignatura}
              onChange={(e) => onUpdateMetadata({ asignatura: e.target.value })}
              placeholder="Ej. Control Constitucional"
              className="w-full text-xs px-3 py-2 border border-[#D5D5D5] rounded focus:outline-none focus:border-[#F4AE32]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1B1B1B] mb-1">
              Número y Nombre de Unidad
            </label>
            <input
              type="text"
              value={metadata.numeroYNombreUnidad}
              onChange={(e) => onUpdateMetadata({ numeroYNombreUnidad: e.target.value })}
              placeholder="Ej. Unidad 1: El Juicio de Amparo"
              className="w-full text-xs px-3 py-2 border border-[#D5D5D5] rounded focus:outline-none focus:border-[#F4AE32]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1B1B1B] mb-1">
              Nivel Académico
            </label>
            <select
              value={metadata.nivelAcademico}
              onChange={(e) =>
                onUpdateMetadata({
                  nivelAcademico: e.target.value as any,
                })
              }
              className="w-full text-xs px-3 py-2 border border-[#D5D5D5] rounded focus:outline-none focus:border-[#F4AE32] bg-white"
            >
              <option value="Licenciatura">Licenciatura</option>
              <option value="Especialidad">Especialidad</option>
              <option value="Maestría">Maestría</option>
              <option value="Doctorado">Doctorado</option>
              <option value="Educación Continua">Educación Continua</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1B1B1B] mb-1">
              Tipo de Instrumento
            </label>
            <select
              value={metadata.tipoInstrumento}
              onChange={(e) =>
                onUpdateMetadata({
                  tipoInstrumento: e.target.value as InstrumentType,
                })
              }
              className="w-full text-xs px-3 py-2 border border-[#D5D5D5] rounded focus:outline-none focus:border-[#F4AE32] bg-white font-semibold text-[#1B1B1B]"
            >
              <option value="formativa">Actividad Formativa (Exactamente 3 preguntas)</option>
              <option value="evaluativo">Cuestionario Evaluativo (10 a 15 preguntas)</option>
            </select>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-xs font-semibold text-[#1B1B1B] mb-1">
            Fin de Aprendizaje de la Unidad
          </label>
          <textarea
            rows={2}
            value={metadata.finAprendizaje || ''}
            onChange={(e) => onUpdateMetadata({ finAprendizaje: e.target.value })}
            placeholder="Describa el objetivo o competencia a evaluar en esta unidad..."
            className="w-full text-xs px-3 py-2 border border-[#D5D5D5] rounded focus:outline-none focus:border-[#F4AE32]"
          />
        </div>
      </div>

      {/* Tabs for Ingestion Methods */}
      <div className="bg-white rounded-lg border border-[#E0E0E0] shadow-sm overflow-hidden">
        <div className="flex border-b border-[#E0E0E0] bg-[#FAFAFA]">
          <button
            onClick={() => setActiveTab('archivo')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition-all ${
              activeTab === 'archivo'
                ? 'bg-white text-[#1B1B1B] border-b-2 border-[#F4AE32]'
                : 'text-[#777777] hover:text-[#1B1B1B]'
            }`}
          >
            <Upload className="w-4 h-4 text-[#F4AE32]" />
            <span>Método A. Cargar Documento (Word o PDF)</span>
          </button>

          <button
            onClick={() => setActiveTab('pegar_unidad')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition-all ${
              activeTab === 'pegar_unidad'
                ? 'bg-white text-[#1B1B1B] border-b-2 border-[#F4AE32]'
                : 'text-[#777777] hover:text-[#1B1B1B]'
            }`}
          >
            <FileText className="w-4 h-4 text-[#F4AE32]" />
            <span>Método B1. Pegar Contenido de Unidad</span>
          </button>

          <button
            onClick={() => setActiveTab('pegar_preguntas')}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-bold transition-all ${
              activeTab === 'pegar_preguntas'
                ? 'bg-white text-[#1B1B1B] border-b-2 border-[#F4AE32]'
                : 'text-[#777777] hover:text-[#1B1B1B]'
            }`}
          >
            <FileCode className="w-4 h-4 text-[#F4AE32]" />
            <span>Método B2. Pegar Preguntas / Cuestionario</span>
          </button>
        </div>

        <div className="p-6">
          {/* Method A: Upload */}
          {activeTab === 'archivo' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-[#D5D5D5] hover:border-[#F4AE32] rounded-lg p-8 text-center transition-colors">
                <Upload className="w-10 h-10 text-[#F4AE32] mx-auto mb-2" />
                <h3 className="text-sm font-bold text-[#1B1B1B]">
                  Seleccione o arrastre su archivo .docx o .pdf
                </h3>
                <p className="text-xs text-[#777777] mt-1 max-w-md mx-auto">
                  La aplicación extraerá el texto íntegro, reconocerá el temario por nomencladores jerárquicos y las preguntas existentes.
                </p>

                <div className="mt-4">
                  <label className="cursor-pointer inline-flex items-center gap-2 text-xs font-bold bg-[#F4AE32] hover:bg-[#e09e2a] text-[#1B1B1B] px-4 py-2.5 rounded transition-colors shadow-sm">
                    <span>Examinar equipo</span>
                    <input
                      type="file"
                      accept=".docx,.pdf,.txt"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={uploadLoading}
                    />
                  </label>
                </div>

                {uploadLoading && (
                  <div className="flex items-center justify-center gap-2 text-xs text-[#1B1B1B] mt-4 font-semibold">
                    <RefreshCw className="w-4 h-4 animate-spin text-[#F4AE32]" />
                    <span>Extrayendo texto y procesando apartados...</span>
                  </div>
                )}
              </div>

              {uploadError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <strong>Error de lectura:</strong> {uploadError}
                  </div>
                </div>
              )}

              {uploadWarning && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 text-xs rounded flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <strong>Observación de extracción:</strong> {uploadWarning}
                  </div>
                </div>
              )}

              {metadata.documentoNombre && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>
                      Documento activo: <strong>{metadata.documentoNombre}</strong> ({Math.round((metadata.documentoTamano || 0) / 1024)} KB)
                    </span>
                  </div>
                  <span className="font-semibold text-emerald-700">
                    {metadata.contenidoUnidad?.length || 0} caracteres extraídos
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Method B1: Paste Unit Content */}
          {activeTab === 'pegar_unidad' && (
            <div className="space-y-4">
              <p className="text-xs text-[#777777]">
                Pegue aquí el contenido desarrollado de la unidad temática (teoría, apartados, normatividad). Esto permitirá contrastar la validez disciplinar de las preguntas y sustentar la auditoría.
              </p>
              <textarea
                rows={10}
                value={unitTextInput}
                onChange={(e) => setUnitTextInput(e.target.value)}
                placeholder="Pegue aquí el texto de la unidad académica..."
                className="w-full text-xs font-mono p-3 border border-[#D5D5D5] rounded focus:outline-none focus:border-[#F4AE32]"
              />
              <div className="flex justify-between items-center">
                <span className="text-xs text-[#777777]">
                  {unitTextInput.length} caracteres
                </span>
                <button
                  onClick={handleApplyUnitText}
                  className="text-xs font-bold bg-[#1B1B1B] hover:bg-[#333333] text-[#F4AE32] px-4 py-2 rounded transition-colors"
                >
                  Guardar Contenido y Extraer Temario
                </button>
              </div>
            </div>
          )}

          {/* Method B2: Paste Questions */}
          {activeTab === 'pegar_preguntas' && (
            <div className="space-y-4">
              <p className="text-xs text-[#777777]">
                Pegue una o varias preguntas de selección única en cualquier formato (formato oficial URSE, incisos A/B/C/D o números). El motor reconocerá los enunciados y distractores para evaluarlos.
              </p>
              <textarea
                rows={10}
                value={rawQuestionsInput}
                onChange={(e) => setRawQuestionsInput(e.target.value)}
                placeholder={`Pregunta 1\nEnunciado: ¿Cuál es el procedimiento aplicable...?\nRespuesta incorrecta: Opción uno\nRespuesta incorrecta: Opción dos\nRespuesta incorrecta: Opción tres\nRespuesta correcta: Opción correcta`}
                className="w-full text-xs font-mono p-3 border border-[#D5D5D5] rounded focus:outline-none focus:border-[#F4AE32]"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleApplyPastedQuestions}
                  className="text-xs font-bold bg-[#F4AE32] hover:bg-[#e09e2a] text-[#1B1B1B] px-4 py-2 rounded transition-colors shadow-sm"
                >
                  Incorporar Preguntas para Revisión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Syllabus Topics Section */}
      <div className="bg-white rounded-lg p-6 border border-[#E0E0E0] shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-bold text-[#1B1B1B] flex items-center gap-2">
              <ListTree className="w-4 h-4 text-[#F4AE32]" />
              <span>Apartados y Temario Reconocido de la Unidad</span>
            </h3>
            <p className="text-xs text-[#777777] mt-0.5">
              Estos apartados con sus nomencladores estructuran la Matriz de Cobertura en la auditoría.
            </p>
          </div>

          <button
            onClick={onExtractTopicsFromUnit}
            className="text-xs bg-[#F5F5F5] hover:bg-[#EBEBEB] text-[#1B1B1B] font-semibold px-3 py-1.5 rounded border border-[#D5D5D5] flex items-center gap-1 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#F4AE32]" />
            <span>Re-analizar Temario del Texto</span>
          </button>
        </div>

        {/* Topics Table */}
        <div className="overflow-x-auto border border-[#E0E0E0] rounded">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAFAFA] border-b border-[#E0E0E0] text-[#777777] uppercase text-[10px] font-bold">
              <tr>
                <th className="py-2.5 px-3 w-28">Nomenclador</th>
                <th className="py-2.5 px-3">Título del Apartado / Subtema</th>
                <th className="py-2.5 px-3 w-20 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAEAEA]">
              {metadata.temario.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-[#777777]">
                    No se han detectado apartados temáticos. Pegue el contenido de la unidad o agregue manualmente los subtemas.
                  </td>
                </tr>
              ) : (
                metadata.temario.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="py-2 px-3 font-mono font-bold text-[#1B1B1B]">
                      {t.nomenclador}
                    </td>
                    <td className="py-2 px-3 text-[#1B1B1B]">{t.titulo}</td>
                    <td className="py-2 px-3 text-center">
                      <button
                        onClick={() => handleRemoveTopic(t.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        title="Eliminar apartado"
                      >
                        <Trash2 className="w-3.5 h-3.5 mx-auto" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Add topic manually */}
        <div className="mt-3 flex items-center gap-2">
          <input
            type="text"
            value={newTopicNomenclador}
            onChange={(e) => setNewTopicNomenclador(e.target.value)}
            placeholder="Nomenclador (ej. 1.3)"
            className="w-36 text-xs px-3 py-1.5 border border-[#D5D5D5] rounded focus:outline-none focus:border-[#F4AE32]"
          />
          <input
            type="text"
            value={newTopicTitulo}
            onChange={(e) => setNewTopicTitulo(e.target.value)}
            placeholder="Nombre literal del apartado"
            className="flex-1 text-xs px-3 py-1.5 border border-[#D5D5D5] rounded focus:outline-none focus:border-[#F4AE32]"
          />
          <button
            onClick={handleAddTopic}
            className="text-xs bg-[#1B1B1B] hover:bg-[#333333] text-white px-3 py-1.5 rounded flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-[#F4AE32]" />
            <span>Agregar Apartado</span>
          </button>
        </div>
      </div>
    </div>
  );
};
