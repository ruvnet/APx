import { freezeManifest, evaluate, compareCampaigns, parseBoundedJSON, sha256, guardStructured } from '../../src/core.mjs';

const SPEC_SCHEMA = 'apx.metaharness/v1';
const ENVELOPE_SCHEMA = 'apx.metaharness-envelope/v1';
const HEX40 = /^[0-9a-f]{40}$/;
const RESERVED = new Set(['__proto__', 'constructor', 'prototype']);

function fail(message) { throw new Error(`APx MetaHarness: ${message}`); }
function object(value, path) { if (!value || typeof value !== 'object' || Array.isArray(value)) fail(`${path} must be an object`); }
function string(value, path, max = 4096) { if (typeof value !== 'string' || !value.trim() || value.length > max) fail(`${path} must be a nonempty string no longer than ${max} characters`); }
function identifier(value, path) { string(value, path, 256); if (RESERVED.has(value)) fail(`${path} uses a reserved identifier`); }
function array(value, path, min = 0, max = 1000) { if (!Array.isArray(value) || value.length < min || value.length > max) fail(`${path} must contain ${min} through ${max} entries`); }
function unique(values, path) { if (new Set(values).size !== values.length) fail(`${path} contains duplicates`); }
function command(value, path) { string(value, path, 1024); if (/[\r\n]/.test(value)) fail(`${path} must be one line`); }
function stringArray(value, path, min = 0) { array(value, path, min, 100); value.forEach((item, index) => string(item, `${path}[${index}]`, 512)); }

export function validateSpec(input) {
  guardStructured(input);
  const spec = structuredClone(input);
  object(spec, 'spec');
  if (spec.schema !== SPEC_SCHEMA) fail(`schema must be ${SPEC_SCHEMA}`);
  identifier(spec.id, 'id'); string(spec.version, 'version', 64);
  if (!Number.isFinite(Date.parse(spec.createdAt)) || new Date(spec.createdAt).toISOString() !== spec.createdAt) fail('createdAt must be canonical UTC');
  if (spec.sourceCommit !== 'DEVELOPMENT-UNPINNED' && !HEX40.test(spec.sourceCommit)) fail('sourceCommit must be DEVELOPMENT-UNPINNED or a lowercase 40 character commit SHA');
  string(spec.repository, 'repository', 512);
  if (!['selection', 'holdout'].includes(spec.partition)) fail('partition must be selection or holdout');
  identifier(spec.selectionId, 'selectionId'); identifier(spec.holdoutId, 'holdoutId');
  if (spec.selectionId === spec.holdoutId) fail('selectionId and holdoutId must differ');
  array(spec.tasks, 'tasks', 1, 1000);
  for (const [index, task] of spec.tasks.entries()) {
    const path = `tasks[${index}]`; object(task, path);
    identifier(task.id, `${path}.id`); identifier(task.classId, `${path}.classId`);
    string(task.title, `${path}.title`, 512); string(task.prompt, `${path}.prompt`, 12000);
    stringArray(task.acceptanceCriteria, `${path}.acceptanceCriteria`, 1);
    command(task.publicTestCommand, `${path}.publicTestCommand`);
    command(task.hiddenTestCommand, `${path}.hiddenTestCommand`);
    command(task.regressionTestCommand, `${path}.regressionTestCommand`);
    if (!Number.isInteger(task.timeoutMs) || task.timeoutMs < 1000 || task.timeoutMs > 3600000) fail(`${path}.timeoutMs must be an integer from 1000 through 3600000`);
    if (typeof task.maxCostUsd !== 'number' || !Number.isFinite(task.maxCostUsd) || task.maxCostUsd < 0 || task.maxCostUsd > 1000000) fail(`${path}.maxCostUsd must be finite and nonnegative`);
    stringArray(task.allowedMutationFiles, `${path}.allowedMutationFiles`, 1);
    stringArray(task.blockedFiles, `${path}.blockedFiles`, 1);
    stringArray(task.tags, `${path}.tags`);
    if (!Number.isInteger(task.difficulty) || task.difficulty < 1 || task.difficulty > 5) fail(`${path}.difficulty must be an integer from 1 through 5`);
  }
  unique(spec.tasks.map(task => task.id), 'task ids');
  return spec;
}

export function compileDarwinSuite(input) {
  const spec = validateSpec(input);
  const development = spec.sourceCommit === 'DEVELOPMENT-UNPINNED';
  const tasks = spec.tasks.map(task => ({
    id: task.id,
    repo: spec.repository,
    commit: spec.sourceCommit,
    title: task.title,
    prompt: `${task.prompt}\n\nAcceptance criteria:\n${task.acceptanceCriteria.map(item => `* ${item}`).join('\n')}`,
    publicTestCommand: task.publicTestCommand,
    hiddenTestCommand: task.hiddenTestCommand,
    regressionTestCommand: task.regressionTestCommand,
    timeoutMs: task.timeoutMs,
    maxCostUsd: task.maxCostUsd,
    allowedMutationFiles: task.allowedMutationFiles,
    blockedFiles: task.blockedFiles,
    successCriteria: task.acceptanceCriteria,
    difficulty: task.difficulty,
    tags: [...task.tags, 'apx-metaharness', spec.partition, development ? 'development-unpinned' : 'commit-pinned', 'not-certified'],
  }));
  return { id: `${spec.id}-${spec.partition}`, version: spec.version, createdAt: spec.createdAt, taskHash: sha256(tasks), tasks };
}

export function freezeCampaign({ spec: rawSpec, baseline, evaluator, environment }) {
  const spec = validateSpec(rawSpec);
  object(baseline, 'baseline'); object(evaluator, 'evaluator'); object(environment, 'environment');
  const manifest = freezeManifest({
    schemaVersion: 'apx/0.1',
    suite: { id: spec.id, version: spec.version, selectionId: spec.selectionId, holdoutId: spec.holdoutId, partition: spec.partition, slots: spec.tasks.map(task => ({ id: task.id, classId: task.classId })) },
    baseline: structuredClone(baseline),
    evaluator: structuredClone(evaluator),
    environment: structuredClone(environment),
  });
  return makeEnvelope('frozen-campaign', { specHash: sha256(spec), manifest });
}

export function makeEnvelope(kind, payload) {
  identifier(kind, 'envelope kind');
  guardStructured(payload);
  const body = { schema: ENVELOPE_SCHEMA, kind, createdAt: new Date().toISOString(), payload };
  return { ...body, hash: sha256(body) };
}

export function verifyEnvelope(envelope) {
  guardStructured(envelope);
  object(envelope, 'envelope');
  if (envelope.schema !== ENVELOPE_SCHEMA) fail(`envelope schema must be ${ENVELOPE_SCHEMA}`);
  identifier(envelope.kind, 'envelope.kind'); string(envelope.createdAt, 'envelope.createdAt', 64);
  if (!Number.isFinite(Date.parse(envelope.createdAt))) fail('envelope.createdAt must be a timestamp');
  string(envelope.hash, 'envelope.hash', 64);
  const { hash, ...body } = envelope;
  if (sha256(body) !== hash) fail('envelope hash mismatch');
  return true;
}

export function evaluateRun({ campaign, run }) {
  verifyEnvelope(campaign);
  if (campaign.kind !== 'frozen-campaign') fail('campaign must be a frozen-campaign envelope');
  return makeEnvelope('evaluation', { campaignHash: campaign.hash, result: evaluate(campaign.payload.manifest, run) });
}

export function promoteCampaign({ campaign, comparison, options }) {
  verifyEnvelope(campaign);
  if (campaign.kind !== 'frozen-campaign') fail('campaign must be a frozen-campaign envelope');
  return makeEnvelope('promotion-decision', { campaignHash: campaign.hash, result: compareCampaigns(campaign.payload.manifest, comparison, options) });
}

export function parseInput(text) { return parseBoundedJSON(text); }
