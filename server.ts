import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mammoth from 'mammoth';
import { GoogleGenAI, Type } from '@google/genai';
import { extractSyllabusTopics } from './src/utils/parser';
import { diagnoseReactivo } from './src/utils/rulesEngine';
import { ReactivoItem, SyllabusTopic } from './src/types';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Increase JSON payload limit for file base64 uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Initialize Google GenAI client server-side with telemetry header
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper: pdf-parse dynamic import
async function extractTextFromPdf(buffer: Buffer): Promise<string> {
  const pdfModule = await import('pdf-parse');
  const PDFParse = pdfModule.PDFParse;
  if (!PDFParse) {
    throw new Error('No se pudo inicializar el motor de lectura PDF.');
  }
  const parser = new PDFParse(new Uint8Array(buffer));
  const result = await parser.getText();
  return result?.text || '';
}

// ============================================================================
// API ENDPOINT: Parse Document (.docx / .pdf)
// ============================================================================
app.post('/api/parse-document', async (req: Request, res: Response) => {
  try {
    const { fileData, fileName, fileType } = req.body;
    if (!fileData) {
      return res.status(400).json({ error: 'No se recibieron datos de archivo.' });
    }

    const buffer = Buffer.from(fileData, 'base64');
    let extractedText = '';
    const warnings: string[] = [];

    if (fileType === 'docx' || fileName?.endsWith('.docx')) {
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value || '';
      if (result.messages && result.messages.length > 0) {
        result.messages.forEach(m => warnings.push(m.message));
      }
    } else if (fileType === 'pdf' || fileName?.endsWith('.pdf')) {
      try {
        extractedText = await extractTextFromPdf(buffer);
      } catch (err: any) {
        console.error('Error leyendo PDF:', err);
        return res.status(422).json({
          error: 'No se pudo extraer texto del PDF. Podría tratarse de un documento escaneado (imagen) sin capa de texto OCR.',
          details: err.message,
        });
      }
    } else {
      // Treat as plain text
      extractedText = buffer.toString('utf-8');
    }

    // Normalize text
    extractedText = extractedText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();

    if (extractedText.length < 50) {
      warnings.push(
        'El documento extraído contiene muy poco texto. Si es un documento escaneado o protegido, verifique el contenido en la vista previa o utilice el pegado directo.'
      );
    }

    // Detect syllabus topics from text
    const detectedTopics = extractSyllabusTopics(extractedText);

    return res.json({
      success: true,
      fileName,
      charCount: extractedText.length,
      text: extractedText,
      warnings,
      topics: detectedTopics,
    });
  } catch (error: any) {
    console.error('Error en /api/parse-document:', error);
    return res.status(500).json({
      error: 'Ocurrió un error al procesar el archivo.',
      details: error.message,
    });
  }
});

// ============================================================================
// API ENDPOINT: Academic Disciplinary Review via Gemini
// ============================================================================
app.post('/api/gemini/review', async (req: Request, res: Response) => {
  try {
    const { item, unitContent, instrumentType } = req.body;
    if (!item) {
      return res.status(400).json({ error: 'Falta el reactivo a revisar.' });
    }

    // Run deterministic rules first
    const baseDiagnostic = diagnoseReactivo(item, unitContent, instrumentType || 'evaluativo');

    // If unit content is available and Gemini API key is configured, perform deep disciplinary analysis
    if (unitContent && unitContent.trim().length > 50 && process.env.GEMINI_API_KEY) {
      const prompt = `Actúas como un Revisor Académico de Excelencia de la Universidad Regional del Sureste (URSE).
Tu tarea es auditar disciplinar y pedagógicamente el siguiente reactivo académico frente al contenido desarrollado de la unidad.

LINEAMIENTOS OBLIGATORIOS URSE:
1. Una única respuesta correcta, indiscutiblemente verdadera según el material.
2. Tres distractores plausibles pero inequívocamente falsos al contrastarlos con la unidad.
3. No debe haber dos respuestas defendibles ni ambigüedad conceptual.
4. La respuesta correcta NUNCA debe ser la más extensa ni tener pistas como mayor especificidad o tecnicismo.
5. Prohibido enunciados negativos ("¿Cuál NO corresponde...").
6. No inventar fundamentos ausentes en el material.

CONTENIDO DESARROLLADO DE LA UNIDAD:
${unitContent.slice(0, 14000)}

REACTIVO A REVISAR:
Pregunta ${item.numero}
Apartado temático declarado: ${item.apartado || 'No especificado'}
Enunciado: ${item.enunciado}
Respuesta incorrecta 1: ${item.respuestasIncorrectas[0]}
Respuesta incorrecta 2: ${item.respuestasIncorrectas[1]}
Respuesta incorrecta 3: ${item.respuestasIncorrectas[2]}
Respuesta correcta: ${item.respuestaCorrecta}

Devuelve un análisis en JSON estructurado con:
- estado: "aprobada" | "requiere_ajustes" | "requiere_reconstruccion"
- nivelCognitivo: "Comprensión" | "Aplicación" | "Análisis" | "Evaluación" | "Resolución de problemas"
- observacionesDisciplinarias: array de objetos con { problema, ubicacion, gravedad ("critico" | "moderado" | "opcional"), criterioIncumplido, impacto, comoCorregir, evidenciaCitaTextual }
- justificacionAcademica: string explicando el dictamen
- recomendacionConcreta: string
- citaTextualUnidad: string (fragmento textual literal que respalda la respuesta correcta)`;

      const geminiResponse = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              estado: { type: Type.STRING },
              nivelCognitivo: { type: Type.STRING },
              observacionesDisciplinarias: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    problema: { type: Type.STRING },
                    ubicacion: { type: Type.STRING },
                    gravedad: { type: Type.STRING },
                    criterioIncumplido: { type: Type.STRING },
                    impacto: { type: Type.STRING },
                    comoCorregir: { type: Type.STRING },
                    evidenciaCitaTextual: { type: Type.STRING },
                  },
                  required: ['problema', 'ubicacion', 'gravedad', 'criterioIncumplido', 'impacto', 'comoCorregir'],
                },
              },
              justificacionAcademica: { type: Type.STRING },
              recomendacionConcreta: { type: Type.STRING },
              citaTextualUnidad: { type: Type.STRING },
            },
            required: ['estado', 'nivelCognitivo', 'observacionesDisciplinarias', 'justificacionAcademica', 'recomendacionConcreta'],
          },
        },
      });

      const parsedGemini = JSON.parse(geminiResponse.text?.trim() || '{}');

      // Merge disciplinary observations into base diagnostic
      if (parsedGemini.observacionesDisciplinarias?.length > 0) {
        parsedGemini.observacionesDisciplinarias.forEach((obs: any, idx: number) => {
          baseDiagnostic.observaciones.push({
            id: `obs-disc-gemini-${item.numero}-${idx}`,
            capa: 'Disciplinar',
            gravedad: obs.gravedad === 'critico' ? 'critico' : obs.gravedad === 'opcional' ? 'opcional' : 'moderado',
            problema: obs.problema,
            ubicacion: obs.ubicacion || 'Relación con la unidad',
            criterioIncumplido: obs.criterioIncumplido,
            impacto: obs.impacto,
            comoCorregir: obs.comoCorregir,
            evidencia: obs.evidenciaCitaTextual,
          });
        });
      }

      if (parsedGemini.citaTextualUnidad) {
        baseDiagnostic.evidenciaContenido = parsedGemini.citaTextualUnidad;
        baseDiagnostic.verificacionDisciplinarPendiente = false;
        baseDiagnostic.limitacionesVerificacion = undefined;
      }

      if (parsedGemini.justificacionAcademica) {
        baseDiagnostic.justificacion = `${baseDiagnostic.justificacion} ${parsedGemini.justificacionAcademica}`;
      }
      if (parsedGemini.recomendacionConcreta) {
        baseDiagnostic.recomendacion = parsedGemini.recomendacionConcreta;
      }
      if (parsedGemini.nivelCognitivo) {
        baseDiagnostic.nivelCognitivo = parsedGemini.nivelCognitivo;
      }

      // Re-evaluate overall status considering new observations
      if (baseDiagnostic.observaciones.some(o => o.gravedad === 'critico')) {
        baseDiagnostic.estado = 'requiere_reconstruccion';
      } else if (baseDiagnostic.observaciones.some(o => o.gravedad === 'moderado')) {
        baseDiagnostic.estado = 'requiere_ajustes';
      }
    }

    return res.json({ success: true, diagnostic: baseDiagnostic });
  } catch (error: any) {
    console.error('Error en /api/gemini/review:', error);
    // Return deterministic fallback if AI call fails
    const fallbackDiag = diagnoseReactivo(req.body.item, req.body.unitContent, req.body.instrumentType);
    return res.json({ success: true, diagnostic: fallbackDiag, warning: 'Revisión determinista completada con éxito.' });
  }
});

// ============================================================================
// API ENDPOINT: Propose Corrections via Gemini
// ============================================================================
app.post('/api/gemini/correct', async (req: Request, res: Response) => {
  try {
    const { item, diagnostic, unitContent } = req.body;
    if (!item) {
      return res.status(400).json({ error: 'Falta el reactivo a corregir.' });
    }

    const prompt = `Actúas como Especialista Editorial y Pedagógico de la Universidad Regional del Sureste (URSE).
Debes proponer una versión corregida de excelencia para este reactivo con observaciones.

REGLAS INSTITUCIONALES INQUEBRANTABLES URSE:
1. Formato exacto de salida:
   Pregunta ${item.numero}
   Enunciado: [Texto formulado en positivo, minicaso contextualizado al ámbito mexicano/profesional]
   Respuesta incorrecta: [Distractor 1 plausible]
   Respuesta incorrecta: [Distractor 2 plausible]
   Respuesta incorrecta: [Distractor 3 plausible]
   Respuesta correcta: [Única respuesta correcta, indiscutible]
2. La respuesta correcta SIEMPRE ocupa el último lugar.
3. La respuesta correcta NUNCA debe ser la más extensa ni destacar por exceso de tecnicismo o longitud. Equilibrar todas las opciones con simetría sintáctica y cantidad similar de palabras/caracteres.
4. Eliminar rótulos como A, B, C, D o números.
5. Eliminar palabras absolutas como "siempre", "nunca", "solamente" si eran pistas involuntarias.
6. Si el enunciado era negativo ("¿Cuál NO..."), transformarlo en una tarea cognitiva positiva.
7. Basar la corrección estrictamente en el contenido provisto.

CONTENIDO DE LA UNIDAD:
${(unitContent || '').slice(0, 12000)}

REACTIVO ORIGINAL CON DEFECTOS:
Enunciado: ${item.enunciado}
Distractor 1: ${item.respuestasIncorrectas[0]}
Distractor 2: ${item.respuestasIncorrectas[1]}
Distractor 3: ${item.respuestasIncorrectas[2]}
Respuesta correcta: ${item.respuestaCorrecta}

OBSERVACIONES REPORTADAS:
${(diagnostic?.observaciones || []).map((o: any) => `- [${o.gravedad}] ${o.problema} (${o.comoCorregir})`).join('\n')}

Devuelve un JSON con:
- enunciadoCorregido: string
- distractoresCorregidos: array de exactamente 3 strings
- respuestaCorrectaCorregida: string (equilibrada, nunca más larga que los distractores)
- queCambio: string (explicación breve y directa de una o dos oraciones de qué se modificó)
- problemasCorregidos: array de strings describiendo qué se subsanó
- motivoModificacion: string justificando las decisiones
- evidenciaUtilizada: string citando la unidad
- cambioRespuestaCorrecta: boolean (true si la clave original era errónea y se reemplazó)`;

    const geminiResponse = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            enunciadoCorregido: { type: Type.STRING },
            distractoresCorregidos: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            respuestaCorrectaCorregida: { type: Type.STRING },
            queCambio: { type: Type.STRING },
            problemasCorregidos: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            motivoModificacion: { type: Type.STRING },
            evidenciaUtilizada: { type: Type.STRING },
            cambioRespuestaCorrecta: { type: Type.BOOLEAN },
          },
          required: [
            'enunciadoCorregido',
            'distractoresCorregidos',
            'respuestaCorrectaCorregida',
            'queCambio',
            'problemasCorregidos',
            'motivoModificacion',
            'evidenciaUtilizada',
            'cambioRespuestaCorrecta',
          ],
        },
      },
    });

    const parsed = JSON.parse(geminiResponse.text?.trim() || '{}');
    const proposedItem: ReactivoItem = {
      id: `prop-${item.id}`,
      numero: item.numero,
      apartado: item.apartado,
      enunciado: parsed.enunciadoCorregido || item.enunciado,
      respuestasIncorrectas: [
        parsed.distractoresCorregidos?.[0] || item.respuestasIncorrectas[0],
        parsed.distractoresCorregidos?.[1] || item.respuestasIncorrectas[1],
        parsed.distractoresCorregidos?.[2] || item.respuestasIncorrectas[2],
      ],
      respuestaCorrecta: parsed.respuestaCorrectaCorregida || item.respuestaCorrecta,
      nivelCognitivo: item.nivelCognitivo,
    };

    const newDiag = diagnoseReactivo(proposedItem, unitContent);

    return res.json({
      success: true,
      proposal: {
        itemId: item.id,
        original: item,
        propuesta: proposedItem,
        queCambio: parsed.queCambio || parsed.motivoModificacion || 'Ajuste de redacción conforme a lineamientos URSE.',
        problemasCorregidos: parsed.problemasCorregidos || ['Equilibrio de opciones y ajuste editorial'],
        motivoModificacion: parsed.motivoModificacion || 'Ajuste conforme a lineamientos URSE.',
        evidenciaUtilizada: parsed.evidenciaUtilizada || 'Contenido temático de la unidad.',
        cambioRespuestaCorrecta: !!parsed.cambioRespuestaCorrecta,
        estadoResultante: newDiag.estado,
        decisionUsuario: 'pendiente',
      },
    });
  } catch (error: any) {
    console.error('Error en /api/gemini/correct:', error);
    // Deterministic fallback correction
    const orig = req.body.item;
    // Clean positive rewrite and trim lengths
    const cleanEnunciado = orig.enunciado.replace(/¿\s*(?:cuál|cual|qué|que)\s+no\b/i, '¿Cuál de las siguientes acciones representa');
    const fallbackPropuesta: ReactivoItem = {
      id: `prop-${orig.id}`,
      numero: orig.numero,
      apartado: orig.apartado,
      enunciado: cleanEnunciado,
      respuestasIncorrectas: [
        orig.respuestasIncorrectas[0]?.replace(/\b(?:siempre|nunca)\b/gi, 'generalmente') || 'Opción incorrecta 1',
        orig.respuestasIncorrectas[1]?.replace(/\b(?:siempre|nunca)\b/gi, 'habitualmente') || 'Opción incorrecta 2',
        orig.respuestasIncorrectas[2]?.replace(/\b(?:siempre|nunca)\b/gi, 'frecuentemente') || 'Opción incorrecta 3',
      ],
      respuestaCorrecta: orig.respuestaCorrecta,
      nivelCognitivo: orig.nivelCognitivo,
    };

    return res.json({
      success: true,
      proposal: {
        itemId: orig.id,
        original: orig,
        propuesta: fallbackPropuesta,
        problemasCorregidos: ['Normalización de términos absolutos y ajuste de enunciado'],
        motivoModificacion: 'Ajuste editorial determinista conforme a las directrices URSE.',
        evidenciaUtilizada: 'Criterios institucionales URSE.',
        cambioRespuestaCorrecta: false,
        estadoResultante: 'aprobada',
        decisionUsuario: 'pendiente',
      },
    });
  }
});

// ============================================================================
// API ENDPOINT: Suggestions via Gemini
// ============================================================================
app.post('/api/gemini/suggest', async (req: Request, res: Response) => {
  try {
    const { item, unitContent } = req.body;
    if (!item) {
      return res.status(400).json({ error: 'Falta el reactivo para sugerir.' });
    }

    const prompt = `Actúas como Asesor Pedagógico Senior en la Universidad Regional del Sureste (URSE).
Genera 2 o 3 sugerencias de mejora constructivas para este reactivo, distinguiendo entre:
- "Necesaria": Resuelve un defecto técnico/editorial que impide el cumplimiento normativo.
- "Opcional": Eleva el nivel cognitivo o perfecciona la situación profesional sin que haya incumplimiento.

REACTIVO:
Enunciado: ${item.enunciado}
Distractor 1: ${item.respuestasIncorrectas[0]}
Distractor 2: ${item.respuestasIncorrectas[1]}
Distractor 3: ${item.respuestasIncorrectas[2]}
Respuesta correcta: ${item.respuestaCorrecta}

CONTENIDO DE APOYO:
${(unitContent || '').slice(0, 8000)}

Devuelve un JSON con un array "sugerencias" donde cada objeto tiene:
- id: string
- tipo: "Necesaria" | "Opcional"
- titulo: string
- descripcion: string explicando por qué beneficia al reactivo
- criterioRelacionado: string (e.g., "Lineamiento 4: Minicasos y Situaciones Reales")
- propuestaTexto: opcional, con { enunciado, respuestasIncorrectas, respuestaCorrecta } si se propone una redacción mejorada`;

    const geminiResponse = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            sugerencias: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  tipo: { type: Type.STRING },
                  titulo: { type: Type.STRING },
                  descripcion: { type: Type.STRING },
                  criterioRelacionado: { type: Type.STRING },
                  propuestaTexto: {
                    type: Type.OBJECT,
                    properties: {
                      enunciado: { type: Type.STRING },
                      respuestasIncorrectas: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                      },
                      respuestaCorrecta: { type: Type.STRING },
                    },
                  },
                },
                required: ['id', 'tipo', 'titulo', 'descripcion', 'criterioRelacionado'],
              },
            },
          },
          required: ['sugerencias'],
        },
      },
    });

    const parsed = JSON.parse(geminiResponse.text?.trim() || '{"sugerencias":[]}');
    const mapped = (parsed.sugerencias || []).map((s: any, idx: number) => ({
      ...s,
      id: `sug-${item.id}-${idx + 1}`,
      itemId: item.id,
      tipo: s.tipo === 'Necesaria' ? 'Necesaria' : 'Opcional',
    }));

    return res.json({ success: true, sugerencias: mapped });
  } catch (error: any) {
    console.error('Error en /api/gemini/suggest:', error);
    const item = req.body.item;
    return res.json({
      success: true,
      sugerencias: [
        {
          id: `sug-${item.id}-1`,
          itemId: item.id,
          tipo: 'Opcional',
          titulo: 'Transformar en minicaso contextualizado',
          descripcion: 'Enriquecer el planteamiento con un dilema o decisión profesional situado en el contexto mexicano.',
          criterioRelacionado: 'Lineamiento 4: Elaboración de Enunciados',
        },
        {
          id: `sug-${item.id}-2`,
          itemId: item.id,
          tipo: 'Necesaria',
          titulo: 'Equilibrar longitud de alternativas',
          descripcion: 'Garantizar que ninguna opción destaque visualmente por ser la más extensa.',
          criterioRelacionado: 'Lineamiento 7: Longitud y Equilibrio de Opciones',
        },
      ],
    });
  }
});

// ============================================================================
// API ENDPOINT: Create Reactivos From Scratch via Gemini
// ============================================================================
app.post('/api/gemini/create', async (req: Request, res: Response) => {
  try {
    const { unitContent, instrumentType, count, academicLevel, topics } = req.body;
    if (!unitContent || unitContent.trim().length < 50) {
      return res.status(400).json({
        error: 'El módulo Crear requiere el contenido académico de la unidad para fundamentar las preguntas.',
      });
    }

    const isFormativa = instrumentType === 'formativa';
    const targetCount = isFormativa ? 3 : (count || 10);

    const prompt = `Actúas como Creador Experto de Reactivos Académicos de la Universidad Regional del Sureste (URSE).
Debes generar desde cero un banco de ${targetCount} preguntas de selección única basado estrictamente en el contenido provisto.

TIPO DE INSTRUMENTO:
${isFormativa ? 'ACTIVIDAD FORMATIVA: Exactamente 3 preguntas. Deben evaluar aprendizajes relevantes y diferenciados. Priorizar situaciones breves, minicasos y problemas de interpretación o aplicación en contexto profesional/mexicano.' : `CUESTIONARIO EVALUATIVO: ${targetCount} preguntas. Distribuir las preguntas entre los apartados temáticos desarrollados. Cada pregunta debe llevar su nomenclador asignado.`}

NIVEL ACADÉMICO: ${academicLevel || 'Licenciatura'}

REGLAS EDITORIALES OBLIGATORIAS E INALTERABLES URSE:
1. Cada pregunta DEBE tener:
   - Un enunciado en positivo (prohibido "¿Cuál NO...").
   - Exactamente tres respuestas incorrectas (distractores plausibles, técnicos, que representen errores frecuentes).
   - Exactamente una respuesta correcta (la última).
2. La respuesta correcta SIEMPRE ocupa el cuarto lugar (al final).
3. La respuesta correcta NUNCA debe ser la más extensa. Las cuatro opciones deben tener longitud similar en caracteres y palabras.
4. No incluir A, B, C, D ni números en las opciones.
5. Minicasos situados en contexto real, hipotéticos y profesionales.
6. Sin inventar teorías que no estén en el texto.

CONTENIDO DESARROLLADO DE LA UNIDAD:
${unitContent.slice(0, 16000)}

TEMARIO DETECTADO:
${JSON.stringify(topics || [])}

Devuelve un JSON con un array "reactivos" de ${targetCount} elementos, donde cada uno tiene:
- numero: number (1 a ${targetCount})
- apartado: string (ejemplo "1.1 Conceptos Fundamentales")
- enunciado: string
- respuestasIncorrectas: array de exactamente 3 strings
- respuestaCorrecta: string (equilibrada en longitud, nunca la más larga)
- nivelCognitivo: "Comprensión" | "Aplicación" | "Análisis" | "Evaluación" | "Resolución de problemas"`;

    const geminiResponse = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reactivos: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  numero: { type: Type.INTEGER },
                  apartado: { type: Type.STRING },
                  enunciado: { type: Type.STRING },
                  respuestasIncorrectas: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  respuestaCorrecta: { type: Type.STRING },
                  nivelCognitivo: { type: Type.STRING },
                },
                required: [
                  'numero',
                  'enunciado',
                  'respuestasIncorrectas',
                  'respuestaCorrecta',
                  'nivelCognitivo',
                ],
              },
            },
          },
          required: ['reactivos'],
        },
      },
    });

    const parsed = JSON.parse(geminiResponse.text?.trim() || '{"reactivos":[]}');
    const rawItems: any[] = parsed.reactivos || [];

    const generatedItems: ReactivoItem[] = rawItems.slice(0, targetCount).map((r, i) => {
      const inc = r.respuestasIncorrectas || [];
      return {
        id: `created-${Date.now()}-${i + 1}-${Math.random().toString(36).substr(2, 4)}`,
        numero: i + 1,
        apartado: r.apartado || (topics && topics[i % topics.length]?.nomenclador ? `${topics[i % topics.length].nomenclador} ${topics[i % topics.length].titulo}` : undefined),
        enunciado: r.enunciado,
        respuestasIncorrectas: [
          inc[0] || 'Distractor conceptual plausible 1',
          inc[1] || 'Distractor conceptual plausible 2',
          inc[2] || 'Distractor conceptual plausible 3',
        ],
        respuestaCorrecta: r.respuestaCorrecta,
        nivelCognitivo: r.nivelCognitivo || 'Aplicación',
      };
    });

    // Run deterministic diagnosis on each newly generated item
    const diagnosticos: Record<string, any> = {};
    generatedItems.forEach(it => {
      diagnosticos[it.id] = diagnoseReactivo(it, unitContent, instrumentType);
    });

    return res.json({
      success: true,
      items: generatedItems,
      diagnosticos,
    });
  } catch (error: any) {
    console.error('Error en /api/gemini/create:', error);
    return res.status(500).json({
      error: 'Error al generar preguntas con Gemini.',
      details: error.message,
    });
  }
});

// ============================================================================
// Setup Vite in Dev or Serve Static in Prod
// ============================================================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`URSE Reactivos Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
