export interface GuidelineSection {
  id: number;
  nombre: string;
  resumen: string;
  reglaAplicable: string;
  criteriosDetallados: string[];
  ejemploPositivo?: string;
  ejemploNegativo?: string;
}

export const URSE_GUIDELINES_VERSION = "2026.1 - Institucional URSE";

export const URSE_GUIDELINES: GuidelineSection[] = [
  {
    id: 1,
    nombre: "Actividad Formativa",
    resumen: "Instrumento breve enfocado en consolidar aprendizajes clave mediante minicasos.",
    reglaAplicable: "Debe contener exactamente tres (3) preguntas de selección única, cada una con un enunciado, tres respuestas incorrectas y una respuesta correcta.",
    criteriosDetallados: [
      "Exactamente 3 preguntas por actividad.",
      "Abordar aprendizajes relevantes y diferenciados de la unidad (sin repetir la misma noción central en dos preguntas).",
      "Priorizar situaciones breves, minicasos profesionales y problemas de interpretación o aplicación.",
      "Mantener la misma estructura editorial obligatoria URSE."
    ],
    ejemploPositivo: `Pregunta 1\nEnunciado: Un perito criminalista arriba al lugar de los hechos y detecta indicios biológicos expuestos a lluvia inminente. De acuerdo con el protocolo de cadena de custodia, ¿qué acción prioritaria debe ejecutar?\nRespuesta incorrecta: Solicitar una orden judicial de cateo complementaria antes de tocar cualquier elemento.\nRespuesta incorrecta: Acordonar un radio adicional de cincuenta metros y esperar el arribo del ministerio público.\nRespuesta incorrecta: Suspender la diligencia hasta que cesen las condiciones climáticas adversas.\nRespuesta correcta: Fijar fotográficamente de urgencia y recolectar prioritariamente los indicios vulnerables documentando la contingencia.`
  },
  {
    id: 2,
    nombre: "Cuestionario Evaluativo (Test)",
    resumen: "Instrumento sumativo para evaluar integralmente el dominio de la unidad.",
    reglaAplicable: "Debe iniciar con 10 preguntas y puede ampliarse hasta 15 cuando se justifique por cobertura de apartados desarrollados.",
    criteriosDetallados: [
      "Comienza con 10 preguntas de selección única; ampliable hasta 15 si los apartados lo requieren.",
      "Cada pregunta debe identificar internamente el tema o subtema evaluado (nomenclador).",
      "Distribución equilibrada entre los apartados de la unidad sin concentrar todas en un solo tema.",
      "No formular enunciados en negativo.",
      "Si existen más aprendizajes diferenciados de los que caben en 15 reactivos, advertir limitación sin falsear cobertura completa."
    ]
  },
  {
    id: 3,
    nombre: "Estructura Editorial Obligatoria del Reactivo",
    resumen: "Regla jerárquica obligatoria que no admite excepciones.",
    reglaAplicable: "Todas las preguntas deben presentar literalmente: Pregunta [N], Enunciado: [...], 3 veces 'Respuesta incorrecta: [...]', y finalmente 'Respuesta correcta: [...]'.",
    criteriosDetallados: [
      "No utilizar incisos A, B, C ni D como etiquetas de opciones.",
      "No utilizar números para identificar las respuestas.",
      "No usar términos alternativos como «Opción 1» o «Alternativa A».",
      "No escribir explicaciones intermedias entre las opciones de respuesta.",
      "No agregar respuestas adicionales (deben ser exactamente 4: 3 incorrectas y 1 correcta).",
      "La respuesta correcta SIEMPRE ocupa el último lugar.",
      "Mantener estas etiquetas idénticas al copiar, descargar o exportar."
    ],
    ejemploNegativo: `Pregunta 1\nA) Opción uno\nB) Opción dos (correcta)\nC) Opción tres\nD) Opción cuatro`
  },
  {
    id: 4,
    nombre: "Elaboración de Enunciados",
    resumen: "Claridad, suficiencia informativa y enfoque positivo en tareas cognitivas concretas.",
    reglaAplicable: "Formular una tarea cognitiva concreta con información suficiente, lenguaje preciso y redactado en positivo.",
    criteriosDetallados: [
      "Evaluar un aprendizaje claramente identificable vinculado al contenido desarrollado.",
      "Evitar información decorativa, anecdótica o irrelevante.",
      "Formular siempre en positivo: prohibido «¿Cuál NO corresponde...?», «¿Qué opción NO es correcta...?», «¿Cuál se excluye...?».",
      "Priorizar minicasos breves en contextos profesionales, procedimentales o del ámbito mexicano.",
      "Los casos hipotéticos no deben redactarse como sucesos históricos documentados.",
      "Variar la redacción inicial: no empezar siempre con «Una empresa...» o «Un paciente...»."
    ]
  },
  {
    id: 5,
    nombre: "Diseño de Distractores (Respuestas Incorrectas)",
    resumen: "Opciones incorrectas que representan confusiones conceptuales plausibles.",
    reglaAplicable: "Deben ser plausibles, guardar estrecha relación con el problema y representar errores reales de razonamiento sin ser absurdos.",
    criteriosDetallados: [
      "Exactamente tres respuestas incorrectas por reactivo.",
      "Deben reflejar errores frecuentes de comprensión, aplicación errónea de normativas o falacias comunes.",
      "Mantener el mismo nivel de lenguaje técnico y registro disciplinar que la respuesta correcta.",
      "No utilizar distractores inverosímiles, humorísticos ni radicalmente fuera de tema.",
      "Ser inequívocamente falsas al contrastarlas rigurosamente con la unidad temática."
    ]
  },
  {
    id: 6,
    nombre: "Respuesta Correcta",
    resumen: "Única solución válida, inequívoca y científicamente fundamentada.",
    reglaAplicable: "Debe ser conceptualmente verdadera, inequívoca, resolver exactamente lo preguntado y nunca ser la opción más larga.",
    criteriosDetallados: [
      "Respaldada por el contenido desarrollado de la unidad.",
      "Si existen dos respuestas defendibles, el reactivo se invalida y requiere reconstrucción.",
      "Mantener la misma categoría conceptual y estructura que los distractores.",
      "Nunca debe ser la opción con mayor longitud en caracteres o palabras.",
      "No debe incluir pistas que delaten su condición por exceso de especificidad o precisión."
    ]
  },
  {
    id: 7,
    nombre: "Longitud y Equilibrio de Opciones",
    resumen: "Paralelismo morfosintáctico y simetría entre las cuatro respuestas.",
    reglaAplicable: "Las cuatro opciones deben presentar extensiones, estructuras gramaticales y niveles de especificidad equilibrados.",
    criteriosDetallados: [
      "Monitoreo estricto del recuento de palabras y caracteres.",
      "Prohibido que la respuesta correcta destaque visiblemente por extensión.",
      "Mantener consistencia en el inicio gramatical (ej. todos infinitivos, todos sustantivos o todos enunciados completos).",
      "Evitar contrastes notorios de complejidad terminológica entre distractores y la clave."
    ]
  },
  {
    id: 8,
    nombre: "Palabras y Pistas que Deben Revisarse",
    resumen: "Detección y eliminación de sesgos de formulación que facilitan adivinar.",
    reglaAplicable: "Detectar términos absolutos o pistas verbales que facilitan el descarte artificial de distractores.",
    criteriosDetallados: [
      "Palabras bajo estricta vigilancia: 'siempre', 'nunca', 'únicamente', 'exclusivamente', 'solamente', 'sin'.",
      "Si un término absoluto aparece solo en los distractores para forzar su falsedad, es un defecto del reactivo.",
      "Repetición literal de términos del enunciado en la respuesta correcta.",
      "Opciones mutuamente excluyentes o alternativas equivalentes.",
      "Diferencias llamativas de corrección gramatical (ej. concordancia de género/número con el enunciado)."
    ]
  },
  {
    id: 9,
    nombre: "Niveles Cognitivos",
    resumen: "Exigencia intelectual alineada a la formación universitaria y de posgrado.",
    reglaAplicable: "Clasificar la demanda cognitiva predominante: Comprensión, Aplicación, Análisis, Evaluación o Resolución de problemas.",
    criteriosDetallados: [
      "Superar el nivel puramente memorístico o de recuerdo literal de definiciones.",
      "En posgrado URSE, priorizar toma de decisiones fundamentadas, interpretación de evidencia y comparación de modelos.",
      "La dificultad debe emanar del razonamiento disciplinar, no de enunciados confusos o rebuscados."
    ]
  },
  {
    id: 10,
    nombre: "Cobertura Temática y Nomencladores",
    resumen: "Mapeo fiel de los reactivos frente a los apartados de la unidad académica.",
    reglaAplicable: "Cada reactivo evaluativo debe estar asociado al nomenclador oficial del tema o subtema correspondiente.",
    criteriosDetallados: [
      "Distribuir las preguntas entre los apartados temáticos desarrollados en el documento.",
      "Diferenciar entre títulos organizadores y apartados con contenido evaluable real.",
      "No declarar un apartado cubierto si la pregunta solo lo menciona tangencialmente sin evaluar su núcleo sustantivo."
    ]
  },
  {
    id: 11,
    nombre: "Criterios de Aprobación y Dictámenes",
    resumen: "Criterios estrictos para validar la calidad de una pregunta o instrumento.",
    reglaAplicable: "Una pregunta solo se aprueba si cumple los controles verificados sin errores críticos ni moderados pendientes.",
    criteriosDetallados: [
      "Aprobada: Cumple todos los lineamientos verificados sin objeciones abiertas.",
      "Requiere ajustes: Intención evaluativa válida pero con problemas corregibles (ej. equilibrio de longitud, pista verbal, formato).",
      "Requiere reconstrucción: Defectos sustantivos graves (ambigüedad, dos claves defendibles, contenido inexistente, redacción negativa).",
      "Si falta el contenido de la unidad, reportar 'Verificación disciplinar pendiente' y no aprobar de manera plena."
    ]
  },
  {
    id: 12,
    nombre: "Ejemplos de Preguntas Adecuadas y Problemáticas",
    resumen: "Guía comparativa de reactivos con buenas prácticas institucionales y vicios frecuentes.",
    reglaAplicable: "Consultar modelos con minicasos contextualizados frente a reactivos con trampas o debilidad psicométrica.",
    criteriosDetallados: [
      "Reactivo adecuado: Plantea un problema profesional real en México, distractores de similar longitud y base conceptual común.",
      "Reactivo problemático 1: Enunciado negativo con '¿Cuál NO es...?'.",
      "Reactivo problemático 2: Respuesta correcta notablemente más extensa y detallada que los distractores.",
      "Reactivo problemático 3: Distractor absurdo con 'Nunca' o 'Siempre' que cualquier estudiante descarta sin estudiar."
    ]
  },
  {
    id: 13,
    nombre: "Formato Editorial de Entrega y Exportación",
    resumen: "Estándares para descargas Word, reportes de auditoría y salidas Python.",
    reglaAplicable: "Mantener fielmente la rotulación 'Enunciado:', 'Respuesta incorrecta:', 'Respuesta correcta:' en todas las salidas.",
    criteriosDetallados: [
      "Documento Word: Tipografía limpia, espaciado uniforme, sin incisos A, B, C, D.",
      "Informe de auditoría: Diagnóstico detallado, matriz de cobertura, dictamen institucional y limitaciones.",
      "Formato Python: Generación válida de tuplas en FORMATIVA o TEST con nomencladores."
    ]
  }
];
