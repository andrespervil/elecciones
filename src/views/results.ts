import type { Dataset, Position, Profile, Question } from '../lib/types';
import { LIKERT_WORD, el, fmtPct } from './ui';
import { agreementsDisagreements, ranking } from '../lib/affinity';
import type { RankedParty } from '../lib/affinity';
import { affectedThemes, compass } from '../lib/compass';
import type { Compass } from '../lib/compass';
import { encodeShare } from '../lib/share';

export interface ResultsOpts {
  onSetRegion?: (code: string) => void;
  onReset?: () => void;
}

export function renderResults(
  data: Dataset,
  answers: Map<number, number>,
  profile: Profile,
  opts: ResultsOpts,
): HTMLElement {
  const root = el('div');
  const slugs = Object.keys(data.parties);
  const globalRank = ranking(answers, data.questions, slugs);
  const comp = compass(answers, data.questions);
  const themes = affectedThemes(profile);

  const head = el('header');
  head.append(el('p', 'kicker', 'Test electoral · 29-N'));
  head.append(el('h1', undefined, 'Tus resultados'));
  root.append(head);
  if (answers.size < data.questions.length) {
    const n = el(
      'p',
      'notice',
      `Resultados calculados con ${answers.size} de ${data.questions.length} respuestas.`,
    );
    root.append(n);
  }

  root.append(sectionRanking(globalRank, data));
  root.append(sectionBallot(globalRank, data, profile, opts));
  root.append(sectionAffected(globalRank, data, answers, themes));
  root.append(sectionCompass(comp));
  root.append(sectionCompare(globalRank, data, answers));
  root.append(sectionShare(data, answers, profile, globalRank, opts));
  root.append(
    el(
      'p',
      'disclaimer',
      'Resultado orientativo, no es una recomendación de voto. Las posiciones proceden de fuentes públicas enlazadas; las estimadas se marcan como tales.',
    ),
  );
  return root;
}

/* ---------- 1 · ranking general ---------- */

function sectionRanking(rank: RankedParty[], data: Dataset): HTMLElement {
  const sec = el('section', 'section');
  const head = el('div', 'section-head');
  head.append(el('h2', undefined, 'Tus partidos más cercanos'));
  sec.append(head);

  const podium = el('div', 'podium');
  const top3 = rank.slice(0, 3);
  top3.forEach((rp, i) => {
    const p = data.parties[rp.slug];
    const card = el('div', `pod-card pod-${i + 1}`);
    card.append(el('span', 'pod-rank', `${i + 1}.º`));
    const line = el('div', 'pod-line');
    const dot = el('span', 'dot');
    dot.style.background = p.color;
    dot.setAttribute('aria-hidden', 'true');
    line.append(dot, p.name);
    card.append(line, el('div', 'pod-pct', fmtPct(rp.pct)));
    podium.append(card);
  });
  sec.append(podium);
  sec.append(barList(rank.slice(3), data));
  return sec;
}

function barList(rank: RankedParty[], data: Dataset, startIndex = 0): HTMLElement {
  const list = el('div', 'bar-list');
  rank.forEach((rp, i) => list.append(barRow(startIndex + i + 1, rp, data)));
  return list;
}

function barRow(pos: number, rp: RankedParty, data: Dataset): HTMLElement {
  const p = data.parties[rp.slug];
  const row = el('div', 'bar-row');
  const label = el('div', 'bar-label');
  const dot = el('span', 'dot');
  dot.style.background = p.color;
  dot.setAttribute('aria-hidden', 'true');
  label.append(el('span', 'bar-pos', `${pos}.`), dot, el('span', 'bar-name', p.name));
  label.append(el('span', 'bar-pct', fmtPct(rp.pct)));
  const track = el('div', 'bar-track');
  const fill = el('div', 'bar-fill');
  fill.style.width = `${rp.pct.toFixed(1)}%`;
  fill.style.background = p.color;
  track.append(fill);
  row.append(label, track);
  return row;
}

/* ---------- 2 · papeleta en tu comunidad ---------- */

function sectionBallot(
  rank: RankedParty[],
  data: Dataset,
  profile: Profile,
  opts: ResultsOpts,
): HTMLElement {
  const sec = el('section', 'section');
  const head = el('div', 'section-head');
  head.append(el('h2', undefined, 'Los que puedes votar'));
  sec.append(head);

  if (!profile.region) {
    if (!opts.onSetRegion) return sec;
    const picker = el('div', 'inline-picker');
    picker.append(el('p', undefined, '¿En qué comunidad votas? Elige para ver tu papeleta.'));
    const sel = el('select', 'select');
    const optNone = el('option', undefined, 'Elige comunidad');
    optNone.value = '';
    sel.append(optNone);
    for (const [code, label] of data.regions) {
      const o = el('option', undefined, label);
      o.value = code;
      sel.append(o);
    }
    sel.addEventListener('change', () => {
      if (sel.value) opts.onSetRegion?.(sel.value);
    });
    picker.append(sel);
    sec.append(picker);
    return sec;
  }

  const regionLabel = data.regions.find(([code]) => code === profile.region)?.[1] ?? '';
  sec.append(
    el(
      'p',
      'section-note',
      `Papeletas con carrera en ${regionLabel}. Los partidos regionalistas solo se presentan en sus comunidades; el resto, en casi todas.`,
    ),
  );
  const ballot = rank.filter((rp) => data.parties[rp.slug].regions.includes(profile.region));
  sec.append(barList(ballot, data));
  return sec;
}

/* ---------- 3 · cómo te afecta a ti ---------- */

function sectionAffected(
  globalRank: RankedParty[],
  data: Dataset,
  answers: Map<number, number>,
  themes: Set<string>,
): HTMLElement {
  if (themes.size === 0) return el('span');

  const qs = data.questions.filter((q) => themes.has(q.t));
  const slugs = Object.keys(data.parties);
  const rank = ranking(answers, qs, slugs);
  const globalPos = new Map<string, number>();
  globalRank.forEach((rp, i) => globalPos.set(rp.slug, i));

  const catLabel = new Map<string, string>();
  for (const q of data.questions) if (!catLabel.has(q.t)) catLabel.set(q.t, q.cat);
  const cats = [...themes].map((t) => catLabel.get(t) ?? t).sort();

  const sec = el('section', 'section');
  const head = el('div', 'section-head');
  head.append(el('h2', undefined, 'Por lo que te afecta a ti'));
  sec.append(head);
  sec.append(
    el(
      'p',
      'section-note',
      `Calculado solo sobre las preguntas de ${cats.join(' y ')} (${qs.length} de ${data.questions.length}).`,
    ),
  );

  const list = el('div', 'aff-list');
  rank.forEach((rp, i) => {
    const p = data.parties[rp.slug];
    const row = el('div', 'aff-row');
    const gp = globalPos.get(rp.slug);
    let arrow: HTMLElement;
    if (gp === undefined) {
      arrow = el('span', 'aff-arrow up tag-nuevo', 'nuevo');
      arrow.setAttribute('role', 'img');
      arrow.setAttribute('aria-label', 'Nuevo en esta lista');
    } else {
      const delta = gp - i;
      if (delta > 0) {
        arrow = el('span', 'aff-arrow up', '▲');
        arrow.setAttribute('role', 'img');
        arrow.setAttribute('aria-label', `Sube ${delta} puestos respecto al general`);
      } else if (delta < 0) {
        arrow = el('span', 'aff-arrow down', '▼');
        arrow.setAttribute('role', 'img');
        arrow.setAttribute('aria-label', `Baja ${-delta} puestos respecto al general`);
      } else {
        arrow = el('span', 'aff-arrow same', '=');
        arrow.setAttribute('role', 'img');
        arrow.setAttribute('aria-label', 'Sin cambios respecto al general');
      }
    }
    const dot = el('span', 'dot');
    dot.style.background = p.color;
    dot.setAttribute('aria-hidden', 'true');
    row.append(el('span', 'bar-pos', `${i + 1}.`), arrow, dot);
    row.append(el('span', 'aff-name', p.name));
    row.append(el('span', 'aff-pct', fmtPct(rp.pct)));
    list.append(row);
  });
  sec.append(list);
  return sec;
}

/* ---------- 4 · brújula ---------- */

function sectionCompass(comp: Compass): HTMLElement {
  const sec = el('section', 'section');
  const head = el('div', 'section-head');
  head.append(el('h2', undefined, 'Tu brújula'));
  sec.append(head);
  sec.append(
    el(
      'p',
      'section-note',
      'Posición media según la polaridad de cada pregunta, de −100 a +100 en cada eje.',
    ),
  );

  const wrap = el('div', 'compass-wrap');
  wrap.innerHTML = compassSvg(comp);
  sec.append(wrap);
  sec.append(
    el(
      'p',
      'compass-caption',
      `Eje económico ${signed(comp.econ)} · Eje social ${signed(comp.social)}`,
    ),
  );
  return sec;
}

function signed(n: number): string {
  const r = Math.round(n);
  return r > 0 ? `+${r}` : String(r);
}

function compassSvg(c: Compass): string {
  const clamp = (n: number): number => Math.max(-92, Math.min(92, n));
  const cx = 100 + clamp(c.econ);
  const cy = 100 - clamp(c.social);
  const labelRight = cx <= 136;
  const lx = labelRight ? cx + 9 : cx - 9;
  const ly = Math.max(14, Math.min(190, cy - 9));
  const anchor = labelRight ? 'start' : 'end';
  const sans = `font-family="var(--sans)" font-size="8.5" letter-spacing="1" fill="var(--muted)"`;
  return `<svg viewBox="0 0 200 200" role="img" aria-label="Brújula política: eje económico de izquierda a derecha y eje social de progresista a conservador. Tu posición es ${signed(
    c.econ,
  )} en economía y ${signed(c.social)} en sociedad.">
  <rect x="1.5" y="1.5" width="197" height="197" rx="14" fill="var(--raised)" stroke="var(--line)"/>
  <g stroke="var(--line)" stroke-width="0.75" stroke-dasharray="2 3">
    <line x1="50" y1="10" x2="50" y2="190"/>
    <line x1="150" y1="10" x2="150" y2="190"/>
    <line x1="10" y1="50" x2="190" y2="50"/>
    <line x1="10" y1="150" x2="190" y2="150"/>
  </g>
  <g stroke="var(--line-strong)" stroke-width="1">
    <line x1="100" y1="10" x2="100" y2="190"/>
    <line x1="10" y1="100" x2="190" y2="100"/>
  </g>
  <text x="100" y="22" text-anchor="middle" ${sans}>CONSERVADOR</text>
  <text x="100" y="190" text-anchor="middle" ${sans}>PROGRESISTA</text>
  <text x="14" y="100" text-anchor="middle" transform="rotate(-90 14 100)" ${sans}>IZQUIERDA</text>
  <text x="186" y="100" text-anchor="middle" transform="rotate(90 186 100)" ${sans}>DERECHA</text>
  <circle cx="${cx}" cy="${cy}" r="5.5" fill="var(--accent-strong)" stroke="var(--surf)" stroke-width="2"/>
  <text x="${lx}" y="${ly}" text-anchor="${anchor}" font-family="var(--sans)" font-size="11" font-weight="600" fill="var(--ink)">Tú</text>
</svg>`;
}

/* ---------- 5 · comparativa partido a partido ---------- */

function sectionCompare(
  rank: RankedParty[],
  data: Dataset,
  answers: Map<number, number>,
): HTMLElement {
  const sec = el('section', 'section');
  const head = el('div', 'section-head');
  head.append(el('h2', undefined, 'Comparativa partido a partido'));
  sec.append(head);
  sec.append(
    el(
      'p',
      'section-note',
      'Despliega cada partido para ver en qué coincidís y en qué diferís, pregunta a pregunta, con su fuente.',
    ),
  );

  rank.forEach((rp, i) => {
    const p = data.parties[rp.slug];
    const details = el('details', 'party-item');
    if (i < 3) details.open = true;
    const summary = el('summary');
    const dot = el('span', 'dot');
    dot.style.background = p.color;
    dot.setAttribute('aria-hidden', 'true');
    summary.append(dot, p.name);
    summary.append(el('span', 'party-pct', `${i + 1}.º · ${fmtPct(rp.pct)}`));
    summary.append(el('span', 'chev'));
    details.append(summary);

    const body = el('div', 'party-body');
    const { agree, differ } = agreementsDisagreements(rp.slug, answers, data.questions);
    body.append(qaGroup('Coincidís en', agree, rp.slug, answers));
    body.append(qaGroup('Diferís en', differ, rp.slug, answers));
    details.append(body);
    sec.append(details);
  });
  return sec;
}

function qaGroup(
  title: string,
  questions: Question[],
  party: string,
  answers: Map<number, number>,
): HTMLElement {
  const g = el('div', 'qa-group');
  g.append(el('h4', undefined, title));
  if (questions.length === 0) {
    g.append(
      el(
        'p',
        'empty',
        title.startsWith('Coincid') ? 'Sin coincidencias exactas.' : 'Sin diferencias grandes.',
      ),
    );
    return g;
  }
  for (const q of questions) {
    const pos = q.pos[party];
    const user = answers.get(q.id);
    if (!pos || user === undefined) continue;
    const row = el('details', 'qa-row');
    const summary = el('summary');
    summary.append(el('span', 'qa-text', q.text));
    const chips = el('div', 'qa-chips');
    const chipYou = el('span', 'val-chip you');
    chipYou.append(el('span', 'who', 'Tú'), LIKERT_WORD[user]);
    const chipParty = el('span', 'val-chip');
    chipParty.append(el('span', 'who', 'Partido'), LIKERT_WORD[pos.v]);
    chips.append(chipYou, chipParty);
    summary.append(chips, el('span', 'chev'));
    row.append(summary);

    const detail = el('div', 'qa-detail');
    detail.append(el('span', undefined, q.expl));
    detail.append(sourceLine(pos));
    row.append(detail);
    g.append(row);
  }
  return g;
}

function sourceLine(pos: Position): HTMLElement {
  const p = el('p', 'source-line');
  if (pos.s) {
    p.append('Fuente: ');
    const a = el('a', undefined, pos.st ?? pos.s);
    a.href = pos.s;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    p.append(a);
    if (pos.e === 1) p.append(el('span', 'badge-est', 'estimada'));
  } else {
    p.append('Posición estimada');
    p.append(el('span', 'badge-est', 'estimada'));
    p.append(' — sin fuente directa, inferida de fuentes públicas.');
  }
  return p;
}

/* ---------- 6 · compartir ---------- */

function sectionShare(
  data: Dataset,
  answers: Map<number, number>,
  profile: Profile,
  rank: RankedParty[],
  opts: ResultsOpts,
): HTMLElement {
  const sec = el('section', 'section');
  const card = el('div', 'share-card');
  card.append(el('h2', undefined, 'Comparte tus resultados'));
  card.append(
    el(
      'p',
      'section-note',
      'El enlace guarda solo tus respuestas y tu perfil opcional, codificados en la propia URL. Nada se envía a ningún servidor.',
    ),
  );

  const questionIds = data.questions.map((q) => q.id).sort((a, b) => a - b);
  const url =
    location.origin + location.pathname + '#/r/' + encodeShare(answers, questionIds, profile, true);
  const top = rank[0];
  const text = `Mi test electoral del 29-N: mi partido más cercano es ${top ? data.parties[top.slug].name : '?'}${
    top ? ` (${fmtPct(top.pct)})` : ''
  }. ¿Cuál es el tuyo?`;

  const row = el('div', 'btn-row');
  const copy = el('button', 'btn btn-primary', 'Copiar enlace');
  copy.type = 'button';
  copy.addEventListener('click', async () => {
    let ok = false;
    try {
      await navigator.clipboard.writeText(url);
      ok = true;
    } catch {
      const ta = document.createElement('textarea');
      ta.value = url;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.append(ta);
      ta.select();
      try {
        ok = document.execCommand('copy');
      } catch {
        ok = false;
      }
      ta.remove();
    }
    copy.textContent = ok ? 'Enlace copiado' : 'No se pudo copiar';
    window.setTimeout(() => {
      copy.textContent = 'Copiar enlace';
    }, 2200);
  });
  row.append(copy);

  const wa = el('a', 'btn btn-ghost', 'WhatsApp');
  wa.href = `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`;
  wa.target = '_blank';
  wa.rel = 'noopener noreferrer';
  row.append(wa);

  const x = el('a', 'btn btn-ghost', 'Compartir en X');
  x.href = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  x.target = '_blank';
  x.rel = 'noopener noreferrer';
  row.append(x);

  if (opts.onReset) {
    const again = el('button', 'btn btn-quiet', 'Empezar de nuevo');
    again.type = 'button';
    again.addEventListener('click', () => opts.onReset?.());
    row.append(again);
  }
  card.append(row);
  sec.append(card);
  return sec;
}
