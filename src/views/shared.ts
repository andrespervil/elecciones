import type { AppCtx } from './ui';
import { el } from './ui';
import { decodeShare } from '../lib/share';
import { renderResults } from './results';

export function renderShared(ctx: AppCtx, payload: string): HTMLElement {
  const decoded = decodeShare(payload, ctx.questionIds);
  if (!decoded) return invalidView();

  const root = el('div');
  const build = (): void => {
    const banner = el('div', 'shared-banner');
    banner.append(el('p', 'kicker', 'Resultado compartido'));
    banner.append(
      el(
        'p',
        undefined,
        'Alguien compartió contigo sus resultados del test. Los datos viven en el enlace: nada se ha guardado en tu navegador.',
      ),
    );
    const cta = el('a', 'btn btn-primary', 'Haz tu propio test');
    cta.href = '#/test';
    banner.append(cta);

    root.replaceChildren(
      banner,
      renderResults(ctx.data, decoded.answers, decoded.profile, {
        onSetRegion(code) {
          decoded.profile.region = code;
          build();
        },
      }),
    );
  };
  build();
  return root;
}

function invalidView(): HTMLElement {
  const root = el('div');
  root.style.paddingTop = '3rem';
  root.append(el('p', 'kicker', 'Test electoral · 29-N'));
  root.append(el('h1', undefined, 'El enlace no es válido'));
  root.append(
    el(
      'p',
      'lede',
      'El resultado compartido no se ha podido leer: puede que el enlace se haya cortado al copiarlo. Pídeselo de nuevo, o haz tú el test.',
    ),
  );
  const row = el('div', 'btn-row');
  row.style.marginTop = '1.6rem';
  const cta = el('a', 'btn btn-primary', 'Haz tu propio test');
  cta.href = '#/test';
  const home = el('a', 'btn btn-ghost', 'Portada');
  home.href = '#/';
  row.append(cta, home);
  root.append(row);
  return root;
}
