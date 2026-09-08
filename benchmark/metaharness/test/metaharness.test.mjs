import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { compileDarwinSuite, validateSpec, makeEnvelope, verifyEnvelope } from '../src/index.mjs';
import { evaluateRun, promoteCampaign } from '../src/index.mjs';
import { demoFixture } from '../../src/demo.mjs';

const spec = JSON.parse(await readFile(new URL('../specs/software.development.json', import.meta.url), 'utf8'));

test('development specification compiles into a native Darwin suite', () => {
  const suite = compileDarwinSuite(spec);
  assert.equal(suite.tasks.length, 1);
  assert.equal(suite.tasks[0].commit, 'DEVELOPMENT-UNPINNED');
  assert.equal(suite.tasks[0].repo, '.');
  assert.match(suite.taskHash, /^[0-9a-f]{64}$/);
  assert.ok(suite.tasks[0].tags.includes('not-certified'));
});

test('selection and holdout identities must remain separate', () => assert.throws(() => validateSpec({ ...spec, holdoutId: spec.selectionId }), /must differ/));
test('duplicate task identities are rejected', () => assert.throws(() => validateSpec({ ...spec, tasks: [spec.tasks[0], structuredClone(spec.tasks[0])] }), /duplicates/));
test('source pin must be explicit or visibly development only', () => {
  assert.throws(() => validateSpec({ ...spec, sourceCommit: 'main' }), /sourceCommit/);
  assert.doesNotThrow(() => validateSpec({ ...spec, sourceCommit: 'a'.repeat(40) }));
});
test('commands remain bounded to one line', () => {
  const changed = structuredClone(spec); changed.tasks[0].publicTestCommand = 'node test\nwhoami';
  assert.throws(() => validateSpec(changed), /one line/);
});
test('tampered envelopes fail verification', () => {
  const envelope = makeEnvelope('evaluation', { accepted: 1 });
  assert.equal(verifyEnvelope(envelope), true);
  envelope.payload.accepted = 2;
  assert.throws(() => verifyEnvelope(envelope), /hash mismatch/);
});
test('CLI demo creates five paired synthetic campaigns', () => {
  const result = spawnSync(process.execPath, ['metaharness/bin/apx-metaharness.mjs', 'demo'], { cwd: new URL('../..', import.meta.url), encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.comparison.pairs.length, 5);
  assert.match(output.notice, /Synthetic/);
});

test('CLI demo pipes through the promotion gate', () => {
  const demo = spawnSync(process.execPath, ['metaharness/bin/apx-metaharness.mjs', 'demo'], { cwd: new URL('../..', import.meta.url), encoding: 'utf8' });
  const result = spawnSync(process.execPath, ['metaharness/bin/apx-metaharness.mjs', 'promote', '-'], { cwd: new URL('../..', import.meta.url), input: demo.stdout, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const output = JSON.parse(result.stdout);
  assert.equal(output.payload.result.decision, 'PROMOTE');
  assert.equal(output.payload.result.status, 'synthetic');
  assert.equal(output.payload.result.deployAuthorized, false);
});

test('evaluation envelope binds a scored result to its frozen campaign', () => {
  const fixture = demoFixture();
  const campaign = makeEnvelope('frozen-campaign', { specHash: 'a'.repeat(64), manifest: fixture.manifest });
  const result = evaluateRun({ campaign, run: fixture.run });
  assert.equal(result.payload.campaignHash, campaign.hash);
  assert.equal(result.payload.result.AP, 9);
  assert.equal(verifyEnvelope(result), true);
});

test('promotion pipeline requires and evaluates five paired campaigns', () => {
  const campaign = makeEnvelope('frozen-campaign', { specHash: 'a'.repeat(64), manifest: demoFixture().manifest });
  const pairs = Array.from({ length: 5 }, (_, index) => ({
    parent: demoFixture({ id: `parent-${index}`, independenceId: `pair-${index}`, wallHours: 1, costUSD: 0.2 }).run,
    candidate: demoFixture({ id: `candidate-${index}`, independenceId: `pair-${index}`, wallHours: 0.5, costUSD: 0.1 }).run,
  }));
  const decision = promoteCampaign({ campaign, comparison: { pairs }, options: { iterations: 100, seed: 7 } });
  assert.equal(decision.payload.result.decision, 'PROMOTE');
  assert.equal(decision.payload.result.deployAuthorized, false);
  assert.equal(verifyEnvelope(decision), true);
});
