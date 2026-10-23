#!/usr/bin/env node
// Verificación del algoritmo contra el caso real del REA (2026-10-23):
// respuestas simuladas -> ranking publicado por el sitio fuente.
// Debe reproducir los 15 valores al decimal.
import { readFileSync } from 'node:fs';

const ds = JSON.parse(readFileSync(new URL('../src/data/dataset.json', import.meta.url), 'utf8'));
const fx = JSON.parse(readFileSync(new URL('./verify-fixture.json', import.meta.url), 'utf8'));

const answers = new Map(Object.entries(fx.answers).map(([k, v]) => [Number(k), v]));
const NAME2SLUG = {
  'Partido Nacionalista Vasco': 'pnv', 'Junts per Catalunya': 'junts',
  'Coalición Canaria': 'coalicion-canaria', 'Esquerra Republicana de Catalunya': 'erc',
  'Unidad del Pueblo Canario': 'unidad-pueblo-canario', 'Partido Popular': 'pp',
  'Partido Socialista Obrero Español': 'psoe', 'Compromís': 'compromis',
  'Adelante Andalucía': 'adelante-andalucia', 'Bloque Nacionalista Galego': 'bng',
  'Podemos': 'podemos', 'EH Bildu': 'bildu', 'Frente Amplio': 'sumar',
  'Se Acabó La Fiesta': 'salf', 'VOX': 'vox',
};
const conv = (u) => 0.5 + Math.abs(u - 3) * 0.25;

function aff(slug) {
  let sum = 0, max = 0;
  for (const q of ds.questions) {
    const u = answers.get(q.id);
    const p = q.pos[slug];
    if (u === undefined || !p) continue;
    const w = 9 * conv(u);
    sum += (4 - Math.abs(u - p.v)) ** 2 * w;
    max += 16 * w;
  }
  return (sum / max) * 100;
}

let fails = 0;
for (const [name, expected] of fx.expected) {
  const slug = NAME2SLUG[name];
  const got = aff(slug);
  const ok = Math.abs(got - expected) < 0.05;
  if (!ok) fails++;
  console.log(`${ok ? 'OK ' : 'FAIL'} ${name.padEnd(42)} esperado=${expected.toFixed(1)} obtenido=${got.toFixed(1)}`);
}
if (fails) { console.error(`\n${fails} fallos`); process.exit(1); }
console.log('\nAlgoritmo verificado: 15/15 reproduccidos.');
