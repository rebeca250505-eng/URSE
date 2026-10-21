import { ProjectData, ReactivoItem } from '../types';
import { diagnoseReactivo, auditInstrument } from './rulesEngine';
import { extractSyllabusTopics } from './parser';

const SAMPLE_UNIT_CONTENT = `UNIVERSIDAD REGIONAL DEL SURESTE (URSE)
FACULTAD DE DERECHO Y CIENCIAS SOCIALES
ASIGNATURA: CONTROL CONSTITUCIONAL Y DERECHOS HUMANOS
UNIDAD 1: EL CONTROL DE CONVENCIONALIDAD EN EL ORDEN JURÍDICO MEXICANO

1. INTRODUCCIÓN Y FIN DE APRENDIZAJE
El estudiante analizará los fundamentos teóricos, normativos y jurisprudenciales del control difuso de constitucionalidad y convencionalidad en México, a partir de la reforma de junio de 2011 y las sentencias de la Corte Interamericana de Derechos Humanos, a fin de aplicar el principio pro persona en la resolución de casos jurídicos concretos.

1.1 Fundamentos del Control Difuso de Constitucionalidad y Convencionalidad
A partir de la resolución del expediente varios 912/2010 por la Suprema Corte de Justicia de la Nación, derivado del cumplimiento de la sentencia del Caso Radilla Pacheco vs. México emitida por la Corte Interamericana de Derechos Humanos (Corte IDH), todos los jueces del Estado mexicano están obligados a ejercer un control de convencionalidad ex officio entre las normas internas y los tratados internacionales de los que el Estado mexicano sea parte.
El modelo de control de convencionalidad en México no es concentrado exclusivo del Poder Judicial de la Federación, sino que adoptó una naturaleza mixta o difusa para la judicatura común. Los jueces locales ordinarios no pueden declarar la invalidez general o derogación de una ley local o federal contraria a la Convención Americana sobre Derechos Humanos, sino que deben limitar su actuación a la inaplicación de la norma en el caso concreto sometido a su jurisdicción.

1.2 El Principio Pro Persona y los Criterios de Preferencia
El artículo 1o. de la Constitución Política de los Estados Unidos Mexicanos consagra las cláusulas de interpretación conforme y el principio pro persona. Dicho principio opera en dos vertientes operativas principales:
a) Preferencia interpretativa: cuando existan dos o más interpretaciones jurídicamente admisibles de un mismo precepto, el juzgador debe optar por aquella que optimice el goce del derecho o bien la que restrinja en menor medida su ejercicio.
b) Preferencia de normas: ante la concurrencia de dos o más normas aplicables al supuesto de hecho (sea de origen nacional o convencional), debe prevalecer la disposición que reconozca mayor protección a la persona, con independencia de la jerarquía formal que ordinariamente ostente la fuente normativa en la pirámide kelseniana, salvo las restricciones expresas que la propia Constitución mexicana determine según la contradicción de tesis 293/2011.

1.3 La Interpretación Conforme en Sentido Amplio y Estricto
La jurisprudencia del Pleno de la SCJN ha determinado tres pasos metodológicos que los operadores jurisdiccionales deben agotar secuencialmente antes de llegar a la inaplicación de un precepto normativo:
1. Interpretación conforme en sentido amplio: interpretar el orden jurídico a la luz de los derechos humanos reconocidos en la Constitución y tratados.
2. Interpretación conforme en sentido estricto: cuando haya varias interpretaciones válidas, preferir la que salve la constitucionalidad de la norma.
3. Inaplicación en sentido estricto: cuando no sea posible armonizar la norma con el bloque de constitucionalidad mediante las fases previas, procede inaplicar la disposición exclusivamente para el caso particular.

1.4 Deberes de Prevención, Investigación, Sanción y Reparación
Las autoridades de todos los órdenes de gobierno tienen las obligaciones de promover, respetar, proteger y garantizar los derechos humanos de conformidad con los principios de universalidad, interdependencia, indivisibilidad y progresividad. En caso de vulneración, el Estado debe reparar integralmente el daño, contemplando medidas de restitución, rehabilitación, satisfacción y garantías de no repetición.`;

const rawQuestions: ReactivoItem[] = [
  {
    id: 'sample-q1',
    numero: 1,
    apartado: '1.1 Fundamentos del Control Difuso',
    enunciado: 'Un juez de primera instancia del fuero común en Oaxaca advierte durante el desahogo de un juicio que un artículo del Código Civil local contradice abiertamente las garantías mínimas consagradas en la Convención Americana sobre Derechos Humanos. Conforme a las directrices fijadas en el expediente varios 912/2010 de la SCJN, ¿cuál es la determinación jurídica procedente que debe adoptar el juzgador?',
    respuestasIncorrectas: [
      'Declarar la inconstitucionalidad de la norma con efectos generales para todos los habitantes.',
      'Promover un juicio de amparo indirecto ante un juzgado de distrito federal competente en materia mixta para pausar el proceso.',
      'Suspender el juicio hasta que el Tribunal Superior de Justicia del Estado emita jurisprudencia obligatoria.',
    ],
    respuestaCorrecta: 'Inaplicar la norma local exclusivamente en el caso concreto y resolver la controversia conforme al bloque convencional.',
    nivelCognitivo: 'Aplicación' as const,
  },
  {
    id: 'sample-q2',
    numero: 2,
    apartado: '1.2 El Principio Pro Persona',
    enunciado: 'En la resolución de una controversia laboral sobre indemnización por riesgo de trabajo, un juzgador enfrenta dos disposiciones normativas vigentes aplicables que regulan el cálculo del beneficio con criterios divergentes. Siguiendo el principio pro persona en su vertiente de preferencia de normas, ¿qué directriz de resolución debe aplicar?',
    respuestasIncorrectas: [
      'Aplicar la norma de menor beneficio porque siempre prevalece el principio de austeridad procesal y celeridad.',
      'Remitir el conflicto al tribunal colegiado competente para que fije la jerarquía definitiva de la norma.',
      'Desechar ambas disposiciones y recurrir a los principios generales del derecho laboral de forma supletoria.',
    ],
    // Correct answer is noticeably longer and contains details (moderate defect)
    respuestaCorrecta: 'Elegir y aplicar la norma que brinde el estándar de protección más favorable a la persona trabajadora, aun cuando pertenezca a un rango normativo secundario.',
    nivelCognitivo: 'Análisis' as const,
  },
  {
    id: 'sample-q3',
    numero: 3,
    apartado: '1.3 La Interpretación Conforme',
    // Question formulated in negative (CRITICAL DEFECT)
    enunciado: 'Al aplicar los pasos metodológicos del control de convencionalidad según la jurisprudencia de la SCJN, ¿cuál de los siguientes pasos NO corresponde al orden de prelación establecido?',
    respuestasIncorrectas: [
      'Interpretación conforme en sentido amplio.',
      'Interpretación conforme en sentido estricto.',
      'Inaplicación de la disposición en el caso particular.',
    ],
    respuestaCorrecta: 'Declaratoria general de nulidad legislativa por el juez ordinario.',
    nivelCognitivo: 'Comprensión' as const,
  },
];

export function getInitialSampleProject(): ProjectData {
  const topics = extractSyllabusTopics(SAMPLE_UNIT_CONTENT);

  const diagnosticos: Record<string, any> = {};
  rawQuestions.forEach(q => {
    diagnosticos[q.id] = diagnoseReactivo(q, SAMPLE_UNIT_CONTENT, 'formativa');
  });

  const auditoria = auditInstrument(rawQuestions, diagnosticos, topics, SAMPLE_UNIT_CONTENT, 'formativa');

  // Pre-seed a correction proposal for q3 (negative stem)
  const q3Propuesta = {
    id: 'prop-sample-q3',
    numero: 3,
    apartado: '1.3 La Interpretación Conforme',
    enunciado: 'Un juzgador debe resolver una contradicción aparente entre un precepto legal y un tratado internacional sobre derechos humanos. Conforme a la metodología secuencial de control difuso fijada por la SCJN, ¿cuál es el primer paso interpretativo que debe agotar el operador jurídico?',
    respuestasIncorrectas: [
      'Proceder a la inaplicación inmediata del precepto legal en la sentencia definitiva.',
      'Someter una consulta de inconstitucionalidad ante el pleno de la Suprema Corte.',
      'Elegir directamente la interpretación estricta prescindiendo de los tratados.',
    ],
    respuestaCorrecta: 'Realizar una interpretación conforme en sentido amplio a la luz de los derechos humanos.',
    nivelCognitivo: 'Aplicación' as const,
  };

  const propuestas: Record<string, any> = {
    'sample-q3': {
      itemId: 'sample-q3',
      original: rawQuestions[2],
      propuesta: q3Propuesta,
      problemasCorregidos: [
        'Eliminación de la formulación negativa («¿Cuál NO corresponde...?»).',
        'Rediseño como situación de análisis metodológico secuencial en positivo.',
        'Equilibrio estricto de longitud de distractores y respuesta correcta.',
      ],
      motivoModificacion: 'Cumplir con el Lineamiento 4 URSE: los reactivos deben formularse en positivo evaluando una decisión o procedimiento adecuado.',
      evidenciaUtilizada: 'Apartado 1.3: «1. Interpretación conforme en sentido amplio: interpretar el orden jurídico a la luz de los derechos humanos...»',
      cambioRespuestaCorrecta: true,
      estadoResultante: 'aprobada',
      decisionUsuario: 'pendiente',
    },
  };

  const sugerencias = [
    {
      id: 'sug-sample-q2-1',
      itemId: 'sample-q2',
      tipo: 'Necesaria' as const,
      titulo: 'Equilibrar longitud de la respuesta correcta',
      descripcion: 'La respuesta correcta supera en longitud a los distractores. Conviene sintetizar la clave o ampliar los distractores para evitar pistas visuales.',
      criterioRelacionado: 'Lineamiento 7: Longitud y Equilibrio de Opciones',
    },
    {
      id: 'sug-sample-q2-2',
      itemId: 'sample-q2',
      tipo: 'Opcional' as const,
      titulo: 'Enriquecer con datos del caso de Oaxaca',
      descripcion: 'Contextualizar con una mención breve al tribunal o materia laboral local para otorgar mayor realismo profesional al dilema.',
      criterioRelacionado: 'Lineamiento 4: Minicasos Profesionales',
    },
  ];

  return {
    metadata: {
      id: 'proj-urse-demo-1',
      nombre: 'Unidad 1: Control de Convencionalidad — URSE Derecho',
      asignatura: 'Control Constitucional y Derechos Humanos',
      numeroYNombreUnidad: 'Unidad 1: El Control de Convencionalidad en el Orden Jurídico Mexicano',
      nivelAcademico: 'Licenciatura',
      finAprendizaje: 'Analizar los fundamentos teóricos, normativos y jurisprudenciales del control difuso de convencionalidad en México para aplicar el principio pro persona.',
      tipoInstrumento: 'formativa',
      contenidoUnidad: SAMPLE_UNIT_CONTENT,
      temario: topics,
      documentoNombre: 'Unidad_1_Control_Convencionalidad_URSE.docx',
      documentoTamano: 18450,
      documentoTipo: 'docx',
      fechaCreacion: '2026-10-20T10:00:00.000Z',
      ultimaModificacion: new Date().toISOString(),
      versionLineamientos: '2026.1 - Institucional URSE',
    },
    reactivosOriginales: rawQuestions,
    reactivosTrabajo: rawQuestions,
    reactivosAprobados: [rawQuestions[0]], // q1 is approved
    diagnosticos,
    propuestas,
    sugerencias,
    auditoria,
    historialAcciones: [
      {
        fecha: new Date().toISOString(),
        accion: 'Carga inicial de proyecto muestra URSE',
        detalle: 'Proyecto cargado con 3 preguntas (1 aprobada, 1 con ajustes, 1 que requiere reconstrucción).',
      },
    ],
  };
}
