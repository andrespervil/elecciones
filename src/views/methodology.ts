import type { AppCtx } from './ui';
import { el } from './ui';

export function renderMethodology(ctx: AppCtx): HTMLElement {
  const data = ctx.data;
  const root = el('div', 'prose');

  root.append(el('p', 'kicker', 'Test electoral · 29-N'));
  root.append(el('h1', undefined, 'Metodología'));

  const intro = el('p', 'lede');
  intro.style.marginTop = '0.8rem';
  intro.textContent =
    'Cómo se construye este test, de dónde sale cada posición y cómo se calcula tu afinidad. Todo reproducible.';
  root.append(intro);

  /* preguntas y temas */
  const hQ = el('h2', undefined, 'Las preguntas y los temas');
  root.append(hQ);
  const pQ = el('p');
  pQ.append(
    `El test usa ${data.meta.nQuestions} afirmaciones agrupadas en ${data.themes.length} temas. Cada afirmación está escrita en lenguaje llano y va acompañada de una explicación de qué significa. Responder lleva entre 5 y 10 minutos.`,
  );
  root.append(pQ);
  const themeCats = new Map<string, string>();
  const themeCount = new Map<string, number>();
  for (const q of data.questions) {
    themeCats.set(q.t, q.cat);
    themeCount.set(q.t, (themeCount.get(q.t) ?? 0) + 1);
  }
  const ulThemes = el('ul', 'theme-cols');
  for (const [slug, cat] of themeCats) {
    ulThemes.append(el('li', undefined, `${cat} (${themeCount.get(slug)})`));
  }
  root.append(ulThemes);

  /* escala */
  root.append(el('h2', undefined, 'La escala'));
  const pScale = el('p');
  pScale.append(
    'Cada pregunta se responde en una escala de 5 posturas: muy en desacuerdo (1), en desacuerdo (2), neutral (3), de acuerdo (4) y muy de acuerdo (5). Los partidos están posicionados en la misma escala, así que tus respuestas y las suyas son directamente comparables.',
  );
  root.append(pScale);

  /* algoritmo */
  root.append(el('h2', undefined, 'El algoritmo de afinidad'));
  const pAlg1 = el('p');
  pAlg1.append(
    'Para cada pregunta comparamos tu postura con la del partido. La diferencia se penaliza al cuadrado: discrepar mucho pesa bastante más que discrepar un poco.',
  );
  root.append(pAlg1);
  const pAlg2 = el('p');
  pAlg2.append(
    'Tus convicciones también pesan: si respondes en los extremos (muy de acuerdo o muy en desacuerdo), esa pregunta cuenta el doble que si respondes neutral, porque expresa una posición más firme. La importancia de cada pregunta es fija (3 sobre 3) y la confianza de las fuentes también (v1). El porcentaje es la suma de puntos obtenidos frente al máximo posible.',
  );
  root.append(pAlg2);
  root.append(
    el(
      'p',
      'formula',
      'afinidad % = Σ(base · peso) / Σ(16 · peso) · 100    con base = (4 − |tú − partido|)²',
    ),
  );
  const pAlg3 = el('p', 'muted');
  pAlg3.append(
    'El algoritmo reproduce la metodología pública de afinidadpolitica.es y ha sido verificado 15/15 contra su sitio.',
  );
  root.append(pAlg3);

  /* brújula */
  root.append(el('h2', undefined, 'La brújula'));
  const pComp1 = el('p');
  pComp1.append(
    'La brújula sitúa tus respuestas en dos ejes de −100 a +100: el económico (izquierda ↔ derecha) y el social (progresista ↔ conservador). Cada pregunta tiene una polaridad precomputada según si, al estar a favor de ella, te acercas a las posiciones de los partidos de referencia de un lado o del otro. Tu puntuación en cada pregunta es tu postura reescalada, y el eje es el promedio de todas las preguntas que puntúan en él.',
  );
  root.append(pComp1);
  root.append(el('p', 'formula', 'eje = promedio de  (3 − tu respuesta) / 2 · 100 · polaridad'));
  const econCats = new Set<string>();
  const socCats = new Set<string>();
  for (const q of data.questions) {
    if (q.pe !== 0) econCats.add(q.cat);
    if (q.ps !== 0) socCats.add(q.cat);
  }
  const pComp2 = el('p');
  pComp2.append(
    `Puntúan el eje económico: ${[...econCats].join(', ')}. Puntúan el eje social: ${[...socCats].join(', ')}.`,
  );
  root.append(pComp2);

  /* perfil */
  root.append(el('h2', undefined, 'El perfil: cómo te afecta a ti'));
  const pProf = el('p');
  pProf.append(
    'Si rellenas el perfil opcional, el test recalcula tu ranking usando solo las preguntas de los temas que te tocan de cerca según tu situación:',
  );
  root.append(pProf);
  const table = el('table', 'map-table');
  const thead = el('thead');
  const hrow = el('tr');
  hrow.append(el('th', undefined, 'Si eres…'));
  hrow.append(el('th', undefined, 'Puntúan los temas de…'));
  thead.append(hrow);
  table.append(thead);
  const tbody = el('tbody');
  const mapping: Array<[string, string]> = [
    ['Inquilino', 'Vivienda'],
    ['Con hipoteca', 'Vivienda + Economía y Fiscalidad'],
    ['Propietario sin hipoteca', 'Vivienda'],
    ['En casa de familia', 'Vivienda'],
    ['Asalariado', 'Empleo y Trabajo + Pensiones y Bienestar'],
    ['Autónomo', 'Economía y Fiscalidad + Empleo y Trabajo'],
    ['Pensionista', 'Pensiones y Bienestar + Educación y Sanidad'],
    ['Estudiante', 'Educación y Sanidad + Empleo y Trabajo'],
    ['En paro', 'Empleo y Trabajo + Pensiones y Bienestar'],
    ['Con hijos menores', 'Educación y Sanidad'],
  ];
  for (const [who, what] of mapping) {
    const tr = el('tr');
    tr.append(el('td', undefined, who), el('td', undefined, what));
    tbody.append(tr);
  }
  table.append(tbody);
  root.append(table);

  /* fuentes y crédito */
  root.append(el('h2', undefined, 'Fuentes y crédito'));
  const box = el('div', 'credit-box');
  const boxP = el('p');
  boxP.append('Matriz de posiciones: ');
  const a = el('a', undefined, 'afinidadpolitica.es');
  a.href = 'https://www.afinidadpolitica.es/metodologia';
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  boxP.append(
    a,
    ' (revisión de octubre de 2026), que documenta cada posición con su fuente original. Algoritmo de afinidad reproducido con su metodología pública.',
  );
  box.append(boxP);
  const boxP2 = el('p');
  boxP2.style.marginTop = '0.6rem';
  boxP2.append(
    'Algunas posiciones carecen de fuente directa y se marcan como «estimada»: se infieren de declaraciones o programas públicos. Las demás enlazan su documento original.',
  );
  box.append(boxP2);
  root.append(box);
  root.append(
    el('p', 'muted', 'Datos con revisión del 23/10/2026; los programas del 29-N aún no habían sido publicados.'),
  );

  /* privacidad */
  root.append(el('h2', undefined, 'Privacidad'));
  root.append(
    el(
      'p',
      undefined,
      'El test funciona entero en tu navegador: no hay registro, ni cookies de rastreo, ni servidor que reciba tus respuestas. El progreso se guarda solo en tu navegador (localStorage) y los enlaces compartidos codifican únicamente tus respuestas y tu perfil opcional en la propia URL.',
    ),
  );

  return root;
}
