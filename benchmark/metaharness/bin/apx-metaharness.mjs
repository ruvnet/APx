#!/usr/bin/env node
import { readFile, stat, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { compileDarwinSuite, freezeCampaign, evaluateRun, promoteCampaign, verifyEnvelope, parseInput, makeEnvelope } from '../src/index.mjs';
import { demoFixture } from '../../src/demo.mjs';

async function read(path) {
  if (!path || path === '-') {
    const chunks = []; let bytes = 0;
    for await (const chunk of process.stdin) {
      bytes += chunk.length;
      if (bytes > 1048576) throw new Error('Input exceeds 1 MiB');
      chunks.push(chunk);
    }
    return parseInput(Buffer.concat(chunks).toString('utf8'));
  }
  const info = await stat(path);
  if (!info.isFile() || info.size > 1048576) throw new Error('Input must be a regular JSON file no larger than 1 MiB');
  return parseInput(await readFile(path, 'utf8'));
}

async function emit(value, output) {
  const text = `${JSON.stringify(value, null, 2)}\n`;
  if (!output || output === '-') process.stdout.write(text);
  else await writeFile(resolve(output), text, { flag: 'wx' });
}

function demo() {
  const pairs = [];
  for (let index = 0; index < 5; index++) {
    const parent = demoFixture({ id: `parent-${index}`, independenceId: `pair-${index}`, wallHours: 1, costUSD: 0.2 });
    const candidate = demoFixture({ id: `candidate-${index}`, independenceId: `pair-${index}`, wallHours: 0.5, costUSD: 0.1 });
    pairs.push({ parent: parent.run, candidate: candidate.run });
  }
  const fixture = demoFixture();
  const campaign = makeEnvelope('frozen-campaign', { specHash: 'synthetic-demo', manifest: fixture.manifest });
  return { notice: 'Synthetic pipeline demonstration only. No human cohort or personal APx was measured.', campaign, comparison: { pairs }, options: { iterations: 100, seed: 7 } };
}

try {
  const [command, inputPath, outputPath] = process.argv.slice(2);
  if (command === 'demo') await emit(demo(), inputPath);
  else if (command === 'compile') await emit(compileDarwinSuite(await read(inputPath)), outputPath);
  else if (command === 'freeze') await emit(freezeCampaign(await read(inputPath)), outputPath);
  else if (command === 'evaluate') await emit(evaluateRun(await read(inputPath)), outputPath);
  else if (command === 'promote') await emit(promoteCampaign(await read(inputPath)), outputPath);
  else if (command === 'verify') { verifyEnvelope(await read(inputPath)); await emit({ valid: true }, outputPath); }
  else throw new Error('Usage: apx-metaharness demo [out] | compile|freeze|evaluate|promote|verify <input|-> [out|-]');
} catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
