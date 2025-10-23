#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');

/** @typedef {'low'|'moderate'|'high'|'critical'} Severity */

/**
 * @typedef {Object} Finding
 * @property {string} id
 * @property {string} title
 * @property {string} description
 * @property {Severity} severity
 * @property {string=} recommendation
 * @property {string=} filePath
 * @property {number=} line
 * @property {{type: 'dependency-bump'|'code', details: string, apply: boolean}=} fix
 */

/**
 * @typedef {Object} ScanResult
 * @property {Finding[]} findings
 */

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function listFilesRecursively(dir, exts, ignore) {
  /** @type {string[]} */
  const results = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (ignore(full)) continue;
    if (entry.isDirectory()) {
      results.push(...listFilesRecursively(full, exts, ignore));
    } else if (exts.includes(path.extname(entry.name))) {
      results.push(full);
    }
  }
  return results;
}

function normalizeVersionRange(range) {
  if (!range) return range;
  return String(range).trim();
}

function getMajorFromRange(range) {
  const r = normalizeVersionRange(range);
  if (!r) return undefined;
  const match = r.match(/(\d+)\.(\d+)\.(\d+)/);
  if (!match) return undefined;
  return parseInt(match[1], 10);
}

/** @param {string} projectRoot */
function scanDependencies(projectRoot) {
  const pkgPath = path.join(projectRoot, 'package.json');
  const pkg = readJson(pkgPath);
  /** @type {Finding[]} */
  const findings = [];

  const deps = {
    ...(pkg.dependencies || {}),
    ...(pkg.devDependencies || {}),
  };

  // Rule: js-yaml < 4 is outdated/insecure; upgrade to 4.1.0+
  if (deps['js-yaml']) {
    const major = getMajorFromRange(deps['js-yaml']);
    if (typeof major === 'number' && major < 4) {
      findings.push({
        id: 'DEP_JS_YAML_UPGRADE',
        title: 'Upgrade js-yaml to v4.1.0+',
        description: `Detected js-yaml@${deps['js-yaml']}. Version 4+ makes safe parsing the default and removes unsafe APIs.`,
        severity: 'high',
        recommendation: 'Bump to ^4.1.0 and re-run tests.',
        fix: {
          type: 'dependency-bump',
          details: 'Set js-yaml to ^4.1.0 in dependencies',
          apply: true,
        },
      });
    }
  }

  return findings;
}

/** @param {string} projectRoot */
function scanCodebase(projectRoot) {
  const srcDir = path.join(projectRoot, 'src');
  /** @type {Finding[]} */
  const findings = [];
  if (!fs.existsSync(srcDir)) return findings;

  const files = listFilesRecursively(
    srcDir,
    ['.ts', '.js'],
    (p) => p.includes(`${path.sep}node_modules${path.sep}`) || p.includes(`${path.sep}lib${path.sep}`)
  );

  const insecurePatterns = [
    { id: 'CODE_EVAL', re: /\beval\s*\(/, title: 'Use of eval()', desc: 'eval can lead to code injection. Avoid or sandbox input.', severity: 'critical' },
    { id: 'CODE_NEW_FUNCTION', re: /\bnew\s+Function\s*\(/, title: 'Use of new Function()', desc: 'Dynamic function construction is unsafe.', severity: 'high' },
    { id: 'CODE_CHILD_PROCESS', re: /\bchild_process\b|\bexec\s*\(|\bspawn\s*\(/, title: 'Spawning shell commands', desc: 'Shelling out can be dangerous with untrusted input.', severity: 'moderate' },
  ];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    for (const pattern of insecurePatterns) {
      const match = content.match(pattern.re);
      if (match) {
        findings.push({
          id: pattern.id,
          title: pattern.title,
          description: pattern.desc,
          severity: pattern.severity,
          filePath: path.relative(projectRoot, file),
        });
      }
    }

    // js-yaml load usage advice (ensuring v4+ is used)
    if (/from\s+['"]js-yaml['"]/i.test(content) || /require\(['"]js-yaml['"]\)/i.test(content)) {
      if (/\bload\s*\(/.test(content)) {
        findings.push({
          id: 'CODE_JS_YAML_LOAD',
          title: 'YAML parsing with js-yaml',
          description: 'Ensure js-yaml v4+ is used so load() is safe by default.',
          severity: 'moderate',
          filePath: path.relative(projectRoot, file),
          recommendation: 'Upgrade js-yaml to v4.1.0+.',
        });
      }
    }
  }

  return findings;
}

/** @param {Finding[]} findings */
function uniqueFindings(findings) {
  const seen = new Set();
  /** @type {Finding[]} */
  const result = [];
  for (const f of findings) {
    const key = [f.id, f.filePath || ''].join('::');
    if (!seen.has(key)) {
      seen.add(key);
      result.push(f);
    }
  }
  return result;
}

/** @param {string} projectRoot @param {Finding[]} findings */
function applyFixes(projectRoot, findings) {
  /** @type {Finding[]} */
  const applied = [];
  const pkgPath = path.join(projectRoot, 'package.json');
  const pkg = readJson(pkgPath);

  const needJsYamlUpgrade = findings.some((f) => f.id === 'DEP_JS_YAML_UPGRADE' && f.fix && f.fix.apply);
  if (needJsYamlUpgrade) {
    if (!pkg.dependencies) pkg.dependencies = {};
    pkg.dependencies['js-yaml'] = '^4.1.0';
    writeJson(pkgPath, pkg);
    applied.push({
      id: 'DEP_JS_YAML_UPGRADE',
      title: 'Upgraded js-yaml to ^4.1.0',
      description: 'Dependency version bumped in package.json. Install to update lockfile.',
      severity: 'high',
      fix: { type: 'dependency-bump', details: 'package.json updated', apply: true },
    });
  }

  return { applied };
}

/** @param {string} projectRoot @param {ScanResult} scan @param {Finding[]} appliedFixes */
function formatReport(projectRoot, scan, appliedFixes) {
  const lines = [];
  lines.push('# Security Report');
  lines.push('');
  lines.push(`Project: ${path.basename(projectRoot)}`);
  lines.push(`Date: ${new Date().toISOString()}`);
  lines.push('');

  if (scan.findings.length === 0) {
    lines.push('No findings detected.');
  } else {
    lines.push('## Findings');
    for (const f of scan.findings) {
      lines.push(`- [${f.severity.toUpperCase()}] ${f.title}${f.filePath ? ` (${f.filePath})` : ''}`);
      if (f.description) lines.push(`  - ${f.description}`);
      if (f.recommendation) lines.push(`  - Recommendation: ${f.recommendation}`);
    }
  }

  if (appliedFixes.length > 0) {
    lines.push('');
    lines.push('## Fixes Applied');
    for (const f of appliedFixes) {
      lines.push(`- ${f.title}`);
      if (f.fix && f.fix.details) lines.push(`  - ${f.fix.details}`);
    }
  }

  lines.push('');
  lines.push('## Suggested Improvements');
  lines.push('- Add a CI step to run `npm audit --audit-level=moderate` and fail on findings.');
  lines.push('- Keep `js-yaml` at v4+ and avoid custom YAML tags unless necessary.');
  lines.push('- Avoid dynamic code execution (`eval`, `new Function`).');
  lines.push('- Validate and sanitize all external inputs before parsing.');
  lines.push('- Enable Dependabot or Renovate for automated dependency updates.');

  return lines.join('\n');
}

function writeReport(projectRoot, contents) {
  const outPath = path.join(projectRoot, 'SECURITY_REPORT.md');
  fs.writeFileSync(outPath, contents, 'utf8');
}

function run() {
  const projectRoot = process.cwd();
  const subcommand = process.argv[2] || 'scan';

  const doScan = () => {
    const depFindings = scanDependencies(projectRoot);
    const codeFindings = scanCodebase(projectRoot);
    const all = uniqueFindings([...depFindings, ...codeFindings]);
    return { findings: all };
  };

  if (subcommand === 'scan') {
    const result = doScan();
    console.log(JSON.stringify(result, null, 2));
    return;
  }

  if (subcommand === 'fix') {
    const result = doScan();
    const { applied } = applyFixes(projectRoot, result.findings);
    const report = formatReport(projectRoot, result, applied);
    writeReport(projectRoot, report);
    console.log('Fixes applied:', applied.map((f) => f.id));
    return;
  }

  if (subcommand === 'report') {
    const result = doScan();
    const report = formatReport(projectRoot, result, []);
    writeReport(projectRoot, report);
    console.log('Report generated at SECURITY_REPORT.md');
    return;
  }

  if (subcommand === 'all') {
    const result = doScan();
    const { applied } = applyFixes(projectRoot, result.findings);
    const report = formatReport(projectRoot, doScan(), applied);
    writeReport(projectRoot, report);
    console.log('All steps completed. See SECURITY_REPORT.md');
    return;
  }

  console.error(`Unknown subcommand: ${subcommand}`);
  process.exitCode = 1;
}

run();
