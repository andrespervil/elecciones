// Tipos del dataset (generado por scripts/build-dataset.mjs)
export type PartySlug =
  | 'psoe' | 'pp' | 'vox' | 'sumar' | 'podemos' | 'erc' | 'junts' | 'pnv'
  | 'bildu' | 'adelante-andalucia' | 'bng' | 'coalicion-canaria'
  | 'compromis' | 'unidad-pueblo-canario' | 'salf';

export interface Position { v: number; s: string | null; st: string | null; e: 0 | 1 }

export interface Question {
  id: number;
  t: string;      // theme slug
  cat: string;    // categoría legible
  text: string;
  expl: string;
  simple: string | null;
  pe: -1 | 0 | 1; // polaridad eje económico
  ps: -1 | 0 | 1; // polaridad eje social
  pos: Record<string, Position>;
}

export interface Party { name: string; color: string; regions: string[] }

export interface Dataset {
  meta: { election: string; dataRevision: string; base: string; nQuestions: number; nParties: number };
  regions: [string, string][];
  themes: string[];
  parties: Record<string, Party>;
  questions: Question[];
}

// Perfil opcional del usuario
export type Housing = 'inquilino' | 'hipoteca' | 'propietario' | 'familiar' | '';
export type Work = 'asalariado' | 'autonomo' | 'pensionista' | 'estudiante' | 'desempleado' | '';
export interface Profile {
  region: string;   // código INE ('' = sin especificar)
  housing: Housing;
  work: Work;
  kids: 0 | 1;      // hijos menores a cargo
}

export const EMPTY_PROFILE: Profile = { region: '', housing: '', work: '', kids: 0 };
