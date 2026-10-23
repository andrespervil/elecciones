# elecciones — AGENTS.md

Test de afinidad política para las generales 29-N-2026.
Publicado en **elecciones.andresperez.es** (VPS Contabo, Docker nginx :3180 detrás
de new-site/nginx + Cloudflare).

## Reglas del repo

- SPA estática: Vite + TypeScript vanilla, **sin framework ni backend**.
- Datos: `src/data/dataset.json` — NO editar a mano. Regenerar con
  `npm run build:dataset` desde la matriz del metarepo
  (`research/afinidadpolitica/afinidadpolitica_dataset.json`).
- El algoritmo de afinidad (`src/lib/affinity.ts`) está **verificado contra el
  sitio fuente** (15/15). Cualquier cambio exige actualizar
  `scripts/verify-fixture.json` + `npm run verify` en verde antes de commit.
- Comandos: `npm run dev` · `npm run build` (tsc + vite) · `npm run verify`.
- Deploy: `docker compose up -d --build` en el VPS (bind 127.0.0.1:3180).
- Crédito de datos obligatorio en UI: matriz base de afinidadpolitica.es
  (revisión oct-2026) con enlace; cada posición enlaza su fuente original.
- Idioma: español. Tono neutral (no mencionar preferencias en la UI).
