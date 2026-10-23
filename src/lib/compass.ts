import type { Profile, Question } from './types';

// Brújula 2 ejes, −100..+100 (negativo = izquierda/progresista).
// Polaridad precomputada por pregunta en el dataset:
//   pe/ps = +1 → partidos de referencia de izquierda más a favor
//            → estar de acuerdo te mueve a la IZQUIERDA (negativo)
// score(pregunta) = (3 − user)/2 × 100 × polaridad; promedio por eje.

export interface Compass { econ: number; social: number }

export function compass(answers: Map<number, number>, questions: Question[]): Compass {
  const es: number[] = [];
  const ss: number[] = [];
  for (const q of questions) {
    const user = answers.get(q.id);
    if (user === undefined) continue;
    const s = ((3 - user) / 2) * 100;
    if (q.pe !== 0) es.push(s * q.pe);
    if (q.ps !== 0) ss.push(s * q.ps);
  }
  const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  return { econ: avg(es), social: avg(ss) };
}

// Perfil → categorías (theme slugs) directamente afectadas

const WORK_THEMES: Record<string, string[]> = {
  asalariado: ['empleo-trabajo', 'pensiones-bienestar'],
  autonomo: ['economia-fiscalidad', 'empleo-trabajo'],
  pensionista: ['pensiones-bienestar', 'educacion-sanidad'],
  estudiante: ['educacion-sanidad', 'empleo-trabajo'],
  desempleado: ['empleo-trabajo', 'pensiones-bienestar'],
};

const HOUSING_THEMES: Record<string, string[]> = {
  inquilino: ['vivienda'],
  hipoteca: ['vivienda', 'economia-fiscalidad'],
  propietario: ['vivienda'],
  familiar: ['vivienda'],
};

export function affectedThemes(p: Profile): Set<string> {
  const set = new Set<string>();
  if (p.work && WORK_THEMES[p.work]) WORK_THEMES[p.work].forEach((t) => set.add(t));
  if (p.housing && HOUSING_THEMES[p.housing]) HOUSING_THEMES[p.housing].forEach((t) => set.add(t));
  if (p.kids) set.add('educacion-sanidad');
  return set;
}

export function questionAffectsYou(q: Question, themes: Set<string>): boolean {
  return themes.size > 0 && themes.has(q.t);
}
