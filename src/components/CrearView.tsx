import React, { useState } from 'react';
import {
  FilePlus,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  BookOpen,
  PlusCircle,
  Layers,
} from 'lucide-react';
import { InstrumentType, ProjectData, ReactivoItem } from '../types';

interface CrearViewProps {
  project: ProjectData;
  onCreateQuestions: (
    type: InstrumentType,
    count: number,
    level: string
  ) => Promise<ReactivoItem[]>;
  onAddGeneratedToProject: (items: ReactivoItem[], replaceExisting: boolean) => void;
  onNavigateToReview: () => void;
}

export const CrearView: React.FC<CrearViewProps> = ({
  project,
  onCreateQuestions,
  onAddGeneratedToProject,
  onNavigateToReview,
}) => {
  const meta = project.metadata;
  const hasContent = meta.contenidoUnidad && meta.contenidoUnidad.trim().length >= 50;

  const [instrumentType, setInstrumentType] = useState<InstrumentType>(
    meta.tipoInstrumento || 'formativa'
  );
  const [questionCount, setQuestionCount] = useState<number>(
    instrumentType === 'formativa' ? 3 : 10
  );
  const [academicLevel, setAcademicLevel] = useState<string>(
    meta.nivelAcademico || 'Licenciatura'
  );
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [generatedResults, setGeneratedResults] = useState<ReactivoItem[]>([]);

  const handleInstrumentChange = (type: InstrumentType) => {
    setInstrumentType(type);
    if (type === 'formativa') {
      setQuestionCount(3);
    } else {
      setQuestionCount(10);
    }
  };

  const handleGenerate = async () => {
    if (!hasContent) {
      setErrorMsg(
        'El módulo Crear requiere el contenido académico de la unidad para fundamentar las preguntas. Cargue o pegue la unidad en «Documento y Temario».'
      );
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    try {
      const items = await onCreateQuestions(
        instrumentType,
        instrumentType === 'formativa' ? 3 : questionCount,
        academicLevel
      );
      setGeneratedResults(items);
    } catch (err: any) {
      setErrorMsg(err.message || 'Error al generar preguntas con Gemini.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Title Banner */}
      <div className="bg-white p-5 rounded-lg border border-[#E0E0E0] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#F4AE32] bg-[#1B1B1B] px-2.5 py-0.5 rounded">
              Módulo 4
            </span>
            <span className="text-xs font-semibold text-[#777777]">
              Diseño y Construcción desde Cero
            </span>
          </div>
          <h1 className="text-lg font-bold text-[#1B1B1B]">
            Generación Fundamentada en la Unidad
          </h1>
          <p className="text-xs text-[#777777] mt-0.5 max-w-2xl">
            Genera reactivos de excelencia con minicasos, opciones simétricas y estricto formato URSE (3 incorrectas y 1 correcta al final).
          </p>
        </div>
      </div>

      {!hasContent ? (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 text-xs text-amber-900 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-amber-800">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <span>Contenido de la Unidad Académica Requerido</span>
          </div>
          <p className="leading-relaxed">
            De acuerdo con el principio 6 y 15 de los Lineamientos URSE: <em>«No se debe inventar fundamentos que no estén presentes en el material proporcionado»</em>. Para diseñar reactivos desde cero, primero debe suministrar la unidad en el módulo <strong>Documento y Temario</strong>.
          </p>
        </div>
      ) : (
        /* Configuration and Generator form */
        <div className="bg-white rounded-lg border border-[#E0E0E0] p-6 shadow-sm space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Instrument Selection */}
            <div>
              <label className="block text-xs font-bold text-[#1B1B1B] mb-2">
                1. Tipo de Instrumento URSE
              </label>
              <div className="space-y-2">
                <label
                  onClick={() => handleInstrumentChange('formativa')}
                  className={`block p-3 rounded-lg border cursor-pointer transition-all ${
                    instrumentType === 'formativa'
                      ? 'border-[#F4AE32] bg-[#F4AE32]/10 ring-1 ring-[#F4AE32]'
                      : 'border-[#E0E0E0] hover:bg-gray-50'
                  }`}
                >
                  <div className="font-bold text-xs text-[#1B1B1B]">
                    Actividad Formativa
                  </div>
                  <div className="text-[11px] text-[#777777] mt-0.5">
                    Exactamente 3 preguntas. Aprendizajes diferenciados y minicasos contextualizados.
                  </div>
                </label>

                <label
                  onClick={() => handleInstrumentChange('evaluativo')}
                  className={`block p-3 rounded-lg border cursor-pointer transition-all ${
                    instrumentType === 'evaluativo'
                      ? 'border-[#F4AE32] bg-[#F4AE32]/10 ring-1 ring-[#F4AE32]'
                      : 'border-[#E0E0E0] hover:bg-gray-50'
                  }`}
                >
                  <div className="font-bold text-xs text-[#1B1B1B]">
                    Cuestionario Evaluativo (Test)
                  </div>
                  <div className="text-[11px] text-[#777777] mt-0.5">
                    10 a 15 preguntas con distribución balanceada en los apartados del temario.
                  </div>
                </label>
              </div>
            </div>

            {/* Quantity and Academic level */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#1B1B1B] mb-1">
                  2. Cantidad de Reactivos
                </label>
                {instrumentType === 'formativa' ? (
                  <div className="p-2.5 bg-gray-50 rounded border border-gray-200 text-xs font-semibold text-[#1B1B1B]">
                    Fijado en 3 reactivos (Norma URSE estricta)
                  </div>
                ) : (
                  <select
                    value={questionCount}
                    onChange={(e) => setQuestionCount(parseInt(e.target.value, 10))}
                    className="w-full text-xs p-2.5 border border-[#D5D5D5] rounded bg-white focus:outline-none focus:border-[#F4AE32]"
                  >
                    <option value={10}>10 reactivos (Cuestionario estándar)</option>
                    <option value={12}>12 reactivos</option>
                    <option value={15}>15 reactivos (Máximo permitido por unidad)</option>
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1B1B1B] mb-1">
                  3. Nivel de Exigencia Cognitiva
                </label>
                <select
                  value={academicLevel}
                  onChange={(e) => setAcademicLevel(e.target.value)}
                  className="w-full text-xs p-2.5 border border-[#D5D5D5] rounded bg-white focus:outline-none focus:border-[#F4AE32]"
                >
                  <option value="Licenciatura">Licenciatura (Comprensión y Aplicación)</option>
                  <option value="Especialidad">Especialidad (Análisis procedimental)</option>
                  <option value="Maestría">Maestría (Toma de decisiones fundamentadas)</option>
                  <option value="Doctorado">Doctorado (Evaluación crítica y modelos)</option>
                </select>
              </div>
            </div>

            {/* Unit syllabus preview & trigger */}
            <div className="flex flex-col justify-between p-4 bg-[#FBFBFB] rounded-lg border border-[#EAEAEA]">
              <div>
                <div className="text-xs font-bold text-[#1B1B1B] flex items-center gap-1.5 mb-1">
                  <BookOpen className="w-3.5 h-3.5 text-[#F4AE32]" />
                  <span>Sustento Temático Vinculado</span>
                </div>
                <div className="text-[11px] text-[#777777]">
                  Unidad: <strong>{meta.numeroYNombreUnidad || 'Unidad activa'}</strong>
                </div>
                <div className="text-[11px] text-[#777777] mt-1">
                  Apartados detectados: <strong>{meta.temario.length}</strong>
                </div>
                <div className="text-[11px] text-[#777777]">
                  Extensión de contenido: <strong>{meta.contenidoUnidad.length} caracteres</strong>
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading}
                className="w-full mt-4 text-xs font-bold bg-[#F4AE32] hover:bg-[#e09e2a] text-[#1B1B1B] py-3 rounded-lg flex items-center justify-center gap-2 transition-all shadow-sm disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Diseñando y validando reactivos...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Construir {instrumentType === 'formativa' ? 3 : questionCount} Reactivos con Gemini</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded">
              {errorMsg}
            </div>
          )}
        </div>
      )}

      {/* Generated Results Preview */}
      {generatedResults.length > 0 && (
        <div className="bg-white rounded-lg border border-[#E0E0E0] p-6 shadow-sm space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-[#EAEAEA] gap-3">
            <div>
              <h3 className="text-sm font-bold text-[#1B1B1B] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Reactivos Generados Exitosamente ({generatedResults.length})</span>
              </h3>
              <p className="text-xs text-[#777777] mt-0.5">
                Revise la propuesta antes de incorporarla al banco de trabajo del proyecto.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onAddGeneratedToProject(generatedResults, false);
                  onNavigateToReview();
                }}
                className="text-xs font-semibold bg-[#F5F5F5] hover:bg-[#EAEAEA] text-[#1B1B1B] px-3.5 py-2 rounded border border-[#D5D5D5] flex items-center gap-1.5 transition-colors"
              >
                <PlusCircle className="w-3.5 h-3.5 text-[#F4AE32]" />
                <span>Agregar al proyecto actual</span>
              </button>

              <button
                onClick={() => {
                  onAddGeneratedToProject(generatedResults, true);
                  onNavigateToReview();
                }}
                className="text-xs font-bold bg-[#1B1B1B] hover:bg-[#2C2C2C] text-[#F4AE32] px-3.5 py-2 rounded flex items-center gap-1.5 transition-colors shadow-sm"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Reemplazar preguntas y abrir Revisar</span>
              </button>
            </div>
          </div>

          {/* List of generated items */}
          <div className="space-y-4">
            {generatedResults.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-[#FBFBFB] rounded-lg border border-[#E0E0E0] text-xs space-y-2.5"
              >
                <div className="flex items-center justify-between font-bold text-[#1B1B1B]">
                  <span>Pregunta {item.numero}</span>
                  {item.apartado && (
                    <span className="font-mono text-[11px] text-[#777777] font-normal">
                      Apartado: {item.apartado}
                    </span>
                  )}
                </div>

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

                <div className="bg-white p-2 rounded border border-[#D5D5D5] text-[#1B1B1B]">
                  <span className="font-bold text-[#F4AE32] bg-[#1B1B1B] px-1.5 py-0.5 rounded mr-1">
                    Respuesta correcta:
                  </span>{' '}
                  <span className="font-semibold">{item.respuestaCorrecta}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
