#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function argumentValue(args, name, required = true) {
  const index = args.indexOf(name);
  if (index === -1 || !args[index + 1]) {
    if (required) throw new Error(`Falta el argumento ${name}`);
    return null;
  }
  return args[index + 1];
}

function readJson(filePath, label) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new Error(`No se pudo leer ${label}: ${error.code === 'ENOENT' ? 'archivo inexistente' : 'JSON invalido'}`);
  }
}

function readText(filePath, label) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    throw new Error(`No se pudo leer ${label}`);
  }
}

function hasField(value, field) {
  return value !== null && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, field);
}

function check(block, id, name, passed, detail, hints) {
  return {
    id,
    block,
    name,
    status: passed ? 'PASS' : 'FAIL',
    detail,
    hint: passed ? null : (hints[id] || 'Revisa la guia de troubleshooting.'),
  };
}

function runChecks(snapshot, schema, hints, now) {
  const checks = [];
  const connectivity = snapshot.connectivity || {};
  const dataset = snapshot.dataset || {};
  const run = snapshot.lastRun || {};
  const records = Array.isArray(dataset.records) ? dataset.records : [];
  const requiredFields = Array.isArray(schema.required) ? schema.required : [];
  const properties = schema.properties || {};

  checks.push(check('Conectividad', 'C1', 'Token configurado', connectivity.tokenConfigured === true,
    connectivity.tokenConfigured === true ? 'El token esta configurado.' : 'No hay un token configurado.', hints));
  checks.push(check('Conectividad', 'C2', 'Actor disponible', connectivity.actorExists === true,
    connectivity.actorExists === true ? `Actor ${snapshot.actorId || '(sin id)'} disponible.` : 'El actor no responde o no existe.', hints));
  checks.push(check('Conectividad', 'C3', 'Dataset accesible', dataset.accessible === true,
    dataset.accessible === true ? 'El dataset puede consultarse.' : 'El dataset no puede consultarse.', hints));

  const schemaFields = requiredFields.filter((field) => hasField(properties, field));
  checks.push(check('Contrato de datos', 'D1', 'Schema esperado', schemaFields.length === requiredFields.length,
    `${schemaFields.length}/${requiredFields.length} campos requeridos definidos.`, hints));
  checks.push(check('Contrato de datos', 'D2', 'Registros presentes', records.length > 0,
    `${records.length} registro(s) encontrados.`, hints));
  const recordsValid = records.length > 0 && records.every((record) => requiredFields.every((field) => {
    const expectedType = properties[field] && properties[field].type;
    return hasField(record, field) && (!expectedType || typeof record[field] === expectedType);
  }));
  checks.push(check('Contrato de datos', 'D3', 'Registros validos', recordsValid,
    recordsValid ? 'Todos los registros cumplen el schema.' : 'Al menos un registro no cumple el schema.', hints));

  checks.push(check('Operacion', 'O1', 'Ultimo run exitoso', run.status === 'SUCCEEDED',
    `Estado del ultimo run: ${run.status || 'desconocido'}.`, hints));
  const nowDate = new Date(now);
  const finishedDate = new Date(run.finishedAt || 0);
  const ageHours = (nowDate - finishedDate) / 36e5;
  const fresh = Number.isFinite(ageHours) && ageHours >= 0 && ageHours <= (snapshot.maxFreshnessHours || 24);
  checks.push(check('Operacion', 'O2', 'Datos recientes', fresh,
    Number.isFinite(ageHours) ? `Ultima ejecucion hace ${ageHours.toFixed(1)} hora(s).` : 'No hay fecha de ejecucion.', hints));
  const errorRate = Number(snapshot.errorRate);
  const acceptableErrors = Number.isFinite(errorRate) && errorRate <= (snapshot.maxErrorRate || 0.1);
  checks.push(check('Operacion', 'O3', 'Tasa de errores aceptable', acceptableErrors,
    `Tasa de errores: ${Number.isFinite(errorRate) ? `${(errorRate * 100).toFixed(1)}%` : 'desconocida'}.`, hints));

  return checks;
}

function main() {
  const args = process.argv.slice(2);
  const inputPath = argumentValue(args, '--input');
  const outputPath = argumentValue(args, '--output');
  const now = argumentValue(args, '--now', false) || new Date().toISOString();
  const root = path.resolve(__dirname, '..');
  const snapshot = readJson(inputPath, 'el snapshot');
  const schema = readJson(path.join(root, 'assets', 'expected-schema.json'), 'el schema esperado');
  const hints = readJson(path.join(root, 'assets', 'troubleshooting-hints.json'), 'los hints');
  const actorDocs = readText(path.join(root, 'references', 'actor-docs.md'), 'la documentacion del actor');
  const troubleshootingGuide = readText(path.join(root, 'references', 'troubleshooting-guide.md'), 'la guia de troubleshooting');
  const checks = runChecks(snapshot, schema, hints, now);
  const passed = checks.filter((item) => item.status === 'PASS').length;
  const report = {
    skill: 'apify-health-check',
    generatedAt: now,
    actorId: snapshot.actorId || null,
    summary: { total: checks.length, passed, failed: checks.length - passed },
    references: {
      actorDocsTitle: actorDocs.split('\n').find((line) => line.startsWith('# ')) || 'actor-docs.md',
      troubleshootingGuideTitle: troubleshootingGuide.split('\n').find((line) => line.startsWith('# ')) || 'troubleshooting-guide.md',
    },
    checks,
  };
  fs.mkdirSync(path.dirname(path.resolve(outputPath)), { recursive: true });
  fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(`Health check completado: ${passed}/${checks.length} checks PASS.`);
  return passed === checks.length ? 0 : 1;
}

try {
  process.exitCode = main();
} catch (error) {
  console.error(`Error: ${error.message}`);
  process.exitCode = 2;
}
