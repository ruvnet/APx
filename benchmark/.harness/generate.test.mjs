import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { canonicalise, hashTasks, makeSuite, parseArgs } from './generate.mjs';

const timestamp = '2026-09-07T00:00:00.000Z';
test('no implicit commit or WORKDIR fallback', () => assert.throws(() => makeSuite({ createdAt: timestamp }), /explicit/));
test('malformed, all uppercase, or abbreviated commits fail', () => {
  for (const commit of ['abc', 'G'.repeat(40), 'A'.repeat(40), 'WORKDIR']) assert.throws(() => makeSuite({ commit, createdAt: timestamp }), /explicit/);
});
test('development fixture is explicitly unpinned, non holdout, and not certified', () => {
  const suite = makeSuite({ development: true, createdAt: timestamp });
  assert.equal(suite.tasks[0].commit, 'DEVELOPMENT-UNPINNED');
  assert.equal(suite.tasks[0].repo, '.');
  assert.ok(suite.tasks[0].tags.includes('not-certified'));
  assert.equal(suite.tasks[0].hiddenTestCommand, suite.tasks[0].publicTestCommand);
});
test('explicit commit pin is included in task hash', () => {
  const a = makeSuite({ commit: 'a'.repeat(40), createdAt: timestamp });
  const b = makeSuite({ commit: 'b'.repeat(40), createdAt: timestamp });
  assert.equal(a.tasks[0].commit, 'a'.repeat(40));
  assert.notEqual(a.taskHash, b.taskHash);
});
test('development cannot be combined with a commit', () => assert.throws(() => makeSuite({ development: true, commit: 'a'.repeat(40) }), /not both/));
test('hash algorithm matches exact sorted JSON SHA256', () => {
  const input = [{ b: { z: 3, a: 1 }, a: [2, 1] }];
  assert.equal(hashTasks(input), createHash('sha256').update('[{"a":[2,1],"b":{"a":1,"z":3}}]').digest('hex'));
  assert.deepEqual(canonicalise(input), [{ a: [2, 1], b: { a: 1, z: 3 } }]);
});
test('array task order remains material', () => assert.notEqual(hashTasks([{ id: 1 }, { id: 2 }]), hashTasks([{ id: 2 }, { id: 1 }])));
test('suite has exactly the native fields', () => {
  const suite = makeSuite({ development: true, createdAt: timestamp });
  assert.deepEqual(Object.keys(suite).sort(), ['createdAt', 'id', 'taskHash', 'tasks', 'version']);
  assert.equal(suite.taskHash, hashTasks(suite.tasks));
});
test('unknown, duplicate, and missing CLI options fail', () => {
  assert.throws(() => parseArgs(['--unknown']), /Unknown/);
  assert.throws(() => parseArgs(['--development', '--development']), /Duplicate/);
  assert.throws(() => parseArgs(['--commit']), /Missing/);
});
test('timestamp must be canonical UTC', () => assert.throws(() => makeSuite({ development: true, createdAt: 'yesterday' }), /canonical/));
