import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  FileText,
  Sparkles,
  Download,
  Plus,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  FileCode,
  FileDown,
  BookOpen,
  Info,
} from 'lucide-react';
import {
  InstrumentType,
  ReactivoDiagnostic,
  ReactivoItem,
  CorrectionProposal,
} from './types';
import { diagnoseReactivo, getBriefReviewSummary } from './utils/rulesEngine';
import { parseReactivosFromText, extractSyllabusTopics } from './utils/parser';
import { generateUrseQuestionsDocx, generateUrseAuditReportDocx } from './utils/docxExporter';
import { exportToContenidoUnidadPy } from './utils/pythonExporter';
import { auditInstrument } from './utils/rulesEngine';
import { CompactQuestionCard } from './components/CompactQuestionCard';
import { LineamientosModal } from './components/LineamientosModal';
import { getInitialSampleProject } from './utils/sampleData';

const STORAGE_KEY = 'urse_single_unit_active_v1';

export const App: React.FC = () => {
  // 1. Single active unit state
  const [nombreUnidad, setNombreUnidad] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).nombreUnidad || '';
    } catch {}
    return 'Unidad 1: El Control de Convencionalidad en el Orden Jurídico Mexicano';
  });

  const [tipoInstrumento, setTipoInstrumento] = useState<InstrumentType>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).tipoInstrumento || 'formativa';
    } catch {}
    return 'formativa';
  });

  const [contenidoUnidad, setContenidoUnidad] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).contenidoUnidad || '';
    } catch {}
    return getInitialSampleProject().metadata.contenidoUnidad;
  });

  const [documentoNombre, setDocumentoNombre] = useState<string | undefined>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).documentoNombre;
    } catch {}
    return 'Unidad_1_Control_Convencionalidad_URSE.docx';
  });

  const [rawQuestionsInput, setRawQuestionsInput] = useState<string>('');

  const [reactivosOriginales, setReactivosOriginales] = useState<ReactivoItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).reactivosOriginales || [];
    } catch {}
    return getInitialSampleProject().reactivosOriginales;
  });

  const [reactivosTrabajo, setReactivosTrabajo] = useState<ReactivoItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).reactivosTrabajo || [];
    } catch {}
    return getInitialSampleProject().reactivosTrabajo;
  });

  const [diagnosticos, setDiagnosticos] = useState<Record<string, ReactivoDiagnostic>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).diagnosticos || {};
    } catch {}
    return getInitialSampleProject().diagnosticos;
  });

  const [propuestas, setPropuestas] = useState<Record<string, CorrectionProposal>>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved).propuestas || {};
    } catch {}
    return getInitialSampleProject().propuestas;
  });

  // UI state
  const [activeAction, setActiveAction] = useState<'revisar' | 'corregir' | 'crear'>('revisar');
  const [filterView, setFilterView] = useState<'todas' | 'correctas' | 'ajustes'>('todas');
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isLineamientosOpen, setIsLineamientosOpen] = useState(false);
  const [isNewUnitModalOpen, setIsNewUnitModalOpen] = useState(false);
  const [isDownloadOptionsOpen, setIsDownloadOptionsOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // File upload ref
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Save state to localStorage
  useEffect(() => {
    try {
      const payload = {
        nombreUnidad,
        tipoInstrumento,
        contenidoUnidad,
        documentoNombre,
        reactivosOriginales,
        reactivosTrabajo,
        diagnosticos,
        propuestas,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (e) {
      console.error('Error guardando unidad activa:', e);
    }
  }, [
    nombreUnidad,
    tipoInstrumento,
    contenidoUnidad,
    documentoNombre,
    reactivosOriginales,
    reactivosTrabajo,
    diagnosticos,
    propuestas,
  ]);

  // Compute brief summary
  const summaryInfo = getBriefReviewSummary(
    reactivosTrabajo,
    diagnosticos,
    !!contenidoUnidad && contenidoUnidad.trim().length >= 50
  );

  // Handle Document Upload (.docx / .pdf)
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoadingAction('subiendo');
    setActionMessage(null);

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
              fileType: file.name.endsWith('.docx') ? 'docx' : 'pdf',
            }),
          });

          const data = await response.json();
          if (!response.ok) {
            throw new Error(data.error || 'Error al leer el archivo.');
          }

          setContenidoUnidad(data.text);
          setDocumentoNombre(file.name);

          // Check if file also contained questions
          const { items } = parseReactivosFromText(data.text);
          if (items.length > 0) {
            applyQuestionsToWorkspace(items, data.text);
            setActionMessage(`Se cargó el documento «${file.name}» y se identificaron ${items.length} preguntas.`);
          } else {
            setActionMessage(`Contenido de la unidad «${file.name}» cargado (${data.charCount} caracteres).`);
          }
        } catch (err: any) {
          alert(`Error al procesar el archivo: ${err.message}`);
        } finally {
          setLoadingAction(null);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      alert(`Error al leer archivo local: ${err.message}`);
      setLoadingAction(null);
    }
  };

  // Helper to re-evaluate items and update state
  const applyQuestionsToWorkspace = (items: ReactivoItem[], unitText: string) => {
    const newDiags: Record<string, ReactivoDiagnostic> = {};
    items.forEach((it) => {
      newDiags[it.id] = diagnoseReactivo(it, unitText, tipoInstrumento);
    });
    setReactivosOriginales(items);
    setReactivosTrabajo(items);
    setDiagnosticos(newDiags);
  };

  // Handle parsing pasted questions
  const handleLoadPastedQuestions = () => {
    if (!rawQuestionsInput.trim()) return;
    const { items } = parseReactivosFromText(rawQuestionsInput);
    if (items.length === 0) {
      alert('No se reconocieron preguntas en el texto pegado. Verifique el formato.');
      return;
    }
    applyQuestionsToWorkspace(items, contenidoUnidad);
    setRawQuestionsInput('');
    setActionMessage(`Se incorporaron ${items.length} preguntas.`);
  };

  // ==========================================
  // 3 MAIN ACTIONS
  // ==========================================

  // 1. REVISAR: Identifies errors and explains what should be improved
  const handleActionRevisar = async () => {
    setActiveAction('revisar');
    setLoadingAction('revisando');
    setActionMessage(null);

    // If user has questions in the textarea that haven't been submitted, parse them
    let currentItems = reactivosTrabajo;
    if (rawQuestionsInput.trim()) {
      const { items } = parseReactivosFromText(rawQuestionsInput);
      if (items.length > 0) {
        currentItems = items;
        setReactivosOriginales(items);
        setReactivosTrabajo(items);
        setRawQuestionsInput('');
      }
    }

    if (currentItems.length === 0) {
      setLoadingAction(null);
      alert('Pegue preguntas en el Apartado 2 o use «Crear» para generarlas desde cero.');
      return;
    }

    try {
      // Deterministic review first
      const updatedDiags: Record<string, ReactivoDiagnostic> = {};
      currentItems.forEach((it) => {
        updatedDiags[it.id] = diagnoseReactivo(it, contenidoUnidad, tipoInstrumento);
      });
      setDiagnosticos(updatedDiags);

      // Deep academic analysis for items requiring review
      for (const item of currentItems) {
        if (contenidoUnidad && contenidoUnidad.length > 50) {
          try {
            const resp = await fetch('/api/gemini/review', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                item,
                unitContent: contenidoUnidad,
                instrumentType: tipoInstrumento,
              }),
            });
            const data = await resp.json();
            if (data.diagnostic) {
              updatedDiags[item.id] = data.diagnostic;
            }
          } catch {}
        }
      }
      setDiagnosticos({ ...updatedDiags });
      setActionMessage('Revisión completada.');
    } finally {
      setLoadingAction(null);
    }
  };

  // 2. CORREGIR: Reviews and proposes corrected questions side-by-side
  const handleActionCorregir = async () => {
    setActiveAction('corregir');
    setLoadingAction('corrigiendo');
    setActionMessage(null);

    let currentItems = reactivosTrabajo;
    if (rawQuestionsInput.trim()) {
      const { items } = parseReactivosFromText(rawQuestionsInput);
      if (items.length > 0) {
        currentItems = items;
        setReactivosOriginales(items);
        setReactivosTrabajo(items);
        setRawQuestionsInput('');
      }
    }

    if (currentItems.length === 0) {
      setLoadingAction(null);
      alert('No hay preguntas para corregir. Ingrese preguntas en el Apartado 2.');
      return;
    }

    try {
      // Make sure diagnostics exist
      const updatedDiags: Record<string, ReactivoDiagnostic> = {};
      currentItems.forEach((it) => {
        updatedDiags[it.id] = diagnosticos[it.id] || diagnoseReactivo(it, contenidoUnidad, tipoInstrumento);
      });
      setDiagnosticos(updatedDiags);

      // Generate proposals for items that need adjustments
      const newProps = { ...propuestas };
      const itemsToFix = currentItems.filter((it) => updatedDiags[it.id]?.estado !== 'aprobada');

      for (const item of itemsToFix) {
        if (!newProps[item.id] || newProps[item.id].decisionUsuario === 'pendiente') {
          try {
            const resp = await fetch('/api/gemini/correct', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                item,
                diagnostic: updatedDiags[item.id],
                unitContent: contenidoUnidad,
              }),
            });
            const data = await resp.json();
            if (data.proposal) {
              newProps[item.id] = data.proposal;
            }
          } catch (e) {
            console.error('Error generando propuesta:', e);
          }
        }
      }
      setPropuestas(newProps);
      setActionMessage(`Propuestas de corrección generadas para ${itemsToFix.length} pregunta(s).`);
    } finally {
      setLoadingAction(null);
    }
  };

  // 3. CREAR: Generates questions from scratch following URSE guidelines
  const handleActionCrear = async () => {
    setActiveAction('crear');
    if (!contenidoUnidad || contenidoUnidad.trim().length < 50) {
      alert('Para crear preguntas desde cero debe ingresar primero el contenido de la unidad en el Apartado 1.');
      return;
    }

    setLoadingAction('creando');
    setActionMessage(null);

    const targetCount = tipoInstrumento === 'formativa' ? 3 : 10;
    const detectedTopics = extractSyllabusTopics(contenidoUnidad);

    try {
      const resp = await fetch('/api/gemini/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          unitContent: contenidoUnidad,
          instrumentType: tipoInstrumento,
          count: targetCount,
          academicLevel: 'Licenciatura',
          topics: detectedTopics,
        }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        throw new Error(data.error || 'Error al generar preguntas con Gemini.');
      }

      const generatedItems: ReactivoItem[] = data.items || [];
      const newDiags: Record<string, ReactivoDiagnostic> = {};
      generatedItems.forEach((it) => {
        newDiags[it.id] = diagnoseReactivo(it, contenidoUnidad, tipoInstrumento);
      });

      setReactivosOriginales(generatedItems);
      setReactivosTrabajo(generatedItems);
      setDiagnosticos(newDiags);
      setPropuestas({});
      setActiveAction('revisar');
      setActionMessage(`Se generaron ${generatedItems.length} preguntas fundamentadas en el contenido.`);
    } catch (err: any) {
      alert(`Error al crear preguntas: ${err.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  // Accept a proposal
  const handleAcceptProposal = (itemId: string) => {
    const prop = propuestas[itemId];
    if (!prop) return;

    const updatedTrabajo = reactivosTrabajo.map((it) => {
      if (it.id === itemId) {
        return { ...prop.propuesta, id: it.id, numero: it.numero };
      }
      return it;
    });

    const newDiags = {
      ...diagnosticos,
      [itemId]: diagnoseReactivo(prop.propuesta, contenidoUnidad, tipoInstrumento),
    };

    const updatedProp: CorrectionProposal = {
      ...prop,
      decisionUsuario: 'aceptada',
    };

    setReactivosTrabajo(updatedTrabajo);
    setDiagnosticos(newDiags);
    setPropuestas({ ...propuestas, [itemId]: updatedProp });
  };

  // Reject a proposal
  const handleRejectProposal = (itemId: string) => {
    const prop = propuestas[itemId];
    if (!prop) return;
    setPropuestas({
      ...propuestas,
      [itemId]: { ...prop, decisionUsuario: 'rechazada' },
    });
  };

  // Request proposal for specific item
  const handleRequestSingleProposal = async (itemId: string) => {
    const item = reactivosTrabajo.find((i) => i.id === itemId);
    const diag = diagnosticos[itemId];
    if (!item) return;

    setLoadingAction(`corrigiendo-${itemId}`);
    try {
      const resp = await fetch('/api/gemini/correct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item,
          diagnostic: diag,
          unitContent: contenidoUnidad,
        }),
      });
      const data = await resp.json();
      if (data.proposal) {
        setPropuestas((prev) => ({ ...prev, [itemId]: data.proposal }));
      }
    } finally {
      setLoadingAction(null);
    }
  };

  // ==========================================
  // EXPORT FUNCTIONS
  // ==========================================
  const handleDownloadFinalQuestionsDocx = async () => {
    if (reactivosTrabajo.length === 0) {
      alert('No hay preguntas para descargar.');
      return;
    }
    setIsDownloading(true);
    try {
      const blob = await generateUrseQuestionsDocx(reactivosTrabajo, {
        id: 'unidad-activa',
        nombre: nombreUnidad,
        asignatura: 'Universidad Regional del Sureste',
        numeroYNombreUnidad: nombreUnidad,
        nivelAcademico: 'Licenciatura',
        tipoInstrumento,
        contenidoUnidad,
        temario: extractSyllabusTopics(contenidoUnidad),
        fechaCreacion: new Date().toISOString(),
        ultimaModificacion: new Date().toISOString(),
        versionLineamientos: '2026.1 - Institucional URSE',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `URSE_Preguntas_${(nombreUnidad || 'Unidad').replace(/\s+/g, '_')}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloading(false);
      setIsDownloadOptionsOpen(false);
    }
  };

  const handleDownloadAuditReportDocx = async () => {
    const topics = extractSyllabusTopics(contenidoUnidad);
    const audit = auditInstrument(reactivosTrabajo, diagnosticos, topics, contenidoUnidad, tipoInstrumento);
    setIsDownloading(true);
    try {
      const blob = await generateUrseAuditReportDocx(audit, {
        id: 'unidad-activa',
        nombre: nombreUnidad,
        asignatura: 'Universidad Regional del Sureste',
        numeroYNombreUnidad: nombreUnidad,
        nivelAcademico: 'Licenciatura',
        tipoInstrumento,
        contenidoUnidad,
        temario: topics,
        fechaCreacion: new Date().toISOString(),
        ultimaModificacion: new Date().toISOString(),
        versionLineamientos: '2026.1 - Institucional URSE',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `URSE_Informe_Observaciones_${(nombreUnidad || 'Unidad').replace(/\s+/g, '_')}.docx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } finally {
      setIsDownloading(false);
      setIsDownloadOptionsOpen(false);
    }
  };

  const handleDownloadPythonExport = () => {
    const code = exportToContenidoUnidadPy(reactivosTrabajo, tipoInstrumento, nombreUnidad);
    const blob = new Blob([code], { type: 'text/x-python' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contenido_unidad_${tipoInstrumento}.py`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsDownloadOptionsOpen(false);
  };

  // Reset to brand new blank unit
  const handleConfirmNewUnit = (downloadFirst: boolean) => {
    if (downloadFirst && reactivosTrabajo.length > 0) {
      handleDownloadFinalQuestionsDocx();
    }
    setNombreUnidad('Nueva Unidad Académica');
    setContenidoUnidad('');
    setDocumentoNombre(undefined);
    setRawQuestionsInput('');
    setReactivosOriginales([]);
    setReactivosTrabajo([]);
    setDiagnosticos({});
    setPropuestas({});
    setActionMessage(null);
    setIsNewUnitModalOpen(false);
  };

  // Filter items for display
  const displayedItems = reactivosTrabajo.filter((it) => {
    if (filterView === 'correctas') return diagnosticos[it.id]?.estado === 'aprobada';
    if (filterView === 'ajustes') return diagnosticos[it.id]?.estado !== 'aprobada';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col font-sans text-[#1B1B1B]">
      {/* 1. Header institucional limpio */}
      <header className="bg-[#1B1B1B] text-white border-b border-[#333333] sticky top-0 z-30 shadow-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="bg-[#F4AE32] text-[#1B1B1B] font-black text-sm px-2.5 py-0.5 rounded tracking-wider shadow-sm">
              URSE
            </span>
            <span className="text-sm font-semibold tracking-wide text-white hidden sm:inline">
              Control de Reactivos Académicos
            </span>
          </div>

          <div className="flex items-center space-x-3 text-xs">
            {/* Discreet link to Lineamientos URSE */}
            <button
              onClick={() => setIsLineamientosOpen(true)}
              className="text-[#C0C0C0] hover:text-[#F4AE32] transition-colors underline flex items-center gap-1"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Lineamientos URSE (Consulta)</span>
            </button>

            {/* Nueva unidad */}
            <button
              onClick={() => setIsNewUnitModalOpen(true)}
              className="bg-[#2A2A2A] hover:bg-[#333333] text-white px-3 py-1.5 rounded border border-[#444444] transition-colors flex items-center gap-1"
              title="Iniciar una nueva unidad académica"
            >
              <Plus className="w-3.5 h-3.5 text-[#F4AE32]" />
              <span>Nueva unidad</span>
            </button>

            {/* Descargar preguntas finales */}
            <div className="relative">
              <div className="flex items-center rounded overflow-hidden shadow-sm">
                <button
                  onClick={handleDownloadFinalQuestionsDocx}
                  disabled={isDownloading || reactivosTrabajo.length === 0}
                  className="bg-[#F4AE32] hover:bg-[#e09e2a] text-[#1B1B1B] font-bold px-3.5 py-1.5 transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Descargar preguntas finales</span>
                </button>
                <button
                  onClick={() => setIsDownloadOptionsOpen(!isDownloadOptionsOpen)}
                  className="bg-[#e09e2a] hover:bg-[#c68920] text-[#1B1B1B] px-1.5 py-1.5 transition-colors border-l border-black/10"
                  title="Otras opciones de descarga"
                >
                  ▾
                </button>
              </div>

              {/* Download options dropdown */}
              {isDownloadOptionsOpen && (
                <div className="absolute right-0 mt-1 w-64 bg-white rounded-md shadow-lg border border-gray-200 py-1 text-xs text-gray-700 z-40">
                  <button
                    onClick={handleDownloadFinalQuestionsDocx}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <FileDown className="w-4 h-4 text-[#F4AE32]" />
                    <span>Preguntas finales en Word (.docx)</span>
                  </button>
                  <button
                    onClick={handleDownloadAuditReportDocx}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4 text-[#F4AE32]" />
                    <span>Informe de observaciones (.docx)</span>
                  </button>
                  <button
                    onClick={handleDownloadPythonExport}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 flex items-center gap-2"
                  >
                    <FileCode className="w-4 h-4 text-[#F4AE32]" />
                    <span>Formato contenido_unidad.py</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Unit Title and Instrument Selector */}
        <div className="bg-white rounded-lg p-4 border border-[#E0E0E0] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#777777] block mb-0.5">
              Unidad académica activa:
            </label>
            <input
              type="text"
              value={nombreUnidad}
              onChange={(e) => setNombreUnidad(e.target.value)}
              placeholder="Nombre o tema de la unidad..."
              className="text-base font-bold text-[#1B1B1B] w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-[#F4AE32] focus:outline-none py-0.5"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-[#777777] font-medium">Instrumento:</span>
            <select
              value={tipoInstrumento}
              onChange={(e) => setTipoInstrumento(e.target.value as InstrumentType)}
              className="text-xs font-bold text-[#1B1B1B] bg-[#F5F5F5] border border-[#D5D5D5] rounded px-3 py-1.5 focus:outline-none focus:border-[#F4AE32]"
            >
              <option value="formativa">Actividad formativa (3 preguntas)</option>
              <option value="evaluativo">Cuestionario evaluativo (10 a 15 preguntas)</option>
            </select>
          </div>
        </div>

        {/* 2. Dos apartados de entrada claramente separados */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* APARTADO 1: Contenido de la unidad */}
          <div className="bg-white rounded-lg border border-[#E0E0E0] p-5 shadow-sm flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-bold text-[#1B1B1B] flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#1B1B1B] text-[#F4AE32] text-xs flex items-center justify-center font-bold">
                    1
                  </span>
                  <span>Contenido de la unidad</span>
                </h2>

                {documentoNombre && (
                  <span className="text-[11px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 truncate max-w-[180px]">
                    {documentoNombre}
                  </span>
                )}
              </div>

              <p className="text-xs text-[#777777] leading-relaxed">
                Proporcione el texto de referencia para verificar la correspondencia temática y validez de las preguntas.
              </p>
            </div>

            <textarea
              rows={7}
              value={contenidoUnidad}
              onChange={(e) => setContenidoUnidad(e.target.value)}
              placeholder="Pegue aquí el texto de la unidad (temas, conceptos, teorías) o use el botón inferior para cargar un archivo Word o PDF..."
              className="w-full text-xs font-mono p-3 border border-[#D5D5D5] rounded focus:outline-none focus:border-[#F4AE32] bg-[#FAF9F6] resize-y"
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-[#777777]">
                {contenidoUnidad ? `${contenidoUnidad.length} caracteres` : 'Sin contenido cargado'}
              </span>

              <label className="cursor-pointer text-xs font-medium bg-[#F5F5F5] hover:bg-[#EBEBEB] text-[#1B1B1B] px-3 py-1.5 rounded border border-[#D0D0D0] flex items-center gap-1.5 transition-colors">
                <Upload className="w-3.5 h-3.5 text-[#F4AE32]" />
                <span>Cargar Word (.docx) o PDF</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".docx,.pdf,.txt"
                  className="hidden"
                  onChange={handleFileUpload}
                  disabled={loadingAction === 'subiendo'}
                />
              </label>
            </div>
          </div>

          {/* APARTADO 2: Preguntas */}
          <div className="bg-white rounded-lg border border-[#E0E0E0] p-5 shadow-sm flex flex-col justify-between space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h2 className="text-sm font-bold text-[#1B1B1B] flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#1B1B1B] text-[#F4AE32] text-xs flex items-center justify-center font-bold">
                    2
                  </span>
                  <span>Preguntas existentes</span>
                </h2>

                <span className="text-[11px] text-[#777777]">
                  {reactivosTrabajo.length} pregunta(s) en trabajo
                </span>
              </div>

              <p className="text-xs text-[#777777] leading-relaxed">
                Pegue preguntas para revisar o corregir. Si desea crearlas desde cero, no necesita pegar nada y pulse «Crear».
              </p>
            </div>

            <textarea
              rows={7}
              value={rawQuestionsInput}
              onChange={(e) => setRawQuestionsInput(e.target.value)}
              placeholder={`Pregunta 1\nEnunciado: ¿Cuál es el procedimiento adecuado...?\nRespuesta incorrecta: [Distractor uno]\nRespuesta incorrecta: [Distractor dos]\nRespuesta incorrecta: [Distractor tres]\nRespuesta correcta: [Única respuesta correcta]`}
              className="w-full text-xs font-mono p-3 border border-[#D5D5D5] rounded focus:outline-none focus:border-[#F4AE32] bg-[#FAF9F6] resize-y"
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-[#777777]">
                Formato URSE: Enunciado, 3 incorrectas y 1 correcta al final.
              </span>

              {rawQuestionsInput.trim() && (
                <button
                  onClick={handleLoadPastedQuestions}
                  className="text-xs font-bold bg-[#1B1B1B] text-[#F4AE32] px-3 py-1.5 rounded transition-colors"
                >
                  Cargar preguntas pegadas
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 3. Barra de 3 Acciones Principales */}
        <div className="bg-white rounded-lg p-4 border border-[#E0E0E0] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-[#777777]">
            <strong className="text-[#1B1B1B]">Acciones académicas:</strong> Seleccione la tarea a ejecutar sobre la unidad.
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Acción 1: Revisar */}
            <button
              onClick={handleActionRevisar}
              disabled={!!loadingAction}
              className={`px-5 py-2.5 rounded-md font-bold text-xs transition-all shadow-sm flex items-center gap-2 ${
                activeAction === 'revisar'
                  ? 'bg-[#1B1B1B] text-[#F4AE32] ring-2 ring-[#F4AE32]'
                  : 'bg-white hover:bg-gray-50 text-[#1B1B1B] border border-[#CCCCCC]'
              } disabled:opacity-50`}
            >
              {loadingAction === 'revisando' ? (
                <RefreshCw className="w-4 h-4 animate-spin text-[#F4AE32]" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-[#F4AE32]" />
              )}
              <span>Revisar</span>
            </button>

            {/* Acción 2: Corregir */}
            <button
              onClick={handleActionCorregir}
              disabled={!!loadingAction}
              className={`px-5 py-2.5 rounded-md font-bold text-xs transition-all shadow-sm flex items-center gap-2 ${
                activeAction === 'corregir'
                  ? 'bg-[#1B1B1B] text-[#F4AE32] ring-2 ring-[#F4AE32]'
                  : 'bg-white hover:bg-gray-50 text-[#1B1B1B] border border-[#CCCCCC]'
              } disabled:opacity-50`}
            >
              {loadingAction === 'corrigiendo' ? (
                <RefreshCw className="w-4 h-4 animate-spin text-[#F4AE32]" />
              ) : (
                <Sparkles className="w-4 h-4 text-[#F4AE32]" />
              )}
              <span>Corregir</span>
            </button>

            {/* Acción 3: Crear */}
            <button
              onClick={handleActionCrear}
              disabled={!!loadingAction}
              className={`px-5 py-2.5 rounded-md font-bold text-xs transition-all shadow-sm flex items-center gap-2 ${
                activeAction === 'crear'
                  ? 'bg-[#1B1B1B] text-[#F4AE32] ring-2 ring-[#F4AE32]'
                  : 'bg-white hover:bg-gray-50 text-[#1B1B1B] border border-[#CCCCCC]'
              } disabled:opacity-50`}
            >
              {loadingAction === 'creando' ? (
                <RefreshCw className="w-4 h-4 animate-spin text-[#F4AE32]" />
              ) : (
                <Plus className="w-4 h-4 text-[#F4AE32]" />
              )}
              <span>Crear preguntas</span>
            </button>
          </div>
        </div>

        {/* 4. Resumen breve de resultados */}
        {reactivosTrabajo.length > 0 && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4 border border-[#E0E0E0] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="text-sm font-bold text-[#1B1B1B]">
                  {summaryInfo.text}
                </div>
                {summaryInfo.warning && (
                  <div className="text-xs text-amber-800 font-medium mt-1 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    <span>{summaryInfo.warning}</span>
                  </div>
                )}
                {actionMessage && (
                  <div className="text-xs text-emerald-800 font-medium mt-0.5">
                    {actionMessage}
                  </div>
                )}
              </div>

              {/* Filter tabs */}
              <div className="flex items-center gap-1 shrink-0 text-xs">
                <button
                  onClick={() => setFilterView('todas')}
                  className={`px-3 py-1 rounded font-medium ${
                    filterView === 'todas'
                      ? 'bg-[#1B1B1B] text-[#F4AE32]'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  Todas ({reactivosTrabajo.length})
                </button>
                <button
                  onClick={() => setFilterView('correctas')}
                  className={`px-3 py-1 rounded font-medium ${
                    filterView === 'correctas'
                      ? 'bg-emerald-700 text-white'
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  Correctas ({summaryInfo.aprobadas})
                </button>
                <button
                  onClick={() => setFilterView('ajustes')}
                  className={`px-3 py-1 rounded font-medium ${
                    filterView === 'ajustes'
                      ? 'bg-amber-700 text-white'
                      : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
                  }`}
                >
                  Con ajustes ({summaryInfo.necesitanAjustes})
                </button>
              </div>
            </div>

            {/* 5. Lista de Tarjetas Compactas con Detalles a Demanda */}
            <div className="space-y-3">
              {displayedItems.map((item) => (
                <CompactQuestionCard
                  key={item.id}
                  item={item}
                  diagnostic={diagnosticos[item.id]}
                  proposal={propuestas[item.id]}
                  isCorrectMode={activeAction === 'corregir'}
                  onAcceptProposal={handleAcceptProposal}
                  onRejectProposal={handleRejectProposal}
                  onRequestProposal={handleRequestSingleProposal}
                  isLoadingAi={loadingAction === `corrigiendo-${item.id}`}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Modal: Lineamientos URSE (Solo lectura) */}
      <LineamientosModal
        isOpen={isLineamientosOpen}
        onClose={() => setIsLineamientosOpen(false)}
      />

      {/* Modal: Confirmación Nueva Unidad */}
      {isNewUnitModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-5 space-y-4 border border-gray-200">
            <h3 className="text-sm font-bold text-[#1B1B1B] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>¿Iniciar una nueva unidad académica?</span>
            </h3>
            <p className="text-xs text-[#555555] leading-relaxed">
              Esta acción borrará el contenido y las preguntas actuales para comenzar desde cero. Se recomienda descargar su trabajo antes de continuar.
            </p>

            <div className="flex flex-col gap-2 pt-2 text-xs">
              <button
                onClick={() => handleConfirmNewUnit(true)}
                className="w-full py-2 bg-[#F4AE32] hover:bg-[#e09e2a] text-[#1B1B1B] font-bold rounded flex items-center justify-center gap-1.5 transition-colors shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar preguntas y continuar</span>
              </button>

              <button
                onClick={() => handleConfirmNewUnit(false)}
                className="w-full py-2 bg-white hover:bg-gray-100 text-red-700 border border-red-300 font-medium rounded transition-colors"
              >
                Continuar sin guardar
              </button>

              <button
                onClick={() => setIsNewUnitModalOpen(false)}
                className="w-full py-1.5 text-gray-500 hover:text-gray-700 text-[11px]"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
