import { ReactivoItem, SyllabusTopic } from '../types';

/**
 * Parses raw text containing one or multiple questions into structured ReactivoItem objects.
 * Handles official URSE format as well as legacy/faulty formats (A/B/C/D, 1/2/3/4)
 * so that the review engine can detect faults and the correction engine can normalize them.
 */
export function parseReactivosFromText(rawText: string): { items: ReactivoItem[]; warnings: string[] } {
  const warnings: string[] = [];
  if (!rawText || !rawText.trim()) {
    return { items: [], warnings: ['El texto está vacío.'] };
  }

  // Normalize line endings
  const text = rawText.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Split into question blocks by patterns like:
  // "Pregunta \d+", "Reactivo \d+", or standalone numbers "\d+\." followed by text
  const questionBlockRegex = /(?:^|\n)(?=(?:Pregunta\s*\d+|Reactivo\s*\d+|\b\d+\s*[\.\-\)]\s*(?:Enunciado|¿|[A-Z])))/gi;
  let blocks = text.split(questionBlockRegex).map(b => b.trim()).filter(Boolean);

  if (blocks.length === 0) {
    // If no distinct question headers found, check if the entire text is a single question
    blocks = [text.trim()];
  }

  const items: ReactivoItem[] = [];

  blocks.forEach((block, index) => {
    const itemNum = index + 1;

    // Check for explicit "Pregunta N" header
    let headerMatch = block.match(/(?:Pregunta|Reactivo)\s*(\d+)[:\.]?/i);
    let assignedNum = headerMatch ? parseInt(headerMatch[1], 10) : itemNum;

    // Check for Apartado / Tema metadata in block if any
    let apartadoMatch = block.match(/(?:Apartado|Tema|Subtema|Nomenclador)[\s:]+([0-9]+(?:\.[0-9]+)*[^\n]*)/i);
    const apartado = apartadoMatch ? apartadoMatch[1].trim() : undefined;

    // Try parsing strict URSE format:
    // Enunciado: ...
    // Respuesta incorrecta: ...
    // Respuesta correcta: ...
    const enunciadoMatch = block.match(/Enunciado:\s*([\s\S]*?)(?=(?:Respuesta\s+incorrecta:|Respuesta\s+correcta:|Opción|Alternativa|[A-D]\)|\d+\.|$))/i);
    
    // Find all Respuesta incorrecta:
    const incorrectMatches = Array.from(block.matchAll(/Respuesta\s+incorrecta:\s*([\s\S]*?)(?=(?:Respuesta\s+incorrecta:|Respuesta\s+correcta:|Apartado:|Tema:|$))/gi))
      .map(m => m[1].trim());

    // Find Respuesta correcta:
    const correctMatch = block.match(/Respuesta\s+correcta:\s*([\s\S]*?)(?=(?:Respuesta\s+incorrecta:|Apartado:|Tema:|$))/i);

    if (enunciadoMatch && incorrectMatches.length === 3 && correctMatch) {
      items.push({
        id: `item-${Date.now()}-${assignedNum}-${Math.random().toString(36).substr(2, 4)}`,
        numero: assignedNum,
        apartado,
        enunciado: enunciadoMatch[1].trim(),
        respuestasIncorrectas: [incorrectMatches[0], incorrectMatches[1], incorrectMatches[2]],
        respuestaCorrecta: correctMatch[1].trim(),
      });
      return;
    }

    // Fallback: parse lines with other formats (e.g. A, B, C, D or partial labels)
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    let parsedEnunciado = '';
    const parsedIncorrect: string[] = [];
    let parsedCorrect = '';

    // If there's an Enunciado label
    if (enunciadoMatch) {
      parsedEnunciado = enunciadoMatch[1].trim();
    } else {
      // Find lines before options start
      const promptLines: string[] = [];
      let foundOption = false;
      for (const line of lines) {
        if (/^(?:Respuesta|Opción|Alternativa|[A-D][\.\)]|\d+[\.\)])/i.test(line)) {
          foundOption = true;
          break;
        }
        if (!/^(?:Pregunta|Reactivo)\s*\d+/i.test(line)) {
          promptLines.push(line);
        }
      }
      parsedEnunciado = promptLines.join(' ').trim();
    }

    // Try extracting options marked with letters like A), B), C), D) or asterisk/correcta
    const optionRegex = /(?:^|\n)\s*(?:[A-D][\.\)]|\d+[\.\)]|[-*•])\s*([\s\S]*?)(?=(?:\n\s*(?:[A-D][\.\)]|\d+[\.\)]|[-*•]))|$)/gi;
    const optionMatches = Array.from(block.matchAll(optionRegex)).map(m => m[1].trim());

    if (optionMatches.length >= 4) {
      // Check if any option is marked as correct, e.g. "(correcta)", "[clave]"
      let foundCorrectIdx = -1;
      const cleanedOptions = optionMatches.map((opt, idx) => {
        if (/\((?:correcta|clave|respuesta correcta)\)|\[(?:correcta|clave)\]|\*(?:correcta)\*/i.test(opt)) {
          foundCorrectIdx = idx;
          return opt.replace(/\s*\((?:correcta|clave|respuesta correcta)\)|\s*\[(?:correcta|clave)\]|\s*\*(?:correcta)\*/gi, '').trim();
        }
        return opt;
      });

      if (foundCorrectIdx !== -1) {
        parsedCorrect = cleanedOptions[foundCorrectIdx];
        const remaining = cleanedOptions.filter((_, i) => i !== foundCorrectIdx);
        parsedIncorrect.push(...remaining.slice(0, 3));
      } else {
        // Assume last one or default
        parsedCorrect = cleanedOptions[cleanedOptions.length - 1];
        parsedIncorrect.push(...cleanedOptions.slice(0, cleanedOptions.length - 1).slice(0, 3));
      }
    } else {
      // Use existing partial matches
      if (incorrectMatches.length > 0) {
        parsedIncorrect.push(...incorrectMatches);
      }
      if (correctMatch) {
        parsedCorrect = correctMatch[1].trim();
      }
    }

    // Pad incorrect if fewer than 3
    while (parsedIncorrect.length < 3) {
      parsedIncorrect.push(`[Distractor ${parsedIncorrect.length + 1} no especificado]`);
    }

    if (!parsedEnunciado) {
      parsedEnunciado = lines[0] || `[Enunciado de la pregunta ${assignedNum}]`;
    }
    if (!parsedCorrect) {
      parsedCorrect = `[Respuesta correcta no especificada]`;
    }

    items.push({
      id: `item-${Date.now()}-${assignedNum}-${Math.random().toString(36).substr(2, 4)}`,
      numero: assignedNum,
      apartado,
      enunciado: parsedEnunciado,
      respuestasIncorrectas: [parsedIncorrect[0], parsedIncorrect[1], parsedIncorrect[2]],
      respuestaCorrecta: parsedCorrect,
    });
  });

  return { items, warnings };
}

/**
 * Extracts syllabus topics with nomenclators (e.g. 1.1, 1.2, 2.1.3) from unit content.
 */
export function extractSyllabusTopics(unitText: string): SyllabusTopic[] {
  if (!unitText) return [];

  const lines = unitText.split('\n').map(l => l.trim()).filter(Boolean);
  const topics: SyllabusTopic[] = [];
  const seenNomenclators = new Set<string>();

  // Regex matches:
  // "1.1 Subtema"
  // "1.1.1 Apartado"
  // "1. Título" (only when line is not "Unidad N: ...")
  const subtopicRegex = /^(?:Tema|Subtema|Apartado|Sección)?\s*([0-9]+(?:\.[0-9]+)+)\.?\s*[:\-–—]?\s*(.+)$/i;
  const singleTopicRegex = /^(?:Tema|Subtema|Apartado|Sección)?\s*([0-9]+)\.?\s*[:\-–—]\s*(.+)$/i;

  for (const line of lines) {
    // Skip general document headers like "UNIDAD 1: TITULO"
    if (/^UNIDAD\s*\d+\s*[:\-–—]/i.test(line)) continue;

    let match = line.match(subtopicRegex);
    if (!match && line.length < 90) {
      match = line.match(singleTopicRegex);
    }

    if (match) {
      const nomenclador = match[1].trim();
      const rawTitle = match[2].trim();
      // Remove trailing markdown / punctuation
      const titulo = rawTitle.replace(/[#*_]/g, '').trim();

      if (!seenNomenclators.has(nomenclador) && titulo.length > 2 && titulo.length < 120) {
        seenNomenclators.add(nomenclador);
        topics.push({
          id: `topic-${nomenclador}`,
          nomenclador,
          titulo,
        });
      }
    }
  }

  // Sort by numeric nomenclator order (1.1, 1.2, 1.10)
  return topics.sort((a, b) => {
    const partsA = a.nomenclador.split('.').map(n => parseInt(n, 10));
    const partsB = b.nomenclador.split('.').map(n => parseInt(n, 10));
    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
      const numA = partsA[i] || 0;
      const numB = partsB[i] || 0;
      if (numA !== numB) return numA - numB;
    }
    return 0;
  });
}

/**
 * Converts a ReactivoItem into the exact mandatory URSE text format.
 */
export function formatReactivoToUrseText(item: ReactivoItem): string {
  const lines: string[] = [
    `Pregunta ${item.numero}`,
    '',
    `Enunciado: ${item.enunciado.trim()}`,
    '',
    `Respuesta incorrecta: ${item.respuestasIncorrectas[0]?.trim() || ''}`,
    '',
    `Respuesta incorrecta: ${item.respuestasIncorrectas[1]?.trim() || ''}`,
    '',
    `Respuesta incorrecta: ${item.respuestasIncorrectas[2]?.trim() || ''}`,
    '',
    `Respuesta correcta: ${item.respuestaCorrecta.trim()}`,
  ];

  return lines.join('\n');
}

/**
 * Formats an array of ReactivoItems into a complete URSE document text.
 */
export function formatAllReactivosToUrseText(items: ReactivoItem[], title?: string): string {
  const parts: string[] = [];
  if (title) {
    parts.push(title.toUpperCase());
    parts.push('='.repeat(title.length));
    parts.push('');
  }

  items.forEach((item, idx) => {
    const adjusted = { ...item, numero: idx + 1 };
    parts.push(formatReactivoToUrseText(adjusted));
    parts.push('\n' + '-'.repeat(40) + '\n');
  });

  return parts.join('\n').trim();
}
