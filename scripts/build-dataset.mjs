#!/usr/bin/env node
// Regenera src/data/dataset.json desde la matriz extraída del REA
// (metarepo: research/afinidadpolitica/afinidadpolitica_dataset.json).
// Uso: node scripts/build-dataset.mjs [ruta-del-dataset]
import { readFileSync, writeFileSync } from 'node:fs';

const SRC = process.argv[2] ?? '/root/dev/andresperez-metarepo/research/afinidadpolitica/afinidadpolitica_dataset.json';
const raw = JSON.parse(readFileSync(SRC, 'utf8'));

const PARTY_COLORS = {
  psoe: '#E30613', pp: '#0066CC', vox: '#66BC29', sumar: '#E51C55',
  podemos: '#683278', erc: '#FFB232', junts: '#00C1B5', pnv: '#409243',
  bildu: '#A3C940', 'adelante-andalucia': '#24C87E', bng: '#6AADE4',
  'coalicion-canaria': '#00ACE9', compromis: '#FF6720',
  'unidad-pueblo-canario': '#8E1F48', salf: '#785a46',
};
const PARTY_NAMES = {
  psoe: 'PSOE', pp: 'PP', vox: 'VOX', sumar: 'Frente Amplio (Sumar)',
  podemos: 'Podemos', erc: 'ERC', junts: 'Junts', pnv: 'PNV', bildu: 'EH Bildu',
  'adelante-andalucia': 'Adelante Andalucía', bng: 'BNG',
  'coalicion-canaria': 'Coalición Canaria', compromis: 'Compromís',
  'unidad-pueblo-canario': 'Unidad del Pueblo Canario', salf: 'Se Acabó La Fiesta',
};
// CCAA donde se presenta cada partido (revisión oct-2026, notas del sitio fuente).
const ALL = ['AN','AR','AS','CB','CL','CM','CN','CT','EX','GA','IB','RI','MD','MC','NA','PV','VC','CE','ML'];
const minus = (codes) => ALL.filter((c) => !codes.includes(c));
const PARTY_REGIONS = {
  pnv: ['PV'], bildu: ['PV','NA'], erc: ['CT'], junts: ['CT'], bng: ['GA'],
  compromis: ['VC'], 'coalicion-canaria': ['CN'], 'unidad-pueblo-canario': ['CN'],
  'adelante-andalucia': ['AN'],
  podemos: minus(['CN','CT','VC']),
  sumar: minus(['IB','CN','VC']),
  pp: ALL, psoe: ALL, vox: ALL, salf: ALL,
};
const REGIONS = [
  ['AN','Andalucía'],['AR','Aragón'],['AS','Asturias'],['CB','Cantabria'],
  ['CL','Castilla y León'],['CM','Castilla-La Mancha'],['CN','Canarias'],['CT','Cataluña'],
  ['EX','Extremadura'],['GA','Galicia'],['IB','Illes Balears'],['RI','La Rioja'],
  ['MD','Madrid'],['MC','Murcia'],['NA','Navarra'],['PV','País Vasco'],
  ['VC','Comunitat Valenciana'],['CE','Ceuta'],['ML','Melilla'],
];

const THEMES = [...new Set(raw.questions.map((q) => q.theme_slug))];
const ECON = ['economia-fiscalidad','empleo-trabajo','vivienda','pensiones-bienestar','agricultura-rural'];
const SOCIAL = ['modelo-social','inmigracion','seguridad-justicia','instituciones','educacion-sanidad','medio-ambiente'];
const LEFT = ['psoe','sumar','bildu','erc'];
const RIGHT = ['pp','vox'];

const val = (q, slug) => q.positions[slug]?.value ?? null;

// Polaridad: media refs izquierda vs derecha; +1 => izquierda más a favor
// (estar de acuerdo te mueve a la IZQUIERDA = score negativo).
const polarity = (q) => {
  const l = LEFT.map((s) => val(q, s)).filter((v) => v !== null);
  const r = RIGHT.map((s) => val(q, s)).filter((v) => v !== null);
  if (!l.length || !r.length) return 0;
  const lm = l.reduce((a, b) => a + b, 0) / l.length;
  const rm = r.reduce((a, b) => a + b, 0) / r.length;
  return lm > rm ? 1 : lm < rm ? -1 : 0;
};

const parties = Object.fromEntries(
  Object.entries(PARTY_NAMES).map(([slug, name]) => [
    slug, { name, color: PARTY_COLORS[slug], regions: PARTY_REGIONS[slug] },
  ]),
);

const questions = raw.questions.map((q) => ({
  id: q.id,
  t: q.theme_slug,
  cat: q.category,
  text: q.text,
  expl: q.explanation,
  simple: q.simple,
  // polaridad econom/social: 0 no puntúa en ese eje; ±1 dirección
  pe: ECON.includes(q.theme_slug) ? polarity(q) : 0,
  ps: SOCIAL.includes(q.theme_slug) ? polarity(q) : 0,
  pos: Object.fromEntries(
    Object.entries(q.positions).map(([slug, p]) => [
      slug, { v: p.value, s: p.source_url, st: p.source_text, e: p.estimated ? 1 : 0 },
    ]),
  ),
}));

const out = {
  meta: {
    election: 'Elecciones generales España · 29 de noviembre de 2026',
    dataRevision: '2026-10-23',
    base: 'Matriz de posiciones: afinidadpolitica.es (revisión oct-2026), cada posición enlaza su fuente original',
    nQuestions: questions.length,
    nParties: Object.keys(parties).length,
  },
  regions: REGIONS,
  themes: THEMES,
  parties,
  questions,
};

writeFileSync(new URL('../src/data/dataset.json', import.meta.url), JSON.stringify(out));
console.log(`dataset.json: ${questions.length} preguntas, ${Object.keys(parties).length} partidos`);
