---
name: apify-health-check
description: Diagnostica la conectividad, el contrato de datos y la salud de una fuente Apify. Usala cuando una integracion Apify necesite una verificacion reproducible antes de una demo, una importacion o una puesta en produccion.
---

# Apify Health Check

Esta skill ejecuta 9 comprobaciones en 3 bloques y genera un reporte JSON.
Trabaja con un snapshot local de la respuesta de Apify, por lo que puede
demostrarse sin exponer tokens ni depender de una red durante la presentacion.

## Cuando usarla

Usala para diagnosticar rapidamente una integracion basada en un actor y un
dataset de Apify. No reemplaza una prueba de carga ni revoca credenciales.

## Requisitos

- Node.js 18 o posterior.
- No requiere paquetes externos.
- Un archivo JSON con el formato de `demo-project/apify-snapshot.json`.

## Ejecucion

Desde la raiz del repositorio:

```bash
node .codex/skills/apify-health-check/scripts/health-check.js \
  --input demo-project/apify-snapshot.json \
  --output demo-project/health-report.json \
  --now 2026-09-25T12:00:00Z
```

El comando termina con codigo `0` si los 9 checks pasan y con codigo `1` si
hay checks fallidos. Un JSON mal formado o un archivo inexistente termina con
codigo `2`.

## Los 3 bloques y sus 9 checks

1. **Conectividad**: token configurado, actor disponible y dataset accesible.
2. **Contrato de datos**: schema esperado, registros presentes y registros
   validos.
3. **Operacion**: ultimo run exitoso, datos recientes y tasa de errores
   aceptable.

El schema de validacion esta en `assets/expected-schema.json`. Los mensajes de
solucion se obtienen de `assets/troubleshooting-hints.json`. La interpretacion
de la fuente esta documentada en `references/actor-docs.md` y
`references/troubleshooting-guide.md`; el script lee esos archivos y los
incluye en el reporte.

## Entrada y resultado

Consulta `demo-project/apify-snapshot.json` para una entrada valida y
`demo-project/invalid-snapshot.json` para una demostracion fallida. El reporte
contiene cada check, su bloque, estado, detalle y hint de solucion cuando
corresponde.

## Demostracion

```bash
node demo-project/run-demo.js
```

El caso valido escribe `demo-project/health-report.json`. Para mostrar el
manejo de errores:

```bash
node .codex/skills/apify-health-check/scripts/health-check.js \
  --input demo-project/invalid-snapshot.json \
  --output demo-project/invalid-report.json \
  --now 2026-09-25T12:00:00Z
```

Se genera el reporte con los fallos y el proceso termina con codigo `1`.
