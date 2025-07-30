# 🤖 Asistente Autónomo para Claude Code — Pack Operativo
> Drop‑in para que el agente **haga** cosas con límites, seguridad y trazabilidad.

## Comandos `/sc:` (semántica ejecutable)
### /sc:analyze
- Recolecta: árbol del repo (ignora `.git`, `node_modules`, `dist`, `build`, `.venv`, `venv`, `.next`, `.cache`).
- Detecta stack (Node/Python/Go) y scripts disponibles.
- Salidas: 
  - `report/analyze.json` con lenguajes, scripts, hotspots (TODO/FIXME), archivos pesados.
  - Actualiza sección ANALYZE en `STATE.md`.
- Éxito: `report/analyze.json` válido.

### /sc:improve "<objetivo>"
- Crea/usa rama `feat/auto-YYYYMMDD-<slug>`.
- Cambios limitados: `≤15 archivos` y `≤200 KB` de diff.
- Corre linters/auto‑fixers si existen.
- Éxito: diffs aplicados + lint sin errores.

### /sc:test
- Ejecuta suite según stack (timeout 600 s, reintento flakey x1).
- Éxito: exit code 0; si hay cobertura, no baja >2% vs baseline.

### /sc:document
- Actualiza `CHANGELOG.md` (últimos cambios) y documentación mínima en `docs/`.
- Éxito: archivos creados/actualizados.

### /sc:git "<cmd>"
- Permitidos: `status`, `add -A`, `commit -m "<conv>"`, `push --set-upstream origin feat/*`, `restore --staged .`.
- Prohibidos: `push origin main`, `reset --hard`, `rebase -i` (requiere aprobación).

### /sc:troubleshoot "<hint>"
- Recolecta últimos logs, tamaño de contexto y errores frecuentes en `report/troubleshoot.log`.

---

## Presupuestos y límites (budget)
- `iterations`: 3
- `seconds`: 1200
- `max_changed_files`: 15
- `max_diff_kb`: 200
- Stop si:
  - 2 ciclos seguidos sin mejorar tests ni reducir warnings
  - Nueva tasa de fallos >50%

## Gates de seguridad (requieren aprobación)
- Instalar/actualizar dependencias
- Ejecutar migraciones/seed en DB real
- Borrar > 5 archivos o mover fuera de `src/`
- Tocar secretos/CI
- `git push` a ramas que no sean `feat/*`

## Definición de Hecho (DoD)
- Improve: lint 0 errores + diffs ≤ budget + tests existentes no se rompen
- Test: exit 0 + cobertura no baja >2% (si aplica)
- Document: CHANGELOG con scope + BREAKING si hubiera
- Git: commits convencionales (feat|fix|perf|refactor|docs|test|chore)

## Máquina de estados
`ANALYZE → PLAN → (IMPROVE → TEST → (si falla: TROUBLESHOOT → IMPROVE)) → DOCUMENT → GIT → DONE`
Pasa a `STOP` si agota budget o se dispara un gate sin aprobación.

---

## Uso rápido con Terminal
```bash
# 0) (opcional) Inicializar y permitir que el agente tenga helpers
make bootstrap

# 1) Análisis
/sc:analyze           # o   make analyze

# 2) Mejorar algo concreto
/sc:improve "manejo de errores en api.js"

# 3) Correr tests
/sc:test

# 4) Documentar y commitear
/sc:document
/sc:git "commit -m 'fix(api): manejo robusto de errores'"
/sc:git "push --set-upstream origin feat/auto-20250729-manejo-errores"
```

> El agente puede llamar a estos comandos. Si la UI pide confirmación, agrupamos pasos en scripts para **aprobar una sola vez**.

## Primera respuesta sugerida del agente
> 🚀 Iniciando análisis autónomo…
> Ejecutando `/sc:analyze` (genera `report/analyze.json` y actualiza `STATE.md`).
> Si hay tests, establezco baseline. Luego: plan con alcance ≤15 archivos. Gates activos para deps y push a main. Continúo con `/sc:improve "<objetivo>"` en una rama `feat/auto-*`.
