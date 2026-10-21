import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx';
import { AuditReportData, ProjectMetadata, ReactivoItem } from '../types';

/**
 * Generates a valid Microsoft Word (.docx) Document containing approved URSE reactivos.
 */
export async function generateUrseQuestionsDocx(
  items: ReactivoItem[],
  metadata: ProjectMetadata
): Promise<Blob> {
  const paragraphs: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'UNIVERSIDAD REGIONAL DEL SURESTE',
          bold: true,
          size: 32, // 16pt
          color: '1B1B1B',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'CONTROL INSTITUCIONAL DE REACTIVOS ACADÉMICOS',
          bold: true,
          size: 24, // 12pt
          color: 'F4AE32',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `${metadata.asignatura || 'Asignatura'} — ${metadata.numeroYNombreUnidad || 'Unidad'}`,
          italics: true,
          size: 22,
          color: '777777',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `Tipo de Instrumento: ${metadata.tipoInstrumento === 'formativa' ? 'Actividad Formativa (3 preguntas)' : 'Cuestionario Evaluativo (Test)'}`,
          size: 20,
          color: '1B1B1B',
        }),
      ],
    }),
    new Paragraph({ text: '' }), // spacer
  ];

  items.forEach((item, index) => {
    const qNum = index + 1;
    // Header for each question
    paragraphs.push(
      new Paragraph({
        heading: HeadingLevel.HEADING_2,
        children: [
          new TextRun({
            text: `Pregunta ${qNum}`,
            bold: true,
            size: 26,
            color: '1B1B1B',
          }),
        ],
        spacing: { before: 280, after: 120 },
      })
    );

    if (item.apartado) {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `[Apartado: ${item.apartado}]`,
              italics: true,
              size: 18,
              color: '777777',
            }),
          ],
          spacing: { after: 100 },
        })
      );
    }

    // Enunciado:
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Enunciado: ', bold: true, color: '1B1B1B' }),
          new TextRun({ text: item.enunciado.trim() }),
        ],
        spacing: { after: 140 },
      })
    );

    // 3 x Respuesta incorrecta:
    item.respuestasIncorrectas.forEach(dist => {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({ text: 'Respuesta incorrecta: ', bold: true, color: '777777' }),
            new TextRun({ text: dist.trim() }),
          ],
          spacing: { after: 100 },
        })
      );
    });

    // Respuesta correcta: (ALWAYS LAST)
    paragraphs.push(
      new Paragraph({
        children: [
          new TextRun({ text: 'Respuesta correcta: ', bold: true, color: 'F4AE32' }),
          new TextRun({ text: item.respuestaCorrecta.trim(), bold: true }),
        ],
        spacing: { after: 240 },
      })
    );
  });

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });

  return await Packer.toBlob(doc);
}

/**
 * Generates an official Word (.docx) Audit Report.
 */
export async function generateUrseAuditReportDocx(
  audit: AuditReportData,
  metadata: ProjectMetadata
): Promise<Blob> {
  const paragraphs: (Paragraph | Table)[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'UNIVERSIDAD REGIONAL DEL SURESTE (URSE)',
          bold: true,
          size: 32,
          color: '1B1B1B',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'INFORME INSTITUCIONAL DE AUDITORÍA DE REACTIVOS',
          bold: true,
          size: 24,
          color: 'F4AE32',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: `Fecha de emisión: ${audit.fechaAuditoria}`,
          size: 20,
          italics: true,
          color: '777777',
        }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: '1. Datos de Identificación de la Unidad', bold: true, size: 24 }),
      ],
      spacing: { before: 200, after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Asignatura: ', bold: true }),
        new TextRun({ text: metadata.asignatura || 'No especificada' }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Unidad: ', bold: true }),
        new TextRun({ text: metadata.numeroYNombreUnidad || 'No especificada' }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Nivel Académico: ', bold: true }),
        new TextRun({ text: metadata.nivelAcademico }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Tipo de Instrumento: ', bold: true }),
        new TextRun({ text: metadata.tipoInstrumento === 'formativa' ? 'Actividad Formativa' : 'Cuestionario Evaluativo' }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: '2. Dictamen Global URSE', bold: true, size: 24 }),
      ],
      spacing: { before: 200, after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Estado del Dictamen: ', bold: true }),
        new TextRun({
          text: audit.dictamenGlobal,
          bold: true,
          color: audit.dictamenGlobal === 'APROBADO' ? '2E7D32' : 'D32F2F',
        }),
      ],
    }),
    new Paragraph({
      children: [
        new TextRun({ text: 'Fundamentación: ', bold: true }),
        new TextRun({ text: audit.resumenDictamen }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: '3. Resumen Estadístico de Calidad', bold: true, size: 24 }),
      ],
      spacing: { before: 200, after: 100 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: `• Total de reactivos examinados: ${audit.totalReactivos}\n` }),
        new TextRun({ text: `• Reactivos Aprobados: ${audit.aprobados}\n` }),
        new TextRun({ text: `• Reactivos con Ajustes Requeridos: ${audit.conAjustes}\n` }),
        new TextRun({ text: `• Reactivos que Requieren Reconstrucción: ${audit.requierenReconstruccion}\n` }),
        new TextRun({ text: `• Problemas Críticos identificados: ${audit.problemasCriticos}\n` }),
        new TextRun({ text: `• Problemas Moderados identificados: ${audit.problemasModerados}\n` }),
        new TextRun({ text: `• Apartados temáticos cubiertos: ${audit.apartadosCubiertos} de ${audit.apartadosTotales}\n` }),
      ],
      spacing: { after: 200 },
    }),
    new Paragraph({
      children: [
        new TextRun({ text: '4. Matriz de Cobertura Temática', bold: true, size: 24 }),
      ],
      spacing: { before: 200, after: 100 },
    }),
  ];

  // Matriz Table
  const tableRows: TableRow[] = [
    new TableRow({
      tableHeader: true,
      children: [
        new TableCell({
          width: { size: 15, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun({ text: 'Nomenclador', bold: true })] })],
        }),
        new TableCell({
          width: { size: 30, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun({ text: 'Apartado / Tema', bold: true })] })],
        }),
        new TableCell({
          width: { size: 20, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun({ text: 'Preguntas', bold: true })] })],
        }),
        new TableCell({
          width: { size: 15, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun({ text: 'Estado', bold: true })] })],
        }),
        new TableCell({
          width: { size: 20, type: WidthType.PERCENTAGE },
          children: [new Paragraph({ children: [new TextRun({ text: 'Observaciones', bold: true })] })],
        }),
      ],
    }),
  ];

  audit.matrizCobertura.forEach(entry => {
    tableRows.push(
      new TableRow({
        children: [
          new TableCell({ children: [new Paragraph(entry.nomenclador)] }),
          new TableCell({ children: [new Paragraph(entry.temaSubtema)] }),
          new TableCell({ children: [new Paragraph(entry.preguntasAsignadas.join(', ') || 'Ninguna')] }),
          new TableCell({ children: [new Paragraph(entry.estado)] }),
          new TableCell({ children: [new Paragraph(entry.observaciones)] }),
        ],
      })
    );
  });

  paragraphs.push(
    new Table({
      rows: tableRows,
      width: { size: 100, type: WidthType.PERCENTAGE },
    })
  );

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });

  return await Packer.toBlob(doc);
}
