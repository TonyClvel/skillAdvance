# Mini proyecto Apify

Este mini proyecto representa un adaptador de una integracion Apify. En lugar
de conectarse a internet durante la presentacion, usa snapshots JSON
reproducibles y ejecuta la skill real.

## Caso exitoso

```bash
node run-demo.js
```

Genera `health-report.json` con 9/9 checks PASS.

## Caso con errores

```bash
node ../.codex/skills/apify-health-check/scripts/health-check.js --input invalid-snapshot.json --output invalid-report.json --now 2026-09-25T12:00:00Z
```

Genera un reporte con fallos, hints concretos y termina con codigo 1.
