import {
  CognitiveLevel,
  DefectObservation,
  ItemStatus,
  ReactivoDiagnostic,
  ReactivoItem,
} from '../types';

const CLUE_WORDS = [
  'siempre',
  'nunca',
  'únicamente',
  'unicamente',
  'exclusivamente',
  'solamente',
  'sin excepción',
  'en ningún caso',
  'jamas',
  'jamás',
];

const NEGATIVE_STEM_PATTERNS = [
  /\bno\s+(?:es|corresponde|representa|aplica|constituye|pertenece|debe)\b/i,
  /¿\s*(?:cuál|cual|qué|que)\s+opción\s+no\b/i,
  /¿\s*(?:cuál|cual|qué|que)\s+no\s+/i,
  /\bse\s+excluye\b/i,
  /\bexcepto\b/i,
  /\bcuál\s+de\s+(?:las|los)\s+siguientes\s+no\b/i,
  /\bopción\s+incorrecta\b/i,
];

/**
 * Deterministic review engine applying Layers 1, 2, 3 and preliminary Layer 4.
 */
export function diagnoseReactivo(
  item: ReactivoItem,
  unitContent?: string,
  instrumentType: 'formativa' | 'evaluativo' = 'evaluativo'
): ReactivoDiagnostic {
  const observaciones: DefectObservation[] = [];

  // ==========================================
  // CAPA 1: VALIDACIÓN ESTRUCTURAL
  // ==========================================
  if (!item.enunciado || item.enunciado.trim().length < 15) {
    observaciones.push({
      id: `obs-est-1-${item.numero}`,
      capa: 'Estructural',
      gravedad: 'critico',
      problema: 'El enunciado está incompleto o es excesivamente breve.',
      ubicacion: 'Enunciado',
      criterioIncumplido: 'Lineamiento 4: Elaboración de Enunciados',
      impacto: 'Impide formular una tarea cognitiva clara y evaluable.',
      comoCorregir: 'Redactar un enunciado completo que plantee una situación o problema concreto.',
    });
  }

  // Check 3 distractors
  if (!item.respuestasIncorrectas || item.respuestasIncorrectas.length !== 3) {
    observaciones.push({
      id: `obs-est-2-${item.numero}`,
      capa: 'Estructural',
      gravedad: 'critico',
      problema: `Se requieren exactamente 3 respuestas incorrectas; se encontraron ${item.respuestasIncorrectas?.length || 0}.`,
      ubicacion: 'Respuestas incorrectas',
      criterioIncumplido: 'Lineamiento 3 y 5: Estructura Editorial Obligatoria',
      impacto: 'Incumple la estructura estándar institucional URSE.',
      comoCorregir: 'Ajustar la cantidad de distractores a exactamente 3 opciones plausibles.',
    });
  } else {
    item.respuestasIncorrectas.forEach((dist, idx) => {
      if (!dist || dist.trim().length < 2) {
        observaciones.push({
          id: `obs-est-dist-empty-${item.numero}-${idx}`,
          capa: 'Estructural',
          gravedad: 'critico',
          problema: `El distractor ${idx + 1} se encuentra vacío.`,
          ubicacion: 'Respuestas incorrectas',
          criterioIncumplido: 'Lineamiento 5: Diseño de Distractores',
          impacto: 'Falta de opción válida para la evaluación.',
          comoCorregir: 'Redactar un distractor plausible y conceptualmente coherente.',
        });
      }
    });
  }

  if (!item.respuestaCorrecta || item.respuestaCorrecta.trim().length < 2) {
    observaciones.push({
      id: `obs-est-3-${item.numero}`,
      capa: 'Estructural',
      gravedad: 'critico',
      problema: 'Falta la respuesta correcta o se encuentra vacía.',
      ubicacion: 'Respuesta correcta',
      criterioIncumplido: 'Lineamiento 6: Respuesta Correcta',
      impacto: 'El reactivo carece de clave de evaluación.',
      comoCorregir: 'Definir una única respuesta correcta respaldada por el contenido.',
    });
  }

  // Check for duplicate options
  const allOptions = [
    ...(item.respuestasIncorrectas || []).map(o => o.trim().toLowerCase()),
    (item.respuestaCorrecta || '').trim().toLowerCase(),
  ];
  const uniqueOptions = new Set(allOptions);
  if (uniqueOptions.size < allOptions.length) {
    observaciones.push({
      id: `obs-est-dup-${item.numero}`,
      capa: 'Estructural',
      gravedad: 'critico',
      problema: 'Existen respuestas idénticas o duplicadas entre las opciones.',
      ubicacion: 'Estructura general',
      criterioIncumplido: 'Lineamiento 3: Respuestas Diferenciadas',
      impacto: 'Invalida la discriminación del reactivo y reduce la cantidad real de alternativas.',
      comoCorregir: 'Diferenciar conceptualmente cada opción de respuesta.',
    });
  }

  // Check for forbidden labels in text
  const rawBlock = `${item.enunciado} ${item.respuestasIncorrectas?.join(' ')} ${item.respuestaCorrecta}`;
  if (/\b(?:Opción\s*[A-D1-4]|Alternativa\s*[A-D1-4]|Inciso\s*[A-D1-4])\b/i.test(rawBlock)) {
    observaciones.push({
      id: `obs-est-labels-${item.numero}`,
      capa: 'Estructural',
      gravedad: 'moderado',
      problema: 'Presencia de rótulos no autorizados como «Opción» o «Inciso».',
      ubicacion: 'Estructura general',
      criterioIncumplido: 'Lineamiento 3: Estructura Editorial Obligatoria URSE',
      impacto: 'Contraviene la norma editorial institucional.',
      comoCorregir: 'Eliminar rótulos informales y usar exclusivamente las etiquetas URSE.',
    });
  }

  // ==========================================
  // CAPA 2: VALIDACIÓN EDITORIAL Y EQUILIBRIO
  // ==========================================
  const correctLen = item.respuestaCorrecta?.trim().length || 0;
  const incorrectLens = (item.respuestasIncorrectas || []).map(d => d?.trim().length || 0);
  const maxIncorrectLen = Math.max(...incorrectLens, 1);
  const avgIncorrectLen = incorrectLens.reduce((a, b) => a + b, 0) / (incorrectLens.length || 1);

  // CRITICAL RULE: "La respuesta correcta nunca debe ser la más extensa"
  const correctaEsMasLarga = correctLen > maxIncorrectLen && correctLen > 25;
  const diferenciaExcesiva = correctLen > maxIncorrectLen * 1.35;

  let longitudEquilibrada = true;
  if (correctaEsMasLarga) {
    longitudEquilibrada = false;
    observaciones.push({
      id: `obs-edit-len-1-${item.numero}`,
      capa: 'Editorial',
      gravedad: diferenciaExcesiva ? 'critico' : 'moderado',
      problema: `La respuesta correcta es la más extensa (${correctLen} caracteres vs promedio de distractores de ${Math.round(avgIncorrectLen)}).`,
      ubicacion: 'Respuesta correcta',
      criterioIncumplido: 'Lineamiento 6 y 7: Longitud y Equilibrio de Opciones',
      impacto: 'Proporciona una pista involuntaria visual que permite acertar por descarte de longitud.',
      comoCorregir: 'Sintetizar la respuesta correcta o desarrollar con mayor detalle los distractores para equilibrar la longitud.',
    });
  }

  // Clue words detection in options
  const pistasDetectadas: string[] = [];
  CLUE_WORDS.forEach(clue => {
    const inDistractors = item.respuestasIncorrectas?.some(d => new RegExp(`\\b${clue}\\b`, 'i').test(d));
    const inCorrect = new RegExp(`\\b${clue}\\b`, 'i').test(item.respuestaCorrecta || '');

    if (inDistractors && !inCorrect) {
      pistasDetectadas.push(`"${clue}" en distractores`);
      observaciones.push({
        id: `obs-edit-clue-${item.numero}-${clue}`,
        capa: 'Editorial',
        gravedad: 'moderado',
        problema: `Término absoluto o pista de descarte "${clue}" presente en distractores.`,
        ubicacion: 'Respuestas incorrectas',
        criterioIncumplido: 'Lineamiento 8: Palabras y Pistas que Deben Revisarse',
        impacto: 'El evaluado suele descartar opciones absolutas automáticamente sin requerir análisis temático.',
        comoCorregir: `Eliminar el término absoluto "${clue}" y formular el error conceptual con lenguaje técnico plausible.`,
      });
    }
  });

  // Lexical echo (stem repeating literally in correct answer)
  const stemWords = item.enunciado
    ?.toLowerCase()
    .replace(/[^\w\sáéíóúüñ]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 5) || [];
  
  const correctWords = item.respuestaCorrecta
    ?.toLowerCase()
    .replace(/[^\w\sáéíóúüñ]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 5) || [];

  const commonWords = stemWords.filter(w => correctWords.includes(w));
  // Filter out very common academic words
  const filteredCommon = commonWords.filter(w => !['acuerdo', 'conforme', 'mediante', 'proceso', 'siguiente', 'situacion', 'profesional'].includes(w));
  if (filteredCommon.length >= 3) {
    observaciones.push({
      id: `obs-edit-echo-${item.numero}`,
      capa: 'Editorial',
      gravedad: 'opcional',
      problema: `Repetición léxica entre el enunciado y la clave (${filteredCommon.slice(0, 3).join(', ')}).`,
      ubicacion: 'Respuesta correcta',
      criterioIncumplido: 'Lineamiento 8: Pistas Verbales y Repetición',
      impacto: 'Podría inducir la respuesta por asociación de palabras.',
      comoCorregir: 'Utilizar sinónimos técnicos o reestructurar el enunciado para no repetir los mismos vocablos.',
    });
  }

  // ==========================================
  // CAPA 3: VALIDACIÓN PEDAGÓGICA
  // ==========================================
  // Check negative wording in questions
  let esPositiva = true;
  for (const pat of NEGATIVE_STEM_PATTERNS) {
    if (pat.test(item.enunciado)) {
      esPositiva = false;
      observaciones.push({
        id: `obs-ped-neg-${item.numero}`,
        capa: 'Pedagógica',
        gravedad: 'critico',
        problema: 'Enunciado formulado en sentido negativo (e.g., «¿Cuál NO es...?», «excepto»).',
        ubicacion: 'Enunciado',
        criterioIncumplido: 'Lineamiento 4: Criterios de Elaboración de Enunciados',
        impacto: 'Evalúa la capacidad de descarte memorístico en lugar de la aplicación positiva del conocimiento.',
        comoCorregir: 'Reformular la pregunta en positivo para identificar la decisión, procedimiento o criterio correcto.',
      });
      break;
    }
  }

  // Cognitive level inference
  let nivelCognitivo: CognitiveLevel = 'Comprensión';
  const stemLower = item.enunciado.toLowerCase();
  const esMinicaso =
    /\b(?:caso|paciente|cliente|empresa|institución|institucion|situación|situacion|escenario|durante|al realizar|en una diligencia|tras detectar|determina qué decisión|qué acción debe)\b/i.test(
      item.enunciado
    );

  if (esMinicaso || /\b(?:resuelve|aplica|implementa|procede|calcula|ejecuta)\b/i.test(stemLower)) {
    nivelCognitivo = 'Aplicación';
  }
  if (/\b(?:analiza|distingue|compara|examina|diferencia|interpreta|infiere)\b/i.test(stemLower)) {
    nivelCognitivo = 'Análisis';
  }
  if (/\b(?:evalúa|evalua|dictamina|juzga|prioriza|valora|determina la pertinencia)\b/i.test(stemLower)) {
    nivelCognitivo = 'Evaluación';
  }
  if (/\b(?:soluciona|resuelve el conflicto|subsanar|resolver el problema)\b/i.test(stemLower)) {
    nivelCognitivo = 'Resolución de problemas';
  }

  if (instrumentType === 'formativa' && !esMinicaso && item.enunciado.length < 80) {
    observaciones.push({
      id: `obs-ped-formativa-case-${item.numero}`,
      capa: 'Pedagógica',
      gravedad: 'moderado',
      problema: 'La actividad formativa debe priorizar minicasos o problemas de aplicación.',
      ubicacion: 'Enunciado',
      criterioIncumplido: 'Lineamiento 1: Actividad Formativa URSE',
      impacto: 'La pregunta se limita al recuerdo conceptual en lugar de consolidar el aprendizaje.',
      comoCorregir: 'Enmarcar la pregunta en un minicaso breve contextualizado al ejercicio profesional.',
    });
  }

  // Check Evaluative apartados
  if (instrumentType === 'evaluativo' && (!item.apartado || item.apartado.trim() === '')) {
    observaciones.push({
      id: `obs-ped-apartado-${item.numero}`,
      capa: 'Pedagógica',
      gravedad: 'moderado',
      problema: 'El reactivo evaluativo no tiene asignado el apartado o subtema correspondiente.',
      ubicacion: 'Estructura general',
      criterioIncumplido: 'Lineamiento 2 y 10: Cobertura Temática y Nomenclador',
      impacto: 'Dificulta la trazabilidad de cobertura frente al temario de la unidad.',
      comoCorregir: 'Asociar el número y nombre oficial del apartado temático evaluado (e.g., «1.2 Marco Jurídico»).',
    });
  }

  // ==========================================
  // CAPA 4: VALIDACIÓN DISCIPLINAR
  // ==========================================
  let verificacionDisciplinarPendiente = false;
  let evidenciaContenido: string | undefined = undefined;
  let limitacionesVerificacion: string | undefined = undefined;

  if (!unitContent || unitContent.trim().length < 50) {
    verificacionDisciplinarPendiente = true;
    limitacionesVerificacion =
      'Verificación disciplinar pendiente: No se ha proporcionado el contenido desarrollado de la unidad. La exactitud de la clave y plausibilidad de los distractores no puede corroborarse al 100%.';
  } else {
    // Search for keywords from question in unit content
    const keywords = [
      ...correctWords.slice(0, 4),
      ...stemWords.slice(0, 4),
    ].filter(w => w.length > 5);

    let matchExcerpt = '';
    for (const kw of keywords) {
      const idx = unitContent.toLowerCase().indexOf(kw);
      if (idx !== -1) {
        const start = Math.max(0, idx - 80);
        const end = Math.min(unitContent.length, idx + 160);
        matchExcerpt = unitContent.substring(start, end).replace(/\n+/g, ' ').trim();
        break;
      }
    }

    if (matchExcerpt) {
      evidenciaContenido = `«...${matchExcerpt}...»`;
    } else {
      limitacionesVerificacion =
        'No se identificó concordancia textual directa en el material proporcionado; verificar si el concepto fue desarrollado con distinta terminología.';
    }
  }

  // ==========================================
  // ESTADO Y RECOMENDACIÓN FINAL
  // ==========================================
  const criticos = observaciones.filter(o => o.gravedad === 'critico');
  const moderados = observaciones.filter(o => o.gravedad === 'moderado');

  let estado: ItemStatus = 'aprobada';
  if (criticos.length > 0) {
    estado = 'requiere_reconstruccion';
  } else if (moderados.length > 0) {
    estado = 'requiere_ajustes';
  }

  let justificacion = '';
  let recomendacion = '';

  if (estado === 'aprobada') {
    justificacion =
      'El reactivo cumple los estándares estructurales, de equilibrio de longitud y criterios editoriales obligatorios URSE.';
    recomendacion = verificacionDisciplinarPendiente
      ? 'Aprobada en estructura y pedagogía, pero pendiente de contraste con el texto de la unidad.'
      : 'Listo para formar parte del instrumento final.';
  } else if (estado === 'requiere_ajustes') {
    justificacion = `Se detectaron ${moderados.length} aspecto(s) que merman la calidad psicométrica sin anular la intención evaluativa.`;
    recomendacion = 'Aplicar las correcciones propuestas para equilibrar opciones o retirar pistas involuntarias.';
  } else {
    justificacion = `Se encontraron ${criticos.length} problema(s) crítico(s) que afectan la validez del reactivo (e.g. formulación negativa, desequilibrio marcado o estructura inválida).`;
    recomendacion = 'Reconstruir el reactivo siguiendo los lineamientos de elaboración de enunciados positivos y balance de opciones.';
  }

  return {
    itemId: item.id,
    estado,
    verificacionDisciplinarPendiente,
    nivelCognitivo,
    observaciones,
    justificacion,
    recomendacion,
    evidenciaContenido,
    limitacionesVerificacion,
    resumenAutomatico: {
      longitudEquilibrada,
      correctaEsMasLarga,
      pistasDetectadas,
      esPositiva,
      cumpleFormatoExacto: observaciones.every(o => o.capa !== 'Estructural'),
    },
  };
}

/**
 * Builds the comprehensive audit report for the whole instrument.
 */
export function auditInstrument(
  items: ReactivoItem[],
  diagnosticos: Record<string, ReactivoDiagnostic>,
  topics: { nomenclador: string; titulo: string }[],
  unitContent?: string,
  instrumentType: 'formativa' | 'evaluativo' = 'evaluativo'
) {
  const total = items.length;
  let aprobados = 0;
  let conAjustes = 0;
  let requierenReconstruccion = 0;
  let problemasCriticos = 0;
  let problemasModerados = 0;
  let mejorasOpcionales = 0;
  let pendienteDisciplinar = !unitContent || unitContent.trim().length < 50;

  items.forEach(it => {
    const diag = diagnosticos[it.id];
    if (diag) {
      if (diag.estado === 'aprobada') aprobados++;
      else if (diag.estado === 'requiere_ajustes') conAjustes++;
      else if (diag.estado === 'requiere_reconstruccion') requierenReconstruccion++;

      if (diag.verificacionDisciplinarPendiente) pendienteDisciplinar = true;

      diag.observaciones.forEach(obs => {
        if (obs.gravedad === 'critico') problemasCriticos++;
        else if (obs.gravedad === 'moderado') problemasModerados++;
        else mejorasOpcionales++;
      });
    }
  });

  // Cobertura de apartados
  const coverageMap: Record<string, { topic: string; items: number[] }> = {};
  topics.forEach(t => {
    coverageMap[t.nomenclador] = {
      topic: t.titulo,
      items: [],
    };
  });

  items.forEach((it, idx) => {
    const qNum = idx + 1;
    if (it.apartado) {
      // Find matching topic
      const foundKey = Object.keys(coverageMap).find(k => it.apartado?.includes(k));
      if (foundKey) {
        coverageMap[foundKey].items.push(qNum);
      }
    }
  });

  const matrizCobertura = topics.map(t => {
    const assigned = coverageMap[t.nomenclador]?.items || [];
    let estado: 'Cubierto' | 'Parcial' | 'No cubierto' = 'No cubierto';
    let observaciones = 'Sin reactivos asignados en este apartado.';

    if (assigned.length >= 2) {
      estado = 'Cubierto';
      observaciones = `Evaluado mediante ${assigned.length} reactivos (Preguntas: ${assigned.join(', ')}).`;
    } else if (assigned.length === 1) {
      estado = 'Cubierto';
      observaciones = `Evaluado mediante la pregunta ${assigned[0]}.`;
    } else {
      observaciones = 'Apartado pendiente de reactivo evaluativo.';
    }

    return {
      nomenclador: t.nomenclador,
      temaSubtema: t.titulo,
      aprendizajeEvaluable: `Dominio conceptual y procedimental de ${t.titulo}`,
      preguntasAsignadas: assigned,
      estado,
      observaciones,
    };
  });

  const apartadosTotales = topics.length;
  const apartadosCubiertos = matrizCobertura.filter(m => m.estado !== 'No cubierto').length;
  const apartadosPendientes = apartadosTotales - apartadosCubiertos;

  // Global verdict determination
  let dictamenGlobal: 'APROBADO' | 'REQUIERE AJUSTES' | 'NO APROBADO' | 'PENDIENTE DE CONTENIDO' = 'APROBADO';
  let resumenDictamen = '';

  if (pendienteDisciplinar && unitContent?.length === 0) {
    dictamenGlobal = 'PENDIENTE DE CONTENIDO';
    resumenDictamen = 'El instrumento requiere el contenido desarrollado de la unidad para validar la certeza disciplinar y cobertura.';
  } else if (problemasCriticos > 0 || requierenReconstruccion > 0) {
    dictamenGlobal = 'NO APROBADO';
    resumenDictamen = `No aprobado. Se detectaron ${problemasCriticos} problema(s) crítico(s) que invalidan el reactivo. Es obligatoria la reconstrucción antes de publicar.`;
  } else if (instrumentType === 'formativa' && total !== 3) {
    dictamenGlobal = 'REQUIERE AJUSTES';
    resumenDictamen = `La actividad formativa debe contener exactamente 3 preguntas (actualmente cuenta con ${total}).`;
  } else if (instrumentType === 'evaluativo' && (total < 10 || total > 15)) {
    dictamenGlobal = 'REQUIERE AJUSTES';
    resumenDictamen = `El cuestionario evaluativo debe constar de 10 a 15 preguntas (actualmente cuenta con ${total}).`;
  } else if (problemasModerados > 0 || conAjustes > 0) {
    dictamenGlobal = 'REQUIERE AJUSTES';
    resumenDictamen = `Requiere ajustes. Se detectaron observaciones moderadas (equilibrio de opciones, pistas o distribución temática).`;
  } else if (apartadosPendientes > 0 && apartadosTotales > 0) {
    dictamenGlobal = 'REQUIERE AJUSTES';
    resumenDictamen = `Existen ${apartadosPendientes} apartados del temario sin preguntas asignadas.`;
  } else {
    dictamenGlobal = 'APROBADO';
    resumenDictamen = 'El instrumento cumple satisfactoriamente los lineamientos pedagógicos, editoriales y disciplinares URSE.';
  }

  return {
    totalReactivos: total,
    aprobados,
    conAjustes,
    requierenReconstruccion,
    verificacionDisciplinarPendiente: pendienteDisciplinar,
    apartadosTotales,
    apartadosCubiertos,
    apartadosPendientes,
    problemasCriticos,
    problemasModerados,
    mejorasOpcionales,
    dictamenGlobal,
    resumenDictamen,
    matrizCobertura,
    fechaAuditoria: new Date().toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
  };
}

/**
 * Formats brief review summary matching requirement 5:
 * «Se revisaron 10 preguntas. Siete cumplen los criterios y tres necesitan ajustes».
 */
export function getBriefReviewSummary(
  items: ReactivoItem[],
  diagnosticos: Record<string, ReactivoDiagnostic>,
  hasUnitContent: boolean
): { text: string; aprobadas: number; necesitanAjustes: number; warning?: string } {
  const total = items.length;
  if (total === 0) {
    return {
      text: 'No hay preguntas para revisar.',
      aprobadas: 0,
      necesitanAjustes: 0,
    };
  }

  let aprobadas = 0;
  let necesitanAjustes = 0;

  items.forEach((it) => {
    const d = diagnosticos[it.id];
    if (d?.estado === 'aprobada') {
      aprobadas++;
    } else {
      necesitanAjustes++;
    }
  });

  const numToSpanishWords = (n: number) => {
    const words = [
      'cero', 'una', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete',
      'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince',
    ];
    if (n >= 0 && n < words.length) {
      return words[n].charAt(0).toUpperCase() + words[n].slice(1);
    }
    return `${n}`;
  };

  const parteCumplen = aprobadas === 1 ? 'Una cumple los criterios' : `${numToSpanishWords(aprobadas)} cumplen los criterios`;
  const parteAjustes = necesitanAjustes === 1 ? 'una necesita ajustes' : `${numToSpanishWords(necesitanAjustes).toLowerCase()} necesitan ajustes`;

  let text = '';
  if (necesitanAjustes === 0) {
    text = `Se revisaron ${total} preguntas. Todas cumplen los criterios y no requieren ajustes.`;
  } else if (aprobadas === 0) {
    text = `Se revisaron ${total} preguntas. Ninguna cumple los criterios y todas necesitan ajustes.`;
  } else {
    text = `Se revisaron ${total} preguntas. ${parteCumplen} y ${parteAjustes}.`;
  }

  const warning = !hasUnitContent
    ? 'Nota: Contenido de la unidad no proporcionado. La correspondencia temática no fue verificada.'
    : undefined;

  return { text, aprobadas, necesitanAjustes, warning };
}
