import './styles.css';
import datasetJson from './data/dataset.json';
import type { Dataset, Profile } from './lib/types';
import { EMPTY_PROFILE } from './lib/types';
import type { AppCtx } from './views/ui';
import { el } from './views/ui';
import { renderHome } from './views/home';
import { renderTest } from './views/test';
import { renderResults } from './views/results';
import { renderMethodology } from './views/methodology';
import { renderShared } from './views/shared';

const data = datasetJson as unknown as Dataset;
const questionIds = data.questions.map((q) => q.id).sort((a, b) => a - b);

const LS_ANSWERS = 'elecciones.answers';
const LS_PROFILE = 'elecciones.profile';
const HOUSING = new Set(['inquilino', 'hipoteca', 'propietario', 'familiar']);
const WORK = new Set(['asalariado', 'autonomo', 'pensionista', 'estudiante', 'desempleado']);

function loadAnswers(): Map<number, number> {
  const m = new Map<number, number>();
  try {
    const raw = localStorage.getItem(LS_ANSWERS);
    if (!raw) return m;
    const obj = JSON.parse(raw) as Record<string, unknown>;
    for (const q of data.questions) {
      const v = Number(obj[String(q.id)]);
      if (Number.isInteger(v) && v >= 1 && v <= 5) m.set(q.id, v);
    }
  } catch {
    /* storage unavailable or corrupt — start fresh */
  }
  return m;
}

function loadProfile(): Profile {
  try {
    const raw = localStorage.getItem(LS_PROFILE);
    if (!raw) return { ...EMPTY_PROFILE };
    const p = JSON.parse(raw) as Partial<Profile>;
    return {
      region: typeof p.region === 'string' ? p.region : '',
      housing: typeof p.housing === 'string' && HOUSING.has(p.housing) ? p.housing : '',
      work: typeof p.work === 'string' && WORK.has(p.work) ? p.work : '',
      kids: p.kids === 1 ? 1 : 0,
    };
  } catch {
    return { ...EMPTY_PROFILE };
  }
}

const answers = loadAnswers();
const profile = loadProfile();

let teardowns: Array<() => void> = [];

const ctx: AppCtx = {
  data,
  answers,
  profile,
  questionIds,
  saveAnswers() {
    try {
      const obj: Record<string, number> = {};
      for (const [id, v] of answers) obj[String(id)] = v;
      localStorage.setItem(LS_ANSWERS, JSON.stringify(obj));
    } catch {
      /* private mode — session-only progress */
    }
  },
  saveProfile() {
    try {
      localStorage.setItem(LS_PROFILE, JSON.stringify(profile));
    } catch {
      /* ignore */
    }
  },
  reset() {
    answers.clear();
    Object.assign(profile, EMPTY_PROFILE);
    try {
      localStorage.removeItem(LS_ANSWERS);
      localStorage.removeItem(LS_PROFILE);
    } catch {
      /* ignore */
    }
  },
  go(hash: string) {
    if (location.hash === hash) renderRoute();
    else location.hash = hash;
  },
  onTeardown(fn) {
    teardowns.push(fn);
  },
};

function renderOwnResults(): HTMLElement {
  if (answers.size === 0) {
    location.hash = '#/';
    return el('div');
  }
  const root = el('div');
  const build = () => {
    root.replaceChildren(
      renderResults(data, answers, profile, {
        onSetRegion(code) {
          profile.region = code;
          ctx.saveProfile();
          build();
        },
        onReset() {
          if (window.confirm('Esto borrará tus respuestas guardadas. ¿Empezar de nuevo?')) {
            ctx.reset();
            ctx.go('#/');
          }
        },
      }),
    );
  };
  build();
  return root;
}

function renderRoute() {
  for (const fn of teardowns) fn();
  teardowns = [];
  const hash = location.hash || '#/';
  const view = el('div');
  view.className = 'view-main';
  let node: HTMLElement;
  if (hash.startsWith('#/r/')) {
    node = renderShared(ctx, decodeURIComponent(hash.slice(4)));
  } else if (hash === '#/test') {
    node = renderTest(ctx);
  } else if (hash === '#/resultados') {
    node = renderOwnResults();
  } else if (hash === '#/metodologia') {
    node = renderMethodology(ctx);
  } else {
    node = renderHome(ctx);
  }
  window.scrollTo(0, 0);
  const main = document.getElementById('view')!;
  view.append(node);
  view.classList.add('route-enter');
  main.replaceChildren(view);
}

function boot() {
  const app = document.getElementById('app')!;

  const head = el('header', 'site-head');
  const headWrap = el('div', 'wrap');
  const brand = el('a', 'brand');
  brand.href = '#/';
  brand.append('Elecciones ', el('em', undefined, '· 29-N'));
  const nav = el('nav', 'site-nav');
  const navTest = el('a', undefined, 'El test');
  navTest.href = '#/test';
  const navMet = el('a', undefined, 'Metodología');
  navMet.href = '#/metodologia';
  nav.append(navTest, navMet);
  headWrap.append(brand, nav);
  head.append(headWrap);

  const main = el('main');
  main.id = 'view';

  const foot = el('footer', 'site-foot');
  const footWrap = el('div', 'wrap');
  const footData = el('p');
  footData.append('Datos: matriz de posiciones de ');
  const footLink = el('a', undefined, 'afinidadpolitica.es');
  footLink.href = 'https://www.afinidadpolitica.es';
  footLink.target = '_blank';
  footLink.rel = 'noopener noreferrer';
  footData.append(footLink, ' (revisión oct-2026) · ');
  const footMet = el('a', undefined, 'Metodología');
  footMet.href = '#/metodologia';
  footData.append(footMet);
  const footPriv = el(
    'p',
    undefined,
    'Sin registro y sin datos personales: tus respuestas se guardan solo en tu navegador.',
  );
  footWrap.append(footData, footPriv);
  foot.append(footWrap);

  app.append(head, main, foot);
  renderRoute();
  window.addEventListener('hashchange', renderRoute);
}

boot();
