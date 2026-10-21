import { InstrumentType, ReactivoItem } from '../types';

function escapePythonString(str: string): string {
  if (!str) return '""';
  return JSON.stringify(str.trim());
}

/**
 * Generates valid Python code compatible with URSE contenido_unidad.py
 */
export function exportToContenidoUnidadPy(
  items: ReactivoItem[],
  instrumentType: InstrumentType,
  unitName?: string
): string {
  const header = [
    `# ==============================================================================`,
    `# UNIVERSIDAD REGIONAL DEL SURESTE (URSE)`,
    `# Estructura académica generada para: contenido_unidad.py`,
    `# Unidad: ${unitName || 'Sin especificar'}`,
    `# Fecha de exportación: ${new Date().toISOString()}`,
    `# ==============================================================================`,
    '',
  ];

  if (instrumentType === 'formativa') {
    const tuples = items.map((it, idx) => {
      const enunciado = escapePythonString(it.enunciado);
      const inc1 = escapePythonString(it.respuestasIncorrectas[0] || '');
      const inc2 = escapePythonString(it.respuestasIncorrectas[1] || '');
      const inc3 = escapePythonString(it.respuestasIncorrectas[2] || '');
      const corr = escapePythonString(it.respuestaCorrecta);

      return `    # Pregunta ${idx + 1}
    (
        ${enunciado},
        [
            ${inc1},
            ${inc2},
            ${inc3}
        ],
        ${corr}
    )`;
    });

    const code = [
      ...header,
      `FORMATIVA = [`,
      tuples.join(',\n'),
      `]`,
      '',
    ].join('\n');

    return code;
  } else {
    const tuples = items.map((it, idx) => {
      const enunciado = escapePythonString(it.enunciado);
      const inc1 = escapePythonString(it.respuestasIncorrectas[0] || '');
      const inc2 = escapePythonString(it.respuestasIncorrectas[1] || '');
      const inc3 = escapePythonString(it.respuestasIncorrectas[2] || '');
      const corr = escapePythonString(it.respuestaCorrecta);
      const apartado = escapePythonString(it.apartado || `1.${idx + 1} Apartado temático evaluado`);

      return `    # Pregunta ${idx + 1}
    (
        ${enunciado},
        [
            ${inc1},
            ${inc2},
            ${inc3}
        ],
        ${corr},
        ${apartado}
    )`;
    });

    const code = [
      ...header,
      `TEST = [`,
      tuples.join(',\n'),
      `]`,
      '',
    ].join('\n');

    return code;
  }
}
