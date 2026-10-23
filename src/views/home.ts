import type { AppCtx } from './ui';
import { el } from './ui';

export function renderHome(ctx: AppCtx): HTMLElement {
  const root = el('div');
  const n = ctx.data.meta;

  const hero = el('div', 'hero');
  hero.append(el('p', 'kicker', 'Elecciones generales · 29 de noviembre de 2026'));
  hero.append(el('h1', undefined, '¿A quién votar el 29-N?'));
  const lede = el(
    'p',
    'lede',
    'Responde al test y descubre qué partidos se parecen más a tus ideas, qué puedes votar en tu comunidad y cómo te afectan las propuestas según tu situación.',
  );
  hero.append(lede);

  const meta = el('div', 'hero-meta');
  const items: Array<[string, string]> = [
    [String(n.nQuestions), 'preguntas'],
    [String(n.nParties), 'partidos'],
    ['Sí', 'fuentes enlazadas'],
    ['Sí', 'cómo te afecta a ti'],
  ];
  for (const [num, label] of items) {
    const s = el('span');
    s.append(el('span', 'n', num), label);
    meta.append(s);
  }
  hero.append(meta);

  const cta = el('div', 'btn-row hero-cta');
  const start = el('a', 'btn btn-primary', 'Empezar el test');
  start.href = '#/test';
  cta.append(start);
  if (ctx.answers.size >= ctx.questionIds.length) {
    const see = el('a', 'btn btn-ghost', 'Ver mis resultados');
    see.href = '#/resultados';
    cta.append(see);
  }
  hero.append(cta);
  root.append(hero);

  const steps = el('section', 'section');
  steps.append(el('h2', undefined, 'Cómo funciona'));
  const ol = el('ol', 'steps');
  const stepsData: Array<[string, string]> = [
    [
      'Responde',
      `${n.nQuestions} afirmaciones sobre ${ctx.data.themes.length} temas, de «muy en desacuerdo» a «muy de acuerdo». Unos 7 minutos.`,
    ],
    [
      'Comparamos',
      `Tus respuestas se comparan con las posiciones verificadas de ${n.nParties} partidos, cada una con su fuente pública enlazada.`,
    ],
    [
      'Descubres',
      'Tu ranking de afinidad, tu brújula política y —si quieres— qué partidos te convienen según tu vivienda, tu trabajo o tus hijos.',
    ],
  ];
  for (const [t, d] of stepsData) {
    const li = el('li');
    li.append(el('span', 'num'));
    const body = el('div');
    body.append(el('h3', undefined, t));
    body.append(el('p', undefined, d));
    li.append(body);
    ol.append(li);
  }
  steps.append(ol);
  root.append(steps);

  const credit = el('section', 'section');
  credit.append(el('h2', undefined, 'De dónde salen los datos'));
  const creditP = el('p', 'credit-note');
  creditP.append('Matriz de posiciones de ');
  const a = el('a', undefined, 'afinidadpolitica.es');
  a.href = 'https://www.afinidadpolitica.es';
  a.target = '_blank';
  a.rel = 'noopener noreferrer';
  creditP.append(
    a,
    ` (revisión de octubre de 2026), que documenta cada posición de cada partido con su fuente original. El algoritmo de afinidad reproduce su metodología pública. Ver la `,
  );
  const metLink = el('a', undefined, 'metodología');
  metLink.href = '#/metodologia';
  creditP.append(metLink, '.');
  credit.append(creditP);
  root.append(credit);

  return root;
}
