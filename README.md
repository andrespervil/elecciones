# elecciones · elecciones.andresperez.es

Test de afinidad política para las generales del 29-N-2026: 59 preguntas,
15 partidos, cada posición con su fuente enlazada. Diferenciador: **cómo te
afectan las propuestas a ti** (perfil → ranking de impacto personal).

- **Stack**: Vite + TypeScript vanilla, SPA estática sin backend.
- **Datos**: matriz de posiciones extraída y auditada de afinidadpolitica.es
  (REA 2026-10-23), regenerable con `npm run build:dataset`.
- **Algoritmo**: afinidad cuadrática con factor de convicción, verificado
  15/15 contra el sitio fuente (`npm run verify`).
- **Deploy**: `docker compose up -d --build` → nginx :80 bind 127.0.0.1:3180,
  publicado con `new-site elecciones 3180`.
