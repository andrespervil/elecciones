import type { Question } from './types';

// Algoritmo de afinidad — verificado 15/15 al decimal contra el sitio fuente
// (REA 2026-10-23). Importancia fija 3, confianza fija 3 (v1).
//
//   diff = |user − partido|          (escala 1-5 ambos)
//   base = (4 − diff)²              penalización cuadrática
//   convicción = 0.5 + |user − 3| × 0.25    neutral .5 · media .75 · extrema 1
//   peso = 3 × 3 × convicción
//   afinidad% = Σ(base·peso) / Σ(16·peso) × 100

export function conviction(user: number): number {
  return 0.5 + Math.abs(user - 3) * 0.25;
}

/** Afinidad de un partido sobre el conjunto de preguntas dado. 0–100. */
export function partyAffinity(
  party: string,
  answers: Map<number, number>,
  questions: Question[],
): number | null {
  let sum = 0;
  let max = 0;
  let n = 0;
  for (const q of questions) {
    const user = answers.get(q.id);
    const pos = q.pos[party];
    if (user === undefined || !pos) continue;
    const w = 9 * conviction(user);
    sum += (4 - Math.abs(user - pos.v)) ** 2 * w;
    max += 16 * w;
    n++;
  }
  if (n === 0 || max === 0) return null;
  return (sum / max) * 100;
}

export interface RankedParty { slug: string; pct: number }

/** Ranking completo (todas las preguntas). Descendente. */
export function ranking(
  answers: Map<number, number>,
  questions: Question[],
  partySlugs: string[],
): RankedParty[] {
  const out: RankedParty[] = [];
  for (const slug of partySlugs) {
    const pct = partyAffinity(slug, answers, questions);
    if (pct !== null) out.push({ slug, pct });
  }
  return out.sort((a, b) => b.pct - a.pct);
}

/** Preguntas donde más coincís (diff 0) y más diferís (diff >= 2) con un partido. */
export function agreementsDisagreements(
  party: string,
  answers: Map<number, number>,
  questions: Question[],
  limit = 4,
): { agree: Question[]; differ: Question[] } {
  const scored = questions
    .filter((q) => answers.has(q.id) && q.pos[party])
    .map((q) => ({ q, diff: Math.abs(answers.get(q.id)! - q.pos[party].v) }));
  scored.sort((a, b) => a.diff - b.diff);
  const agree = scored.filter((s) => s.diff === 0).slice(0, limit).map((s) => s.q);
  const differ = [...scored].reverse().filter((s) => s.diff >= 2).slice(0, limit).map((s) => s.q);
  return { agree, differ };
}
