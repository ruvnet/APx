#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const UPSTREAM = Object.freeze({
  package: '@metaharness/darwin',
  version: '0.10.2',
  sourceCommit: 'd5833dc6512ac1adeeef91a331c29055cd8a4dbb',
  source: 'https://github.com/ruvnet/metaharness/blob/d5833dc6512ac1adeeef91a331c29055cd8a4dbb/packages/darwin-mode/src/bench/suite.ts',
});

// Exact upstream hashTasks algorithm: sorted object keys, preserved array order.
export function canonicalise(value) {
  if (Array.isArray(value)) return value.map(canonicalise);
  if (value && typeof value === 'object') {
    const result = {};
    for (const key of Object.keys(value).sort()) result[key] = canonicalise(value[key]);
    return result;
  }
  return value;
}

export function hashTasks(tasks) {
  return createHash('sha256').update(JSON.stringify(canonicalise(tasks))).digest('hex');
}

export function makeSuite({ commit, development = false, createdAt = new Date().toISOString() }) {
  if (development && commit) throw new Error('Choose --development or --commit, not both');
  if (!development && !/^[0-9a-f]{40}$/.test(commit ?? '')) {
    throw new Error('An explicit lowercase 40 character --commit SHA is required; use --development only for an uncertified local smoke fixture');
  }
  if (!Number.isFinite(Date.parse(createdAt)) || new Date(createdAt).toISOString() !== createdAt) {
    throw new Error('createdAt must be a canonical UTC ISO timestamp');
  }
  const tasks = [{
    id: 'apx-kernel-invariants',
    repo: '.',
    commit: development ? 'DEVELOPMENT-UNPINNED' : commit,
    title: 'APx kernel invariants remain true',
    prompt: 'Preserve the APx arithmetic, failure inclusive human calibration, duplicate credit exclusion, evidence gates, bounded input, and promotion safety invariants. This is a visible regression smoke task, not an independent occupational holdout or a human productivity measurement.',
    publicTestCommand: 'node --test test/core.test.mjs',
    hiddenTestCommand: 'node --test test/core.test.mjs',
    regressionTestCommand: 'node --test',
    timeoutMs: 120000,
    maxCostUsd: 0,
    allowedMutationFiles: ['src/core.mjs', 'src/metrics.mjs', 'src/adapters.mjs'],
    blockedFiles: ['test/**', '.harness/**', '.env', '.env.*', '.git/**', 'package.json', 'package-lock.json', 'pnpm-lock.yaml', 'yarn.lock', '.github/workflows/**'],
    successCriteria: [
      'All visible APx kernel tests pass',
      'The complete local regression suite passes',
      'Synthetic fixtures never certify real human productivity',
      'No protected test, manifest, or benchmark file changes',
      'No models, credentials, external effects, or paid execution are used',
    ],
    difficulty: 2,
    tags: ['apx', 'kernel-invariants', 'build-governance', 'visible-smoke', 'no-independent-holdout', 'not-certified', development ? 'development-unpinned' : 'commit-pinned'],
  }];
  return {
    id: development ? 'apx-development-smoke' : 'apx-kernel-regression',
    version: '0.1.0', createdAt, taskHash: hashTasks(tasks), tasks,
  };
}

export function parseArgs(argv) {
  const options = { repoPath: process.cwd(), output: '.harness/bench.json', development: false };
  const names = { '--repo-path': 'repoPath', '--out': 'output', '--commit': 'commit', '--created-at': 'createdAt' };
  const seen = new Set();
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index];
    if (seen.has(arg)) throw new Error(`Duplicate option: ${arg}`);
    seen.add(arg);
    if (arg === '--development') options.development = true;
    else if (names[arg]) {
      const value = argv[++index];
      if (!value || value.startsWith('--')) throw new Error(`Missing value for ${arg}`);
      options[names[arg]] = value;
    } else throw new Error(`Unknown option: ${arg}`);
  }
  return options;
}

export async function generate(options) {
  const repoPath = resolve(options.repoPath);
  const suite = makeSuite(options);
  const manifest = JSON.parse(await readFile(resolve(repoPath, 'package.json'), 'utf8'));
  if (manifest.name !== '@ruvnet/apx-benchmark') throw new Error('repo-path must point to the APx benchmark package');
  await readFile(resolve(repoPath, 'test/core.test.mjs'), 'utf8');
  if (!options.development) {
    const git = args => execFileSync('git', ['-C', repoPath, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
    if (git(['rev-parse', 'HEAD']) !== options.commit) throw new Error('The supplied commit must match the current repository HEAD');
    if (git(['status', '--porcelain', '--', '.'])) throw new Error('Pinned suite generation requires a clean APx package worktree');
  }
  const output = resolve(options.output);
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, `${JSON.stringify(suite, null, 2)}\n`, { flag: 'wx' });
  const evidence = {
    schema: 'apx.native-suite-assurance/v1',
    upstream: UPSTREAM,
    taskHash: suite.taskHash,
    commit: suite.tasks[0].commit,
    certified: false,
    independentHoldout: false,
    scope: 'Native Darwin coding-suite structure and public APx regression checks only',
    publicationClaim: 'No personal AP, APx, speedup, human baseline, native evolution, or live Autogenous integration was measured',
    note: 'The required hiddenTestCommand repeats the visible test. It is not hidden evidence. maxCostUsd is a zero spend ceiling, not measured cost. Run from the APx package root because task.repo is dot.',
    nativeVerifier: { status: 'not-run-by-generator', command: `npx -y ${UPSTREAM.package}@${UPSTREAM.version} bench verify .harness/${basename(output)}` },
  };
  await writeFile(`${output}.assurance.json`, `${JSON.stringify(evidence, null, 2)}\n`, { flag: 'wx' });
  return { output, taskHash: suite.taskHash, tasks: suite.tasks.length, development: options.development, certified: false };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { process.stdout.write(`${JSON.stringify(await generate(parseArgs(process.argv.slice(2))), null, 2)}\n`); }
  catch (error) { process.stderr.write(`APx native suite: ${error.message}\n`); process.exitCode = 1; }
}
