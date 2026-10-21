import test from 'node:test';
import assert from 'node:assert/strict';
import { parseReactivosFromText, extractSyllabusTopics, formatReactivoToUrseText } from './parser';
import { diagnoseReactivo, auditInstrument, getBriefReviewSummary } from './rulesEngine';
import { exportToContenidoUnidadPy } from './pythonExporter';
import { ReactivoItem } from '../types';

test('parseReactivosFromText correctly parses strict URSE format', () => {
  const sample = `
Pregunta 1

Enunciado: En el contexto del derecho procesal mexicano, ¿cuál es el plazo para interponer el recurso de revocación según el código adjetivo aplicable?

Respuesta incorrecta: Cinco días hábiles contados a partir del auto inicial.

Respuesta incorrecta: Diez días naturales sin posibilidad de prórroga alguna.

Respuesta incorrecta: Quince días hábiles tras la notificación en estrados.

Respuesta correcta: Tres días hábiles siguientes a que surta efectos la notificación.
`;

  const { items } = parseReactivosFromText(sample);
  assert.equal(items.length, 1);
  assert.equal(items[0].numero, 1);
  assert.match(items[0].enunciado, /plazo para interponer/);
  assert.equal(items[0].respuestasIncorrectas.length, 3);
  assert.match(items[0].respuestaCorrecta, /Tres días hábiles/);
});

test('diagnoseReactivo detects negative stem as a critical defect', () => {
  const badItem: ReactivoItem = {
    id: 'test-1',
    numero: 1,
    enunciado: '¿Cuál de los siguientes principios procesales NO corresponde al sistema acusatorio penal mexicano?',
    respuestasIncorrectas: [
      'Inmediación',
      'Concentración',
      'Publicidad',
    ],
    respuestaCorrecta: 'Inquisitividad secreta',
  };

  const diag = diagnoseReactivo(badItem);
  assert.equal(diag.estado, 'requiere_reconstruccion');
  assert.equal(diag.resumenAutomatico.esPositiva, false);
  const negObs = diag.observaciones.find(o => o.problema.includes('negativo'));
  assert.ok(negObs, 'Must have negative stem observation');
  assert.equal(negObs?.gravedad, 'critico');
});

test('diagnoseReactivo detects when correct answer is the longest and unbalanced', () => {
  const itemWithLongCorrect: ReactivoItem = {
    id: 'test-2',
    numero: 2,
    enunciado: 'Un auditor detecta discrepancias en los inventarios físicos durante el cierre del ejercicio fiscal.',
    respuestasIncorrectas: [
      'Avisar al gerente.',
      'Ajustar la cuenta.',
      'Ignorar el saldo.',
    ],
    respuestaCorrecta: 'Elaborar un informe circunstanciado detallando los hallazgos cuantitativos, muestras tomadas, normas NIF aplicables y recomendaciones de control interno para el comité de auditoría.',
  };

  const diag = diagnoseReactivo(itemWithLongCorrect);
  assert.equal(diag.resumenAutomatico.correctaEsMasLarga, true);
  const lenObs = diag.observaciones.find(o => o.capa === 'Editorial' && o.problema.includes('más extensa'));
  assert.ok(lenObs, 'Must detect correct answer as being the longest');
});

test('diagnoseReactivo detects clue words like "siempre" or "nunca" in distractors', () => {
  const itemWithClues: ReactivoItem = {
    id: 'test-3',
    numero: 3,
    enunciado: '¿Qué criterio rige la valoración de la prueba pericial?',
    respuestasIncorrectas: [
      'El juez siempre debe acatar el dictamen pericial sin objeción.',
      'La prueba pericial nunca puede ser impugnada por las partes.',
      'Se rechaza únicamente si no fue ratificada.',
    ],
    respuestaCorrecta: 'La sana crítica y las reglas de la lógica y experiencia.',
  };

  const diag = diagnoseReactivo(itemWithClues);
  assert.ok(diag.resumenAutomatico.pistasDetectadas.length > 0);
  assert.ok(diag.observaciones.some(o => o.problema.includes('Término absoluto')));
});

test('extractSyllabusTopics extracts topics and nomenclators', () => {
  const text = `
UNIDAD 1: DERECHO CONSTITUCIONAL
1.1 Origen y evolución del constitucionalismo
1.2 Supremacía constitucional y control difuso
1.2.1 Principio de interpretación conforme
2.1 Garantías individuales y derechos humanos
  `;

  const topics = extractSyllabusTopics(text);
  assert.ok(topics.length >= 3);
  assert.equal(topics[0].nomenclador, '1.1');
  assert.equal(topics[1].nomenclador, '1.2');
});

test('exportToContenidoUnidadPy formats exact Python structure for TEST and FORMATIVA', () => {
  const item: ReactivoItem = {
    id: 'test-py',
    numero: 1,
    apartado: '1.1 Conceptos Fundamentales',
    enunciado: 'Enunciado de prueba',
    respuestasIncorrectas: ['Inc 1', 'Inc 2', 'Inc 3'],
    respuestaCorrecta: 'Clave válida',
  };

  const pyFormativa = exportToContenidoUnidadPy([item], 'formativa', 'Unidad 1');
  assert.match(pyFormativa, /FORMATIVA = \[/);
  assert.match(pyFormativa, /"Enunciado de prueba"/);

  const pyTest = exportToContenidoUnidadPy([item], 'evaluativo', 'Unidad 1');
  assert.match(pyTest, /TEST = \[/);
  assert.match(pyTest, /"1.1 Conceptos Fundamentales"/);
});

test('getBriefReviewSummary generates expected summary format', () => {
  const item1: ReactivoItem = {
    id: 't1',
    numero: 1,
    enunciado: 'Enunciado correcto de prueba con longitud suficiente para evaluación.',
    respuestasIncorrectas: ['Distractor uno', 'Distractor dos', 'Distractor tres'],
    respuestaCorrecta: 'Clave válida',
  };
  const item2: ReactivoItem = {
    id: 't2',
    numero: 2,
    enunciado: '¿Cuál NO corresponde a la hipótesis?',
    respuestasIncorrectas: ['A', 'B', 'C'],
    respuestaCorrecta: 'D',
  };

  const d1 = diagnoseReactivo(item1, 'texto de unidad');
  const d2 = diagnoseReactivo(item2, 'texto de unidad');
  const diags = { t1: d1, t2: d2 };

  const summary = getBriefReviewSummary([item1, item2], diags, true);
  assert.match(summary.text, /Se revisaron 2 preguntas\./);
  assert.match(summary.text, /necesitan ajustes/);
});
