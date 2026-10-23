import type { AppCtx } from './ui';
import { LIKERT_OPTIONS, el } from './ui';
import { affectedThemes, questionAffectsYou } from '../lib/compass';
import type { Housing, Work } from '../lib/types';

export function renderTest(ctx: AppCtx): HTMLElement {
  const root = el('div');
  const questions = ctx.data.questions;
  const total = questions.length;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let idx = 0;
  for (let i = 0; i < total; i++) {
    if (!ctx.answers.has(questions[i].id)) {
      idx = i;
      break;
    }
  }

  renderProfile();
  return root;

  /* ---------- phase A: profile ---------- */

  function renderProfile(): void {
    root.replaceChildren();
    const sec = el('section');
    sec.append(el('p', 'kicker', 'Test electoral · 29-N'));
    const h1 = el('h1', undefined, 'Antes de empezar');
    h1.tabIndex = -1;
    sec.append(h1);
    sec.append(
      el(
        'p',
        'lede form-lead',
        'Cuatro datos opcionales para poder decirte cómo te afectan las propuestas a ti. Puedes contestar solo algunos, o ninguno.',
      ),
    );

    const form = el('form');
    form.noValidate = true;

    // Comunidad
    const fsRegion = el('fieldset', 'fieldset');
    const lgRegion = el('legend', 'legend');
    lgRegion.append('Comunidad autónoma ');
    lgRegion.append(el('small', undefined, '(donde votas)'));
    const sel = el('select', 'select');
    sel.name = 'region';
    const optNone = el('option', undefined, 'Elige comunidad (opcional)');
    optNone.value = '';
    sel.append(optNone);
    for (const [code, label] of ctx.data.regions) {
      const o = el('option', undefined, label);
      o.value = code;
      sel.append(o);
    }
    sel.value = ctx.profile.region;
    fsRegion.append(lgRegion, sel);
    form.append(fsRegion);

    // Vivienda / Trabajo / Hijos
    form.append(radioGroup('housing', 'Situación de vivienda', [
      ['inquilino', 'Inquilino'],
      ['hipoteca', 'Con hipoteca'],
      ['propietario', 'Propietario sin hipoteca'],
      ['familiar', 'En casa de familia'],
    ] as Array<[Housing, string]>, ctx.profile.housing));

    form.append(radioGroup('work', 'Situación laboral', [
      ['asalariado', 'Asalariado'],
      ['autonomo', 'Autónomo'],
      ['pensionista', 'Pensionista'],
      ['estudiante', 'Estudiante'],
      ['desempleado', 'En paro'],
    ] as Array<[Work, string]>, ctx.profile.work));

    form.append(radioGroup('kids', 'Hijos menores a cargo', [
      ['1', 'Sí'],
      ['0', 'No'],
    ], ctx.profile.kids === 1 ? '1' : ''));

    const actions = el('div', 'form-actions');
    const skip = el('button', 'btn btn-quiet', 'Saltar');
    skip.type = 'button';
    skip.addEventListener('click', () => startQuestions());
    const go = el('button', 'btn btn-primary', 'Empezar');
    go.type = 'submit';
    actions.append(skip, go);
    form.append(actions);

    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      ctx.profile.region = sel.value;
      const fd = new FormData(form);
      ctx.profile.housing = (String(fd.get('housing') ?? '') || '') as Housing;
      ctx.profile.work = (String(fd.get('work') ?? '') || '') as Work;
      ctx.profile.kids = fd.get('kids') === '1' ? 1 : 0;
      ctx.saveProfile();
      startQuestions();
    });

    sec.append(form);
    root.append(sec);
    sec.querySelector('h1')?.focus({ preventScroll: true });
  }

  function radioGroup<T extends string>(
    name: string,
    label: string,
    options: ReadonlyArray<readonly [T, string]>,
    current: string,
  ): HTMLElement {
    const fs = el('fieldset', 'fieldset');
    const lg = el('legend', 'legend');
    lg.append(label, ' ', el('small', undefined, '(opcional)'));
    const group = el('div', 'opt-group');
    for (const [value, text] of options) {
      const lab = el('label', 'opt');
      const input = el('input');
      input.type = 'radio';
      input.name = name;
      input.value = value;
      if (current === value) input.checked = true;
      lab.append(input, text);
      group.append(lab);
    }
    fs.append(lg, group);
    return fs;
  }

  /* ---------- phase B: questions ---------- */

  function startQuestions(): void {
    const themes = affectedThemes(ctx.profile);
    root.replaceChildren();

    const topbar = el('div', 'q-topbar');
    const back = el('button', 'btn btn-ghost btn-back', 'Atrás');
    back.type = 'button';
    back.setAttribute('aria-label', 'Pregunta anterior');
    const progress = el('div', 'progress');
    const fill = el('div', 'progress-fill');
    progress.append(fill);
    const count = el('span', 'q-count');
    topbar.append(back, progress, count);
    root.append(topbar);

    const card = el('div', 'q-card');
    card.setAttribute('aria-live', 'polite');
    root.append(card);

    const hint = el('p', 'kbd-hint');
    hint.append('También puedes responder con las teclas ');
    hint.append(el('kbd', undefined, '1'), '–', el('kbd', undefined, '5'));
    root.append(hint);

    function updateTopbar(): void {
      fill.style.width = `${((idx + 1) / total) * 100}%`;
      count.textContent = `${idx + 1} de ${total}`;
      back.style.visibility = idx === 0 ? 'hidden' : 'visible';
    }

    function paint(dir: 1 | -1 | 0): void {
      const q = questions[idx];
      card.replaceChildren();

      const meta = el('div', 'q-meta');
      meta.append(el('span', 'chip', q.cat));
      if (questionAffectsYou(q, themes)) {
        meta.append(el('span', 'badge-you', 'Te afecta'));
      }
      card.append(meta);

      const h = el('h2', 'q-statement', q.text);
      h.tabIndex = -1;
      card.append(h);
      card.append(el('p', 'q-expl', q.expl));

      const likert = el('div', 'likert');
      likert.setAttribute('role', 'group');
      likert.setAttribute('aria-label', 'Tu postura');
      for (const [value, label] of LIKERT_OPTIONS) {
        const b = el('button', 'likert-btn');
        b.type = 'button';
        const prev = ctx.answers.get(q.id);
        if (prev === value) b.setAttribute('aria-pressed', 'true');
        b.setAttribute('aria-label', `${label} (${value} de 5)`);
        const knum = el('span', 'knum', String(value));
        b.append(knum, el('span', undefined, label));
        b.addEventListener('click', () => answer(value));
        likert.append(b);
      }
      card.append(likert);
      updateTopbar();

      card.classList.remove('q-in-r', 'q-in-l');
      if (dir !== 0) {
        void card.offsetWidth; /* restart animation */
        card.classList.add(dir === 1 ? 'q-in-r' : 'q-in-l');
      }
      h.focus({ preventScroll: true });
      window.scrollTo(0, 0);
    }

    function answer(value: number): void {
      const q = questions[idx];
      ctx.answers.set(q.id, value);
      ctx.saveAnswers();
      if (idx === total - 1) {
        ctx.go('#/resultados');
        return;
      }
      if (reduceMotion) {
        idx++;
        paint(1);
        return;
      }
      card.classList.add('q-out');
      window.setTimeout(() => {
        idx++;
        card.classList.remove('q-out');
        paint(1);
      }, 150);
    }

    back.addEventListener('click', () => {
      if (reduceMotion || idx === 0) {
        if (idx > 0) {
          idx--;
          paint(-1);
        }
        return;
      }
      card.classList.add('q-out');
      window.setTimeout(() => {
        idx--;
        card.classList.remove('q-out');
        paint(-1);
      }, 150);
    });

    const onKey = (ev: KeyboardEvent): void => {
      if (ev.metaKey || ev.ctrlKey || ev.altKey) return;
      const t = ev.target as HTMLElement | null;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA')) return;
      const v = Number(ev.key);
      if (v >= 1 && v <= 5) {
        ev.preventDefault();
        const btns = card.querySelectorAll<HTMLButtonElement>('.likert-btn');
        btns[v - 1]?.click();
      }
    };
    document.addEventListener('keydown', onKey);
    ctx.onTeardown(() => document.removeEventListener('keydown', onKey));

    paint(0);
  }
}
