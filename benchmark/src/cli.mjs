#!/usr/bin/env node
import { readFile, stat } from 'node:fs/promises';
import { LIMITS, parseBoundedJSON, evaluate, validateRun, compareCampaigns } from './core.mjs';
import { runDemo } from './demo.mjs';

async function readInput(path) {
  if (path && path !== '-') {
    const info = await stat(path);
    if (!info.isFile() || info.size > LIMITS.bytes) throw new Error('Input must be a regular JSON file <= 1 MiB');
    return parseBoundedJSON(await readFile(path, 'utf8'));
  }
  const chunks = []; let bytes = 0;
  for await (const chunk of process.stdin) { bytes += chunk.length; if (bytes > LIMITS.bytes) throw new Error('Input exceeds 1 MiB'); chunks.push(chunk); }
  return parseBoundedJSON(Buffer.concat(chunks).toString('utf8'));
}

try {
  const [command, path] = process.argv.slice(2);
  let result;
  if (command === 'demo') result = runDemo();
  else if (['evaluate', 'validate', 'promote'].includes(command)) {
    const input = await readInput(path);
    result = command === 'evaluate' ? evaluate(input.manifest, input.run) : command === 'validate' ? validateRun(input.manifest, input.run) : compareCampaigns(input.manifest, input.comparison, input.options);
  } else throw new Error('Usage: node src/cli.mjs demo | evaluate [file|-] | validate [file|-] | promote [file|-]');
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
} catch (error) { process.stderr.write(`${error.message}\n`); process.exitCode = 1; }
