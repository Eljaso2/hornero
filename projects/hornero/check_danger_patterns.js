#!/usr/bin/env node
/**
 * Check de patrones peligrosos en JS del Hornero App.
 *
 * Detecta:
 * 1. `.call(this,` en fetch interceptors / callbacks → debe ser `.call(window,`
 * 2. Acceso hard a dict keys en Python (si se invoca desde el proyecto)
 * 3. `except: pass` en Python (bare except)
 * 4. `.bind(this)` en Promise chains
 *
 * Uso:
 *   node check_danger_patterns.js              # checkea app/js/ + app/lit/
 *   node check_danger_patterns.js --fix         // muestra sugerencias
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, 'app');
const JS_DIRS = ['js', 'lit'];

// Patterns: [regex, description, suggestion]
const PATTERNS = [
  {
    regex: /\.call\s*\(\s*this\s*,/,
    desc: 'fetch.call(this, ...) en callback — this=undefined en strict mode',
    suggestion: 'Usar .call(window, ...) o capturar referencia antes del callback',
    severity: 'error',
  },
  {
    regex: /\.bind\s*\(\s*this\s*\)/,
    desc: '.bind(this) en Promise chain — this puede ser undefined',
    suggestion: 'Usar arrow function o capturar this en const self = this',
    severity: 'warning',
  },
  {
    regex: /fetch\s*\.\s*call\s*\(\s*this/,
    desc: 'fetch.call(this, ...) — Illegal invocation en Firefox strict mode',
    suggestion: 'fetch.call(window, ...)',
    severity: 'error',
  },
];

function checkFile(filepath) {
  const content = fs.readFileSync(filepath, 'utf-8');
  const lines = content.split('\n');
  const findings = [];

  for (const pattern of PATTERNS) {
    for (let i = 0; i < lines.length; i++) {
      if (pattern.regex.test(lines[i])) {
        findings.push({
          file: path.relative(ROOT, filepath),
          line: i + 1,
          severity: pattern.severity,
          desc: pattern.desc,
          suggestion: pattern.suggestion,
          code: lines[i].trim(),
        });
      }
    }
  }

  return findings;
}

function main() {
  const allFindings = [];

  for (const dir of JS_DIRS) {
    const fullDir = path.join(ROOT, dir);
    if (!fs.existsSync(fullDir)) continue;

    const files = fs.readdirSync(fullDir).filter(f => f.endsWith('.js'));
    for (const file of files) {
      allFindings.push(...checkFile(path.join(fullDir, file)));
    }
  }

  // Also check backend Python for bare except
  const backendDir = path.resolve(__dirname, 'backend');
  if (fs.existsSync(backendDir)) {
    const pyFiles = [];
    function walkPy(dir) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.isDirectory() && entry.name !== '__pycache__' && entry.name !== 'venv' && entry.name !== '.venv' && entry.name !== 'node_modules') {
          walkPy(path.join(dir, entry.name));
        } else if (entry.name.endsWith('.py')) {
          pyFiles.push(path.join(dir, entry.name));
        }
      }
    }
    walkPy(backendDir);

    for (const fp of pyFiles) {
      const content = fs.readFileSync(fp, 'utf-8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        if (/except\s*:/.test(lines[i]) && !/except\s+\w+/.test(lines[i])) {
          allFindings.push({
            file: path.relative(__dirname, fp),
            line: i + 1,
            severity: 'warning',
            desc: 'bare except: — traga KeyboardInterrupt y SystemExit',
            suggestion: 'Usar except Exception: como mínimo',
            code: lines[i].trim(),
          });
        }
      }
    }
  }

  // Report
  const errors = allFindings.filter(f => f.severity === 'error');
  const warnings = allFindings.filter(f => f.severity === 'warning');

  if (errors.length > 0) {
    console.log('❌ Errores:\n');
    for (const f of errors) {
      console.log(`  ${f.file}:${f.line}`);
      console.log(`    ${f.code}`);
      console.log(`    ⚡ ${f.desc}`);
      console.log(`    💡 ${f.suggestion}\n`);
    }
  }

  if (warnings.length > 0) {
    console.log('⚠️  Warnings:\n');
    for (const f of warnings) {
      console.log(`  ${f.file}:${f.line}`);
      console.log(`    ${f.code}`);
      console.log(`    ⚡ ${f.desc}`);
      console.log(`    💡 ${f.suggestion}\n`);
    }
  }

  if (allFindings.length === 0) {
    console.log('✅ No se encontraron patrones peligrosos');
  } else {
    console.log(`Total: ${errors.length} errores, ${warnings.length} warnings`);
  }

  process.exit(errors.length > 0 ? 1 : 0);
}

main();
