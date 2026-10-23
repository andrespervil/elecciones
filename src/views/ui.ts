// Shared UI helpers + the app context every view receives.
import type { Dataset, Profile } from '../lib/types';

export interface AppCtx {
  data: Dataset;
  answers: Map<number, number>;
  profile: Profile;
  /** Question ids in ascending order (payload order for share links). */
  questionIds: number[];
  saveAnswers(): void;
  saveProfile(): void;
  reset(): void;
  go(hash: string): void;
  /** Views register cleanup callbacks run before the next route renders. */
  onTeardown(fn: () => void): void;
}

export function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  cls?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (cls) node.className = cls;
  if (text !== undefined) node.textContent = text;
  return node;
}

export const LIKERT_WORD: Record<number, string> = {
  1: 'Muy en desacuerdo',
  2: 'En desacuerdo',
  3: 'Neutral',
  4: 'De acuerdo',
  5: 'Muy de acuerdo',
};

export const LIKERT_OPTIONS: ReadonlyArray<readonly [number, string]> = [
  [1, 'Muy en desacuerdo'],
  [2, 'En desacuerdo'],
  [3, 'Neutral'],
  [4, 'De acuerdo'],
  [5, 'Muy de acuerdo'],
];

/** 61.23… → «61,2 %» (Spanish decimal comma). */
export function fmtPct(n: number): string {
  return (
    n.toLocaleString('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + ' %'
  );
}

/** Small party color dot; color comes from the dataset (data accent only). */
export function partyDot(color: string, label: string): HTMLElement {
  const dot = el('span', 'dot');
  dot.style.background = color;
  dot.setAttribute('aria-hidden', 'true');
  const wrap = el('span', 'dot-wrap');
  wrap.setAttribute('aria-label', label);
  wrap.append(dot);
  return wrap;
}
