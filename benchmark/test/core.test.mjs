import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { Readable, Writable } from 'node:stream';
import { evaluate, validateManifest, validateRun, freezeManifest, sha256, canonical, compareCampaigns, parseBoundedJSON, LIMITS } from '../src/core.mjs';
import { powerMetrics, exponentToPower } from '../src/metrics.mjs';
import { demoFixture, runToyTasks, runDemo } from '../src/demo.mjs';
import { metaharnessAdapter, autogenousAdapter, importMeter, importRuclipReceipt } from '../src/adapters.mjs';
import { handleRpc, serve } from '../src/mcp.mjs';

const fixture = () => demoFixture();
const score = fixture => evaluate(fixture.manifest, fixture.run);
const mutate = fn => { const value = fixture(); fn(value); return value; };
const freeze = value => { value.manifest = freezeManifest(value.manifest); for (const key of ['suite', 'baseline', 'evaluator', 'environment']) value.run[`${key}Hash`] = value.manifest[key].hash; return value; };
const measuredRun = f => {
  f.run.kind = 'measured';
  for (const outcome of f.run.outcomes) outcome.provenance = [{ id: `adjudication-${outcome.slotId}`, kind: 'human-adjudication', verification: 'verified', independent: true, decision: outcome.accepted ? 'accepted' : 'rejected', reviewerId: 'independent-reviewer', hash: sha256(`verdict-${outcome.slotId}`), slotId: outcome.slotId, artifactHash: outcome.artifactHash, evaluatorHash: f.manifest.evaluator.hash, runId: f.run.id }];
  return f;
};
const measuredFixture = () => {
  const f = fixture(), { baseline, evaluator } = f.manifest;
  baseline.kind = 'measured'; baseline.cohort.participantIds = ['participant-1'];
  baseline.protocol = { id: 'calibration-protocol-1', version: '1', predeclaredAt: '2026-09-01T00:00:00Z', timeBoundary: 'single-worker elapsed complete attempt including retries and wait', acceptanceRule: 'same frozen acceptance criteria', evaluatorId: evaluator.id, evaluatorHash: evaluator.hash };
  for (const attempt of baseline.attempts) {
    attempt.participantId = 'participant-1'; attempt.provenanceHash = sha256(`human-log-${attempt.id}`);
    attempt.adjudication = { kind: 'human-adjudication', independent: true, reviewerId: 'independent-reviewer', hash: sha256(`human-verdict-${attempt.id}`), attemptId: attempt.id, participantId: attempt.participantId, evaluatorId: evaluator.id, evaluatorHash: evaluator.hash, provenanceHash: attempt.provenanceHash, decision: attempt.accepted ? 'accepted' : 'rejected' };
  }
  return measuredRun(freeze(f));
};
function comparison(count = 5) {
  const manifest = fixture().manifest;
  const pairs = Array.from({ length: count }, (_, index) => ({
    parent: demoFixture({ id: `p-${index}`, independenceId: `pair-${index}`, wallHours: 0.5 }).run,
    candidate: demoFixture({ id: `c-${index}`, independenceId: `pair-${index}`, wallHours: 0.25 }).run
  }));
  return { manifest, input: { pairs } };
}

test('AP uses failure-inclusive human calibration and observation wall time', () => {
  const f = fixture(), result = score(f);
  assert.equal(validateManifest(f.manifest).calibration['financial-reconciliation'].referenceHumanHours, 1.5);
  assert.equal(result.creditedHumanHours, 4.5); assert.equal(result.AP, 9); assert.equal(result.APx, Math.log2(9));
});
test('one reference worker maps to AP 1, exponent 0', () => assert.deepEqual(powerMetrics(8, 8), { AP: 1, APx: 0 }));
test('doublings map to integer exponents', () => { for (let x = -5; x <= 10; x++) assert.equal(powerMetrics(2 ** x, 1).APx, x); });
test('zero accepted work yields null exponent and null unit cost', () => {
  const f = mutate(({ run }) => run.outcomes.forEach(item => { item.accepted = false; })); const result = score(f);
  assert.equal(result.AP, 0); assert.equal(result.APx, null); assert.equal(result.costPerCreditedHumanHour, null); assert.doesNotMatch(JSON.stringify(result), /Infinity|NaN/);
});
test('sums parallel agent runtime separately from observation', () => {
  const f = fixture(), original = score(f); f.run.agentRuntimeHours = 800;
  const result = score(f); assert.equal(result.rawRuntimeDays, 100); assert.equal(result.AP, original.AP);
});
test('supervision and human leverage use person hours separately', () => { const result = score(fixture()); assert.equal(result.supervisionHours, 0.05); assert.equal(result.humanLeverage, 90); });
test('zero supervision is undefined leverage, not infinite', () => { const f = mutate(({ run }) => { run.humanReviewHours = 0; run.assistanceMode = 'autonomous'; run.wallBreakdown.executionHours += run.wallBreakdown.reviewHours; run.wallBreakdown.reviewHours = 0; }); assert.equal(score(f).humanLeverage, null); });
test('synthetic examples can never certify a personal productivity ratio', () => { const result = score(fixture()); assert.equal(result.status, 'synthetic'); assert.equal(result.certified, false); });
test('measured baselines and receipts remain uncertified pilots', () => {
  const f = measuredFixture();
  assert.equal(score(f).status, 'pilot'); assert.equal(score(f).certified, false);
});
test('synthetic baseline dominates measured run label', () => { const f = measuredRun(fixture()); assert.equal(score(f).status, 'synthetic'); });

for (const [name, change, expected] of [
  ['unaccepted result', item => { item.accepted = false; }, 'not accepted'],
  ['quality below threshold', item => { item.quality = 0.79; }, 'quality below threshold'],
  ['failed safety', item => { item.safety = 'fail'; }, 'safety not passed'],
  ['unknown safety', item => { item.safety = 'unknown'; }, 'safety not passed'],
  ['missing artifact identity', item => { item.artifactHash = null; }, 'missing artifact identity'],
  ['missing deliverable identity', item => { item.deliverableId = null; }, 'missing artifact identity'],
  ['empty provenance', item => { item.provenance = []; }, 'missing verified adjudication or test receipt'],
  ['unreviewed evidence', item => { item.provenance[0].verification = 'unreviewed'; }, 'missing verified adjudication or test receipt'],
  ['raw video presence', item => { item.provenance[0].kind = 'ruclip-clip'; }, 'missing verified adjudication or test receipt']
]) test(`${name} receives zero credit`, () => { const f = mutate(({ run }) => change(run.outcomes[0])); const result = score(f); assert.equal(result.acceptedSlots, 2); assert.equal(result.excluded[0].reason, expected); });
test('quality exactly at threshold earns credit', () => { const f = mutate(({ run }) => { run.outcomes[0].quality = 0.8; }); assert.equal(score(f).acceptedSlots, 3); });
test('consistent duplicate deliverable IDs earn credit once', () => { const f = mutate(({ run }) => { run.outcomes[1].deliverableId = run.outcomes[0].deliverableId; run.outcomes[1].artifactHash = run.outcomes[0].artifactHash; }); assert.equal(score(f).acceptedSlots, 2); });
test('duplicate artifact hashes earn credit once across different IDs', () => { const f = mutate(({ run }) => { run.outcomes[1].artifactHash = run.outcomes[0].artifactHash; }); assert.equal(score(f).acceptedSlots, 2); });
test('dedup is deterministic regardless of outcome order', () => { const f = mutate(({ run }) => { run.outcomes[1].artifactHash = run.outcomes[0].artifactHash; }); const first = score(f); f.run.outcomes.reverse(); assert.deepEqual(score(f).credited, first.credited); });
test('failed duplicate cannot consume credit before valid output', () => { const f = mutate(({ run }) => { run.outcomes[0].accepted = false; run.outcomes[1].artifactHash = run.outcomes[0].artifactHash; }); assert.equal(score(f).acceptedSlots, 2); });
test('policy violations block official AP and APx but preserve diagnostic gated work', () => { const f = mutate(({ run }) => { run.policyViolations = ['unauthorized tool use']; }); const result = score(f); assert.equal(result.eligibility, 'INELIGIBLE'); assert.equal(result.AP, null); assert.equal(result.APx, null); assert.equal(result.diagnostic.AP, 9); });

for (const [name, mutation] of [
  ['negative cost', ({ run }) => { run.costUSD = -1; }],
  ['unknown cost', ({ run }) => { run.costUSD = null; }],
  ['missing cost', ({ run }) => { delete run.costUSD; }],
  ['NaN cost', ({ run }) => { run.costUSD = NaN; }],
  ['infinite wall time', ({ run }) => { run.wallHours = Infinity; }],
  ['zero wall time', ({ run }) => { run.wallHours = 0; }],
  ['negative agent runtime', ({ run }) => { run.agentRuntimeHours = -1; }],
  ['quality above one', ({ run }) => { run.outcomes[0].quality = 1.1; }],
  ['quality below zero', ({ run }) => { run.outcomes[0].quality = -0.1; }],
  ['missing assistance mode', ({ run }) => { delete run.assistanceMode; }],
  ['autonomous mode hiding review', ({ run }) => { run.assistanceMode = 'autonomous'; }],
  ['wall segments omit blocking wait', ({ run }) => { delete run.wallBreakdown.blockingWaitHours; }],
  ['wall segments do not sum', ({ run }) => { run.wallBreakdown.executionHours = 10; }],
  ['missing frozen task', ({ run }) => { run.outcomes.pop(); }],
  ['duplicate task slot', ({ run }) => { run.outcomes[1].slotId = run.outcomes[0].slotId; }],
  ['extra unknown task slot', ({ run }) => { run.outcomes[0].slotId = 'unknown-task'; }],
  ['invalid artifact hash', ({ run }) => { run.outcomes[0].artifactHash = 'abc'; }],
  ['missing policy violation field', ({ run }) => { delete run.policyViolations; }],
  ['forged suite hash', ({ run }) => { run.suiteHash = '0'.repeat(64); }],
  ['forged baseline hash', ({ run }) => { run.baselineHash = '0'.repeat(64); }],
  ['forged evaluator hash', ({ run }) => { run.evaluatorHash = '0'.repeat(64); }],
  ['forged environment hash', ({ run }) => { run.environmentHash = '0'.repeat(64); }],
  ['edited frozen baseline', ({ manifest }) => { manifest.baseline.attempts[0].hours = 100; }],
  ['edited frozen evaluator', ({ manifest }) => { manifest.evaluator.qualityThreshold = 0.1; }],
  ['unidentified provenance reviewer', ({ run }) => { run.outcomes[0].provenance[0].kind = 'human-adjudication'; }],
  ['duplicate provenance IDs', ({ run }) => { run.outcomes[0].provenance.push(structuredClone(run.outcomes[0].provenance[0])); }]
]) test(`rejects ${name}`, () => assert.throws(() => score(mutate(mutation)), /APx validation/));

test('cannot omit a failed predeclared baseline attempt', () => { const f = freeze(mutate(({ manifest }) => { manifest.baseline.attempts.pop(); })); assert.throws(() => score(f), /every predeclared attempt/); });
test('cannot calibrate a class with no human successes', () => { const f = freeze(mutate(({ manifest }) => { manifest.baseline.attempts[0].accepted = false; })); assert.throws(() => score(f), /no accepted attempts/); });
test('baseline cohort tools are explicit', () => { const f = freeze(mutate(({ manifest }) => { delete manifest.baseline.cohort.tools; })); assert.throws(() => score(f), /cohort.tools/); });
test('holdout and selection IDs cannot coincide', () => { const f = freeze(mutate(({ manifest }) => { manifest.suite.selectionId = manifest.suite.holdoutId; })); assert.throws(() => score(f), /separate/); });
test('task set has its own verified digest', () => { const f = fixture(); f.manifest.suite.taskSetHash = '0'.repeat(64); const { hash, ...suite } = f.manifest.suite; f.manifest.suite.hash = sha256(suite); assert.throws(() => validateManifest(f.manifest), /taskSetHash/); });
test('canonical hash is order independent for object properties', () => assert.equal(sha256({ b: 2, a: { d: 4, c: 3 } }), sha256({ a: { c: 3, d: 4 }, b: 2 })));
test('canonical hash preserves array task order', () => assert.notEqual(sha256([1, 2]), sha256([2, 1])));
test('canonical serialization rejects NaN', () => assert.throws(() => canonical({ x: NaN }), /not finite/));
test('browser arithmetic rejects invalid values', () => { for (const args of [[-1, 1], [1, 0], [NaN, 1], [1, Infinity]]) assert.throws(() => powerMetrics(...args)); });
test('browser inverse exponent handles underflow and overflow', () => { assert.equal(exponentToPower(4), 16); assert.throws(() => exponentToPower(2000)); assert.throws(() => exponentToPower(-2000)); });

test('five independent paired campaigns yield conditional bootstrap interval and promotion', () => { const { manifest, input } = comparison(); const result = compareCampaigns(manifest, input); assert.equal(result.decision, 'PROMOTE'); assert.equal(result.deltaAPx, 1); assert.equal(result.interval.lower, 1); assert.equal(result.interval.upper, 1); assert.match(result.interval.conditionalOn, /excludes baseline/); assert.equal(result.deployAuthorized, false); assert.equal(result.certified, false); });
test('fewer than five campaigns cannot promote', () => { const { manifest, input } = comparison(4); const result = compareCampaigns(manifest, input); assert.equal(result.decision, 'REJECT'); assert.equal(result.interval, null); });
test('campaign bootstrap is deterministic at fixed seed', () => { const { manifest, input } = comparison(); input.pairs[0].candidate = demoFixture({ id: 'c-0', independenceId: 'pair-0', wallHours: 0.3 }).run; assert.deepEqual(compareCampaigns(manifest, input), compareCampaigns(manifest, input)); });
test('identical performance cannot promote', () => { const { manifest, input } = comparison(); input.pairs.forEach(pair => { pair.candidate.wallHours = pair.parent.wallHours; pair.candidate.wallBreakdown = structuredClone(pair.parent.wallBreakdown); }); assert.equal(compareCampaigns(manifest, input).decision, 'REJECT'); });
test('duplicate independent IDs are rejected', () => { const { manifest, input } = comparison(); input.pairs[1].parent.independenceId = input.pairs[1].candidate.independenceId = input.pairs[0].parent.independenceId; assert.throws(() => compareCampaigns(manifest, input), /independent campaign IDs/); });
test('pair IDs must match', () => { const { manifest, input } = comparison(); input.pairs[0].candidate.independenceId = 'unpaired'; assert.throws(() => compareCampaigns(manifest, input), /share independenceId/); });
test('comparison rejects duplicate run IDs', () => { const { manifest, input } = comparison(); input.pairs[0].candidate.id = input.pairs[0].parent.id; assert.throws(() => compareCampaigns(manifest, input), /comparison run IDs/); });
test('comparison requires matching human assistance mode', () => { const { manifest, input } = comparison(); input.pairs[0].candidate.assistanceMode = 'supervised'; assert.throws(() => compareCampaigns(manifest, input), /assistance modes/); });
test('task regression blocks promotion despite faster aggregate', () => { const { manifest, input } = comparison(); input.pairs[0].candidate.outcomes[0].accepted = false; const result = compareCampaigns(manifest, input); assert.equal(result.decision, 'REJECT'); assert.ok(result.reasons.some(reason => reason.includes('task acceptance regression'))); });
test('quality regression blocks promotion', () => { const { manifest, input } = comparison(); input.pairs[0].candidate.outcomes[0].quality = 0.9; assert.ok(compareCampaigns(manifest, input).reasons.some(reason => reason.includes('quality regression'))); });
test('safety failure blocks promotion', () => { const { manifest, input } = comparison(); input.pairs[0].candidate.outcomes[0].safety = 'fail'; assert.ok(compareCampaigns(manifest, input).reasons.includes('candidate has safety failures')); });
test('cost regression blocks promotion', () => { const { manifest, input } = comparison(); input.pairs[0].candidate.costUSD = 2; assert.ok(compareCampaigns(manifest, input).reasons.includes('total campaign cost regression')); });
test('policy violation blocks promotion', () => { const { manifest, input } = comparison(); input.pairs[0].candidate.policyViolations = ['unapproved write']; assert.ok(compareCampaigns(manifest, input).reasons.includes('policy violation')); });
test('selection suite cannot authorize promotion', () => { const { manifest, input } = comparison(); manifest.suite.partition = 'selection'; const selection = freezeManifest(manifest); for (const pair of input.pairs) for (const run of [pair.parent, pair.candidate]) { run.partition = 'selection'; run.suiteHash = selection.suite.hash; } assert.ok(compareCampaigns(selection, input).reasons.some(reason => reason.includes('holdout suite'))); });
test('bootstrap computation is bounded', () => { const { manifest, input } = comparison(); assert.throws(() => compareCampaigns(manifest, input, { iterations: LIMITS.bootstrap + 1 })); assert.throws(() => compareCampaigns(manifest, input, { iterations: 200.5 })); });

test('toy tasks execute and pass real deterministic checks', () => { const result = runToyTasks(); assert.equal(result.checks.length, 3); assert.ok(result.checks.every(item => item.passed)); assert.ok(result.actualRunnerMilliseconds >= 0); assert.match(result.measurementScope, /not end-to-end/); });
test('demo separates actual toy milliseconds from synthetic workflow hours', () => { const result = runDemo(); assert.equal(result.result.status, 'synthetic'); assert.match(result.notice, /No evidence for rUv 20x/); assert.equal(result.run.wallHours, 0.5); });
test('MetaHarness and Autogenous integrations explicitly are contract adapters', () => { const f = fixture(); for (const adapt of [metaharnessAdapter, autogenousAdapter]) { const result = adapt(f.manifest, f.run); assert.equal(result.adapter.nativeIntegration, false); assert.equal(result.result.AP, 9); } });
test('upstream unmetered zeros are unknown, not free', () => { assert.deepEqual(importMeter(0, 'unmetered'), { value: null, status: 'unknown' }); assert.deepEqual(importMeter(0, 'measured'), { value: 0, status: 'measured' }); assert.deepEqual(importMeter(123), { value: null, status: 'unknown' }); assert.throws(() => importMeter(-1, 'measured')); });
const ruclip = () => ({ jobId: 'job-1', issueId: 'issue-1', employeeId: 'agent-1', budget: { limitUSD: 10 }, approval: { status: 'approved' }, adjudication: { status: 'accepted', reviewerId: 'reviewer-1', evidenceHash: sha256('human verdict') }, costUSD: 0, costStatus: 'unmetered' });
test('ruClip requires human adjudication, not mere job completion', () => { const receipt = ruclip(); delete receipt.adjudication; assert.throws(() => importRuclipReceipt(receipt), /Independent human adjudication/); });
test('ruClip maps job issue employee budget approval into provenance', () => { const result = importRuclipReceipt(ruclip()); assert.equal(result.governance.jobId, 'job-1'); assert.equal(result.provenance.kind, 'ruclip-adjudication'); assert.equal(result.cost.value, null); assert.equal(result.adapter.nativeIntegration, false); });
test('ruClip pending approval remains a policy violation even if work accepted', () => { const receipt = ruclip(); receipt.approval.status = 'pending'; assert.equal(importRuclipReceipt(receipt).policyViolations.length, 1); });

test('JSON input is size bounded', () => assert.throws(() => parseBoundedJSON(' '.repeat(LIMITS.bytes + 1)), /1 MiB/));
test('JSON input rejects prototype pollution keys', () => { for (const key of ['__proto__', 'constructor', 'prototype']) assert.throws(() => parseBoundedJSON(`{"${key}":{}}`), /reserved/); });
test('JSON input is depth bounded', () => assert.throws(() => parseBoundedJSON('['.repeat(34) + '0' + ']'.repeat(34)), /nesting/));
test('MCP initializes and advertises bounded evaluator tools', () => { assert.equal(handleRpc({ jsonrpc: '2.0', id: 1, method: 'initialize' }).result.serverInfo.name, 'apx-benchmark'); assert.equal(handleRpc({ jsonrpc: '2.0', id: 2, method: 'tools/list' }).result.tools.length, 3); });
test('MCP notifications produce no response', () => assert.equal(handleRpc({ jsonrpc: '2.0', method: 'notifications/initialized' }), null));
test('MCP tool returns scored content', () => { const { manifest, run } = fixture(); const response = handleRpc({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'apx_evaluate', arguments: { manifest, run } } }); assert.equal(JSON.parse(response.result.content[0].text).AP, 9); });
test('MCP unknown tool fails without invocation', () => assert.equal(handleRpc({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'shell_exec' } }).error.code, -32601));
test('MCP validation failure is a tool error', () => { const response = handleRpc({ jsonrpc: '2.0', id: 1, method: 'tools/call', params: { name: 'apx_evaluate', arguments: {} } }); assert.equal(response.result.isError, true); });
test('MCP newline stream returns JSON without log contamination', async () => { let output = ''; const writable = new Writable({ write(chunk, encoding, done) { output += chunk.toString(); done(); } }); await serve(Readable.from(['{"jsonrpc":"2.0","id":1,"method":"ping"}\n']), writable); assert.deepEqual(JSON.parse(output), { jsonrpc: '2.0', id: 1, result: {} }); });
test('MCP rejects unterminated input', async () => { await assert.rejects(serve(Readable.from(['{}']), new Writable({ write(c, e, done) { done(); } })), /newline/); });
test('CLI demo runs end to end', () => { const result = spawnSync(process.execPath, ['src/cli.mjs', 'demo'], { cwd: new URL('..', import.meta.url), encoding: 'utf8' }); assert.equal(result.status, 0, result.stderr); assert.equal(JSON.parse(result.stdout).result.AP, 9); });
test('CLI evaluate and validate accept bounded stdin JSON', () => { const f = fixture(); for (const command of ['evaluate', 'validate']) { const result = spawnSync(process.execPath, ['src/cli.mjs', command, '-'], { cwd: new URL('..', import.meta.url), input: JSON.stringify(f), encoding: 'utf8' }); assert.equal(result.status, 0, result.stderr); assert.ok(JSON.parse(result.stdout)); } });
test('CLI malformed input exits nonzero', () => { const result = spawnSync(process.execPath, ['src/cli.mjs', 'evaluate', '-'], { cwd: new URL('..', import.meta.url), input: '{bad', encoding: 'utf8' }); assert.equal(result.status, 1); assert.equal(result.stdout, ''); });

test('known safety failure on unaccepted work blocks all official metrics', () => { const f = mutate(({ run }) => { run.outcomes[0].accepted = false; run.outcomes[0].safety = 'fail'; }); const result = score(f); assert.equal(result.eligibility, 'INELIGIBLE'); assert.equal(result.AP, null); assert.equal(result.APx, null); assert.ok(result.diagnostic.AP > 0); assert.match(result.policyViolations[0], /known safety failure/); });
test('known safety failure on accepted work blocks official metrics', () => { const f = mutate(({ run }) => { run.outcomes[0].safety = 'fail'; }); assert.equal(score(f).APx, null); });
test('relabeling and rehashing a synthetic baseline cannot create a measured pilot', () => { const f = freeze(mutate(({ manifest, run }) => { manifest.baseline.kind = 'measured'; run.kind = 'measured'; })); assert.throws(() => score(f), /baseline.protocol/); });
test('relabeling a synthetic run cannot turn test receipts into measured evidence', () => { const f = mutate(({ run }) => { run.kind = 'measured'; }); assert.throws(() => score(f), /binding|independent human/); });
for (const field of ['slotId', 'artifactHash', 'evaluatorHash', 'runId']) test(`measured outcome evidence rejects mismatched ${field}`, () => { const f = measuredFixture(); f.run.outcomes[0].provenance[0][field] = 'mismatch'; assert.throws(() => score(f), /binding mismatch/); });
test('measured outcome requires a declared independent adjudicator', () => { const f = measuredFixture(); f.run.outcomes[0].provenance[0].independent = false; assert.throws(() => score(f), /independent human/); });
test('measured objective test receipt alone is insufficient in v0.1', () => { const f = measuredFixture(); f.run.outcomes[0].provenance[0].kind = 'test-receipt'; assert.throws(() => score(f), /independent human/); });
test('measured accepted output cannot omit evidence', () => { const f = measuredFixture(); f.run.outcomes[0].provenance = []; assert.throws(() => score(f), /verified independent/); });
test('measured baseline requires a declared participant', () => { const f = measuredFixture(); delete f.manifest.baseline.attempts[0].participantId; assert.throws(() => score(freeze(f)), /declared cohort participant/); });
test('measured baseline requires source provenance digest', () => { const f = measuredFixture(); delete f.manifest.baseline.attempts[0].provenanceHash; assert.throws(() => score(freeze(f)), /provenanceHash/); });
test('measured baseline requires independent adjudication', () => { const f = measuredFixture(); delete f.manifest.baseline.attempts[0].adjudication; assert.throws(() => score(freeze(f)), /adjudication/); });
test('measured baseline cannot self-adjudicate', () => { const f = measuredFixture(); f.manifest.baseline.attempts[0].adjudication.reviewerId = 'participant-1'; assert.throws(() => score(freeze(f)), /own attempt/); });
test('measured baseline binds attempt acceptance to adjudication', () => { const f = measuredFixture(); f.manifest.baseline.attempts[0].adjudication.decision = 'rejected'; assert.throws(() => score(freeze(f)), /binding mismatch/); });
test('calibration protocol evaluator binding is required', () => { const f = measuredFixture(); f.manifest.baseline.protocol.evaluatorHash = '0'.repeat(64); assert.throws(() => score(freeze(f)), /protocol evaluator binding/); });
test('calibration protocol requires predeclaration metadata', () => { const f = measuredFixture(); f.manifest.baseline.protocol.predeclaredAt = 'yesterday'; assert.throws(() => score(freeze(f)), /predeclaration timestamp/); });
test('pilot result discloses unauthenticated declared assurance and full comparison context', () => { const f = measuredFixture(), result = score(f); assert.match(result.assurance, /declared-measured/); for (const key of ['suite', 'baseline', 'evaluator', 'environment']) assert.equal(result[`${key}Hash`], f.manifest[key].hash); assert.equal(result.baselineCohort.id, f.manifest.baseline.cohort.id); assert.equal(result.calibrationProtocolId, 'calibration-protocol-1'); });
test('human review person hours cannot be less than review wall time', () => { const f = mutate(({ run }) => { run.humanReviewHours = 0.01; }); assert.throws(() => score(f), /less than elapsed reviewHours/); });
test('promotion rejects total human labor regression', () => { const { manifest, input } = comparison(); input.pairs[0].candidate.humanReviewHours = 0.2; const result = compareCampaigns(manifest, input); assert.equal(result.decision, 'REJECT'); assert.ok(result.reasons.includes('total human review hours regression')); });
test('campaign human labor cap catches increases even when aggregate is unchanged', () => { const { manifest, input } = comparison(); input.pairs[0].candidate.humanReviewHours = 0.075; input.pairs[1].candidate.humanReviewHours = 0.025; const result = compareCampaigns(manifest, input); assert.equal(result.decision, 'REJECT'); assert.ok(result.reasons.some(reason => reason.includes('campaign human labor cap exceeded'))); });
test('frozen human labor cap is enforced in promotion', () => { const { manifest, input } = comparison(); manifest.evaluator.humanReviewHoursCap = 0.04; const frozen = freezeManifest(manifest); for (const pair of input.pairs) for (const run of [pair.parent, pair.candidate]) run.evaluatorHash = frozen.evaluator.hash; assert.ok(compareCampaigns(frozen, input).reasons.some(reason => reason.includes('campaign human labor cap exceeded'))); });
test('conflicting admissible aliases A id1/hash1 B id1/hash2 C id2/hash2 cannot double count', () => { const f = mutate(({ run }) => { const [a, b, c] = run.outcomes; b.deliverableId = a.deliverableId; c.artifactHash = b.artifactHash; }); assert.throws(() => score(f), /conflicting admissible/); });
test('inadmissible conflicting identity does not poison accepted output', () => { const f = mutate(({ run }) => { run.outcomes[1].accepted = false; run.outcomes[1].deliverableId = run.outcomes[0].deliverableId; }); assert.equal(score(f).acceptedSlots, 2); });
for (const reserved of ['__proto__', 'constructor', 'prototype']) test(`direct API rejects reserved task class ${reserved}`, () => { const f = fixture(); f.manifest.suite.slots[0].classId = reserved; f.manifest.baseline.attempts[0].classId = reserved; f.manifest.baseline.attempts[1].classId = reserved; assert.throws(() => score(freeze(f)), /reserved identifier/); });
test('direct API rejects reserved slot identity', () => { const f = fixture(); f.manifest.suite.slots[0].id = '__proto__'; f.run.outcomes[0].slotId = '__proto__'; assert.throws(() => score(freeze(f)), /reserved identifier/); });
test('direct canonical hash rejects excessive nesting', () => { let value = {}; for (let i = 0; i < 35; i++) value = { child: value }; assert.throws(() => sha256(value), /nesting/); });
test('direct canonical hash rejects cycles', () => { const value = {}; value.self = value; assert.throws(() => sha256(value), /cyclic/); });
test('direct MCP function rejects deep objects before evaluation', () => { let value = {}; for (let i = 0; i < 35; i++) value = { child: value }; const result = handleRpc({ jsonrpc: '2.0', id: 1, method: 'ping', params: value }); assert.equal(result.error.code, -32600); });
test('measured accepted flag must match adjudicated decision', () => { const f = measuredFixture(); f.run.outcomes[0].provenance[0].decision = 'rejected'; assert.throws(() => score(f), /adjudication decision mismatch/); });
test('MCP invalid structured ID never leaks into an unserializable error', () => { const id = {}; id.self = id; const result = handleRpc({ jsonrpc: '2.0', id, method: 'ping' }); assert.equal(result.id, null); assert.doesNotThrow(() => JSON.stringify(result)); });
