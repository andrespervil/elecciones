import type { Profile } from './types';
import { EMPTY_PROFILE } from './types';

// Compartir resultados por URL hash, sin backend ni datos personales.
// Payload compacto: { a: "digitos 1-5 en orden de id", p?: perfil }
// Codificado como base64url(JSON).

export interface SharePayload {
  a: string;
  p?: { r?: string; h?: string; w?: string; k?: 0 | 1 };
}

export function encodeShare(
  answers: Map<number, number>,
  questionIds: number[],
  profile: Profile,
  includeProfile: boolean,
): string {
  const a = questionIds.map((id) => answers.get(id) ?? 3).join('');
  const payload: SharePayload = { a };
  if (includeProfile && (profile.region || profile.housing || profile.work || profile.kids)) {
    payload.p = {
      ...(profile.region ? { r: profile.region } : {}),
      ...(profile.housing ? { h: profile.housing } : {}),
      ...(profile.work ? { w: profile.work } : {}),
      ...(profile.kids ? { k: profile.kids } : {}),
    };
  }
  const json = JSON.stringify(payload);
  return btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeShare(
  hash: string,
  questionIds: number[],
): { answers: Map<number, number>; profile: Profile } | null {
  try {
    const b64 = hash.replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(b64);
    const payload = JSON.parse(json) as SharePayload;
    if (typeof payload.a !== 'string' || payload.a.length !== questionIds.length) return null;
    const answers = new Map<number, number>();
    questionIds.forEach((id, i) => {
      const v = Number(payload.a[i]);
      if (v >= 1 && v <= 5) answers.set(id, v);
    });
    if (answers.size !== questionIds.length) return null;
    const p = payload.p ?? {};
    const profile: Profile = {
      region: typeof p.r === 'string' ? p.r : '',
      housing: (typeof p.h === 'string' ? p.h : '') as Profile['housing'],
      work: (typeof p.w === 'string' ? p.w : '') as Profile['work'],
      kids: p.k === 1 ? 1 : 0,
    };
    return { answers, profile: profile ?? EMPTY_PROFILE };
  } catch {
    return null;
  }
}
