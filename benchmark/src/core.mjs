import { createHash } from 'node:crypto';
import { powerMetrics } from './metrics.mjs';

export const VERSION = '0.1.0';
export const LIMITS = Object.freeze({ slots: 1000, attempts: 10000, campaigns: 100, provenance: 100, bytes: 1048576, bootstrap: 10000 });
const HEX = /^[a-f0-9]{64}$/;
const RESERVED = new Set(['__proto__', 'constructor', 'prototype']);
const MODES = ['autonomous', 'evaluation-only', 'supervised', 'collaborative'];
const fail = message => { throw new Error(`APx validation: ${message}`); };
const object = (value, path) => { if (!value || typeof value !== 'object' || Array.isArray(value)) fail(`${path} must be an object`); };
const str = (value, path, max = 256) => { if (typeof value !== 'string' || !value.trim() || value.length > max) fail(`${path} must be a nonempty string <= ${max} characters`); };
const identifier = (value, path) => { str(value, path); if (RESERVED.has(value)) fail(`${path} uses a reserved identifier`); };
const bool = (value, path) => { if (typeof value !== 'boolean') fail(`${path} must be boolean`); };
const number = (value, path, min = 0, max = 1e12) => { if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) fail(`${path} must be finite in [${min}, ${max}]`); };
const arr = (value, path, max, min = 0) => { if (!Array.isArray(value) || value.length < min || value.length > max) fail(`${path} must contain ${min}..${max} entries`); };
const unique = (values, path) => { if (new Set(values).size !== values.length) fail(`${path} contains duplicates`); };
const digest = (value, path) => { if (typeof value !== 'string' || !HEX.test(value)) fail(`${path} must be a SHA-256 lowercase hex digest`); };
const enumValue = (value, values, path) => { if (!values.includes(value)) fail(`${path} must be one of ${values.join(', ')}`); };
const sum = values => values.reduce((a, b) => a + b, 0);
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const checkSum = (total, terms, path) => { if (Math.abs(total - sum(terms)) > Math.max(1e-9, total * 1e-9)) fail(`${path} does not sum to total`); };

export function guardStructured(value) {
  let count = 0;
  const ancestors = new WeakSet();
  function visit(item, depth) {
    if (depth > 32 || ++count > 100000) fail('JSON nesting or node limit exceeded');
    if (typeof item === 'number' && !Number.isFinite(item)) fail('canonical value is not finite');
    if (item && typeof item === 'object') {
      if (ancestors.has(item)) fail('cyclic structured input');
      const proto = Object.getPrototypeOf(item);
      if (!Array.isArray(item) && proto !== Object.prototype && proto !== null) fail('nonplain structured input');
      ancestors.add(item);
      for (const [key, child] of Object.entries(item)) {
        if (RESERVED.has(key)) fail('reserved JSON property');
        visit(child, depth + 1);
      }
      ancestors.delete(item);
    }
  }
  visit(value, 0); return value;
}
export function canonical(value) {
  guardStructured(value);
  const encode = item => {
    if (item === null || typeof item === 'boolean' || typeof item === 'string' || typeof item === 'number') return JSON.stringify(item);
    if (Array.isArray(item)) return `[${item.map(encode).join(',')}]`;
    object(item, 'canonical value');
    return `{${Object.keys(item).sort().map(key => `${JSON.stringify(key)}:${encode(item[key])}`).join(',')}}`;
  };
  return encode(value);
}
export const sha256 = value => createHash('sha256').update(typeof value === 'string' ? value : canonical(value)).digest('hex');
const withoutHash = value => Object.fromEntries(Object.entries(value).filter(([key]) => key !== 'hash'));

/** Hashes are tamper-evidence relative to a trusted frozen manifest, not signatures. */
export function freezeManifest(input) {
  const manifest = structuredClone(input);
  manifest.suite.taskSetHash = sha256(manifest.suite.slots);
  for (const key of ['suite', 'baseline', 'evaluator', 'environment']) manifest[key].hash = sha256(withoutHash(manifest[key]));
  return manifest;
}

export function validateManifest(manifest) {
  guardStructured(manifest);
  object(manifest, 'manifest');
  if (manifest.schemaVersion !== 'apx/0.1') fail('unsupported schemaVersion');
  for (const key of ['suite', 'baseline', 'evaluator', 'environment']) {
    object(manifest[key], key);
    str(manifest[key].version, `${key}.version`);
    digest(manifest[key].hash, `${key}.hash`);
    if (sha256(withoutHash(manifest[key])) !== manifest[key].hash) fail(`${key} frozen hash mismatch`);
  }
  const { suite, baseline, evaluator, environment } = manifest;
  str(suite.id, 'suite.id'); str(suite.selectionId, 'suite.selectionId'); str(suite.holdoutId, 'suite.holdoutId');
  if (suite.selectionId === suite.holdoutId) fail('selection and holdout IDs must be separate');
  enumValue(suite.partition, ['selection', 'holdout'], 'suite.partition');
  arr(suite.slots, 'suite.slots', LIMITS.slots, 1);
  for (const slot of suite.slots) { object(slot, 'slot'); identifier(slot.id, 'slot.id'); identifier(slot.classId, 'slot.classId'); }
  unique(suite.slots.map(slot => slot.id), 'suite.slots');
  digest(suite.taskSetHash, 'taskSetHash');
  if (sha256(suite.slots) !== suite.taskSetHash) fail('taskSetHash mismatch');
  str(baseline.id, 'baseline.id'); enumValue(baseline.kind, ['synthetic', 'measured'], 'baseline.kind');
  object(baseline.cohort, 'baseline.cohort'); str(baseline.cohort.id, 'baseline.cohort.id');
  for (const field of ['tools', 'skills']) { arr(baseline.cohort[field], `cohort.${field}`, 100, 1); baseline.cohort[field].forEach(value => str(value, `cohort.${field}`)); }
  arr(baseline.predeclaredAttemptIds, 'baseline.predeclaredAttemptIds', LIMITS.attempts, 1);
  baseline.predeclaredAttemptIds.forEach(id => str(id, 'baseline attempt ID')); unique(baseline.predeclaredAttemptIds, 'baseline attempt IDs');
  arr(baseline.attempts, 'baseline.attempts', LIMITS.attempts, 1);
  for (const attempt of baseline.attempts) {
    object(attempt, 'baseline.attempt'); identifier(attempt.id, 'attempt.id'); identifier(attempt.classId, 'attempt.classId');
    number(attempt.hours, 'attempt.hours', 1e-9, 1e6); bool(attempt.accepted, 'attempt.accepted');
  }
  unique(baseline.attempts.map(attempt => attempt.id), 'baseline attempts');
  if (!same([...baseline.predeclaredAttemptIds].sort(), baseline.attempts.map(attempt => attempt.id).sort())) fail('baseline attempts must match every predeclared attempt, including failures');
  if (baseline.kind === 'measured') {
    object(baseline.protocol, 'measured baseline.protocol');
    for (const field of ['id', 'version', 'timeBoundary', 'acceptanceRule']) str(baseline.protocol[field], `baseline.protocol.${field}`, 4096);
    str(baseline.protocol.predeclaredAt, 'baseline.protocol.predeclaredAt');
    if (!/^\d{4}-\d{2}-\d{2}T/.test(baseline.protocol.predeclaredAt) || !Number.isFinite(Date.parse(baseline.protocol.predeclaredAt))) fail('calibration protocol requires a valid predeclaration timestamp');
    if (baseline.protocol.evaluatorId !== evaluator.id || baseline.protocol.evaluatorHash !== evaluator.hash) fail('calibration protocol evaluator binding mismatch');
    arr(baseline.cohort.participantIds, 'measured cohort.participantIds', LIMITS.attempts, 1);
    baseline.cohort.participantIds.forEach(id => identifier(id, 'participantId')); unique(baseline.cohort.participantIds, 'participantIds');
    for (const attempt of baseline.attempts) {
      if (!baseline.cohort.participantIds.includes(attempt.participantId)) fail('measured attempt must identify a declared cohort participant');
      digest(attempt.provenanceHash, 'measured attempt.provenanceHash');
      const evidence = attempt.adjudication; object(evidence, 'measured attempt.adjudication');
      if (evidence.independent !== true || evidence.kind !== 'human-adjudication') fail('measured baseline requires independent human adjudication');
      str(evidence.reviewerId, 'baseline adjudication.reviewerId');
      if (evidence.reviewerId === attempt.participantId) fail('baseline reviewer cannot adjudicate their own attempt');
      digest(evidence.hash, 'baseline adjudication.hash');
      if (evidence.attemptId !== attempt.id || evidence.participantId !== attempt.participantId || evidence.evaluatorId !== evaluator.id || evidence.evaluatorHash !== evaluator.hash || evidence.provenanceHash !== attempt.provenanceHash || evidence.decision !== (attempt.accepted ? 'accepted' : 'rejected')) fail('baseline adjudication binding mismatch');
    }
  }
  const classes = new Set(suite.slots.map(slot => slot.classId));
  if (baseline.attempts.some(attempt => !classes.has(attempt.classId))) fail('baseline contains a class outside the suite');
  const calibration = Object.create(null);
  for (const classId of classes) {
    const attempts = baseline.attempts.filter(attempt => attempt.classId === classId);
    const accepted = attempts.filter(attempt => attempt.accepted).length;
    if (!accepted) fail(`baseline class ${classId} has no accepted attempts; cannot calibrate`);
    calibration[classId] = { referenceHumanHours: sum(attempts.map(attempt => attempt.hours)) / accepted, attempts: attempts.length, accepted };
  }
  number(evaluator.qualityThreshold, 'evaluator.qualityThreshold', 0, 1);
  if (evaluator.humanReviewHoursCap !== undefined) number(evaluator.humanReviewHoursCap, 'evaluator.humanReviewHoursCap', 0, 1e9);
  str(evaluator.id, 'evaluator.id'); str(environment.id, 'environment.id'); str(environment.description, 'environment.description', 4096);
  return { valid: true, calibration };
}

export function validateRun(manifest, run) {
  guardStructured(run);
  validateManifest(manifest); object(run, 'run');
  str(run.id, 'run.id'); str(run.independenceId, 'run.independenceId');
  enumValue(run.kind, ['synthetic', 'measured'], 'run.kind'); enumValue(run.assistanceMode, MODES, 'assistanceMode');
  for (const key of ['suite', 'baseline', 'evaluator', 'environment']) if (run[`${key}Hash`] !== manifest[key].hash) fail(`run ${key}Hash mismatch`);
  if (run.partition !== manifest.suite.partition) fail('run partition mismatch');
  number(run.wallHours, 'wallHours', 1e-9, 1e6); number(run.agentRuntimeHours, 'agentRuntimeHours', 0, 1e9);
  number(run.humanReviewHours, 'humanReviewHours', 0, 1e9); number(run.costUSD, 'costUSD', 0, 1e12);
  if (run.assistanceMode === 'autonomous' && run.humanReviewHours !== 0) fail('autonomous mode cannot hide human review; use evaluation-only or supervised');
  object(run.wallBreakdown, 'wallBreakdown');
  const segments = ['executionHours', 'retryHours', 'reviewHours', 'blockingWaitHours', 'otherHours'];
  segments.forEach(key => number(run.wallBreakdown[key], `wallBreakdown.${key}`, 0, 1e6));
  checkSum(run.wallHours, segments.map(key => run.wallBreakdown[key]), 'wallBreakdown');
  if (run.humanReviewHours + 1e-9 < run.wallBreakdown.reviewHours) fail('humanReviewHours cannot be less than elapsed reviewHours');
  arr(run.policyViolations, 'policyViolations', 100); run.policyViolations.forEach(value => str(value, 'policy violation', 2048));
  arr(run.outcomes, 'outcomes', LIMITS.slots, 1);
  unique(run.outcomes.map(outcome => outcome.slotId), 'outcome slot IDs');
  if (!same(run.outcomes.map(outcome => outcome.slotId).sort(), manifest.suite.slots.map(slot => slot.id).sort())) fail('outcomes must include every frozen task slot, including failures');
  for (const outcome of run.outcomes) {
    object(outcome, 'outcome'); str(outcome.slotId, 'outcome.slotId'); bool(outcome.accepted, 'outcome.accepted');
    number(outcome.quality, 'outcome.quality', 0, 1); enumValue(outcome.safety, ['pass', 'fail', 'unknown'], 'outcome.safety');
    if (outcome.deliverableId !== null) str(outcome.deliverableId, 'deliverableId');
    if (outcome.artifactHash !== null) digest(outcome.artifactHash, 'artifactHash');
    arr(outcome.provenance, 'outcome.provenance', LIMITS.provenance);
    for (const evidence of outcome.provenance) {
      object(evidence, 'evidence'); str(evidence.id, 'evidence.id'); digest(evidence.hash, 'evidence.hash');
      enumValue(evidence.kind, ['test-receipt', 'human-adjudication', 'ruclip-adjudication', 'ruclip-clip'], 'evidence.kind');
      enumValue(evidence.verification, ['verified', 'unreviewed'], 'evidence.verification');
      if (['human-adjudication', 'ruclip-adjudication'].includes(evidence.kind)) str(evidence.reviewerId, 'evidence.reviewerId');
      if (run.kind === 'measured') {
        if (evidence.slotId !== outcome.slotId || evidence.artifactHash !== outcome.artifactHash || evidence.evaluatorHash !== manifest.evaluator.hash || evidence.runId !== run.id) fail('measured outcome evidence binding mismatch');
        if (!['human-adjudication', 'ruclip-adjudication'].includes(evidence.kind) || evidence.independent !== true) fail('measured outcomes require independent human adjudication in v0.1');
        if (evidence.decision !== (outcome.accepted ? 'accepted' : 'rejected')) fail('measured outcome adjudication decision mismatch');
      }
    }
    if (run.kind === 'measured' && outcome.accepted && !outcome.provenance.some(evidence => evidence.verification === 'verified' && evidence.independent === true)) fail('measured accepted outcome requires verified independent adjudication');
    unique(outcome.provenance.map(evidence => evidence.id), 'evidence IDs within outcome');
  }
  return { valid: true };
}

export function evaluate(manifest, run) {
  const { calibration } = validateManifest(manifest); validateRun(manifest, run);
  const seenDeliverables = new Set(), seenArtifacts = new Set();
  const admissibleIdentityMap = new Map();
  const slotClasses = new Map(manifest.suite.slots.map(slot => [slot.id, slot.classId]));
  const credited = [], excluded = [];
  const perClass = Object.fromEntries(Object.keys(calibration).map(id => [id, { tasks: 0, credited: 0, creditedHumanHours: 0, acceptedQualitySum: 0, safetyFailures: 0 }]));
  for (const outcome of [...run.outcomes].sort((a, b) => a.slotId.localeCompare(b.slotId))) {
    const classId = slotClasses.get(outcome.slotId), stats = perClass[classId]; stats.tasks++;
    if (outcome.safety === 'fail') stats.safetyFailures++;
    let reason;
    if (!outcome.accepted) reason = 'not accepted';
    else if (outcome.quality < manifest.evaluator.qualityThreshold) reason = 'quality below threshold';
    else if (outcome.safety !== 'pass') reason = 'safety not passed';
    else if (!outcome.deliverableId || !outcome.artifactHash) reason = 'missing artifact identity';
    else if (!outcome.provenance.some(evidence => evidence.verification === 'verified' && evidence.kind !== 'ruclip-clip')) reason = 'missing verified adjudication or test receipt';
    if (!reason) {
      if (admissibleIdentityMap.has(outcome.deliverableId) && admissibleIdentityMap.get(outcome.deliverableId) !== outcome.artifactHash) fail('conflicting admissible deliverable to artifact mapping');
      admissibleIdentityMap.set(outcome.deliverableId, outcome.artifactHash);
      if (seenDeliverables.has(outcome.deliverableId) || seenArtifacts.has(outcome.artifactHash)) reason = 'duplicate deliverable or artifact';
    }
    if (reason) { excluded.push({ slotId: outcome.slotId, reason }); continue; }
    seenDeliverables.add(outcome.deliverableId); seenArtifacts.add(outcome.artifactHash);
    const hours = calibration[classId].referenceHumanHours;
    stats.credited++; stats.creditedHumanHours += hours; stats.acceptedQualitySum += outcome.quality;
    credited.push({ slotId: outcome.slotId, classId, referenceHumanHours: hours, artifactHash: outcome.artifactHash });
  }
  const creditedHumanHours = sum(credited.map(item => item.referenceHumanHours));
  const { AP: power, APx: exponent } = powerMetrics(creditedHumanHours, run.wallHours);
  const violations = [...run.policyViolations, ...run.outcomes.filter(outcome => outcome.safety === 'fail').map(outcome => `${outcome.slotId}: known safety failure`)];
  const eligible = violations.length === 0;
  return {
    schemaVersion: 'apx-result/0.1', version: VERSION, runId: run.id,
    suiteHash: manifest.suite.hash, baselineHash: manifest.baseline.hash, evaluatorHash: manifest.evaluator.hash, environmentHash: manifest.environment.hash,
    suiteId: manifest.suite.id, baselineId: manifest.baseline.id, baselineCohort: structuredClone(manifest.baseline.cohort), calibrationProtocolId: manifest.baseline.protocol?.id ?? null,
    assurance: 'declared-measured when labeled pilot; structural checks do not authenticate evidence, participants, reviewers, or independent measurement',
    status: manifest.baseline.kind === 'synthetic' || run.kind === 'synthetic' ? 'synthetic' : 'pilot',
    eligibility: eligible ? 'ELIGIBLE' : 'INELIGIBLE', certified: false,
    AP: eligible ? power : null, APx: eligible ? exponent : null,
    diagnostic: { AP: power, APx: exponent, note: eligible ? 'gated accepted output' : 'diagnostic only; policy violation or known safety failure blocks official APx' },
    creditedHumanHours, acceptance: credited.length / run.outcomes.length,
    acceptedSlots: credited.length, declaredSlots: run.outcomes.length, rawAcceptedSlots: run.outcomes.filter(item => item.accepted).length,
    rawRuntimeDays: run.agentRuntimeHours / 8, supervisionHours: run.humanReviewHours,
    humanLeverage: run.humanReviewHours > 0 ? creditedHumanHours / run.humanReviewHours : null,
    costUSD: run.costUSD, costPerCreditedHumanHour: creditedHumanHours > 0 ? run.costUSD / creditedHumanHours : null,
    wallHours: run.wallHours, assistanceMode: run.assistanceMode, perClass, credited, excluded,
    policyViolations: violations,
    limitation: 'Task-conditioned, cohort-conditioned reference work. Not intelligence, book counts, lines of code, or proof of human labor displacement. Hashes are not signatures or evidence authentication.'
  };
}

function rng(seed) { let state = seed >>> 0; return () => { state = (Math.imul(1664525, state) + 1013904223) >>> 0; return state / 4294967296; }; }
const quantile = (ordered, q) => ordered[Math.floor((ordered.length - 1) * q)];
const aggregatePower = results => sum(results.map(result => result.creditedHumanHours)) / sum(results.map(result => result.wallHours));

export function compareCampaigns(manifest, input, { iterations = 2000, seed = 20260907 } = {}) {
  guardStructured(input);
  validateManifest(manifest); object(input, 'campaign comparison');
  arr(input.pairs, 'pairs', LIMITS.campaigns, 1);
  number(iterations, 'iterations', 100, LIMITS.bootstrap); if (!Number.isInteger(iterations)) fail('iterations must be an integer');
  number(seed, 'seed', 0, 4294967295); if (!Number.isInteger(seed)) fail('seed must be an integer');
  const parent = [], candidate = [], independenceIds = [], allRunIds = [];
  for (const pair of input.pairs) {
    object(pair, 'pair');
    const left = evaluate(manifest, pair.parent), right = evaluate(manifest, pair.candidate);
    if (pair.parent.independenceId !== pair.candidate.independenceId) fail('paired campaigns must share independenceId');
    if (pair.parent.assistanceMode !== pair.candidate.assistanceMode) fail('paired assistance modes must match');
    independenceIds.push(pair.parent.independenceId); allRunIds.push(pair.parent.id, pair.candidate.id);
    parent.push(left); candidate.push(right);
  }
  unique(independenceIds, 'independent campaign IDs'); unique(allRunIds, 'comparison run IDs');
  const parentAP = aggregatePower(parent), candidateAP = aggregatePower(candidate);
  const deltaAPx = parentAP > 0 && candidateAP > 0 ? Math.log2(candidateAP / parentAP) : null;
  let interval = null;
  if (input.pairs.length >= 5 && deltaAPx !== null) {
    const random = rng(seed), samples = [];
    for (let i = 0; i < iterations; i++) {
      const indexes = Array.from({ length: parent.length }, () => Math.floor(random() * parent.length));
      const p = aggregatePower(indexes.map(index => parent[index])), c = aggregatePower(indexes.map(index => candidate[index]));
      if (p === 0 || c === 0) { samples.length = 0; break; }
      samples.push(Math.log2(c / p));
    }
    if (samples.length) { samples.sort((a, b) => a - b); interval = { lower: quantile(samples, 0.025), upper: quantile(samples, 0.975), confidence: 0.95, iterations, seed, method: 'paired full-campaign percentile bootstrap', conditionalOn: 'frozen human baseline; excludes baseline calibration uncertainty, task sampling shift, and adaptive holdout reuse' }; }
  }
  const regressions = [];
  if (sum(candidate.map(result => result.supervisionHours)) > sum(parent.map(result => result.supervisionHours)) + 1e-12) regressions.push('total human review hours regression');
  for (let index = 0; index < parent.length; index++) {
    const cap = Math.min(parent[index].supervisionHours, manifest.evaluator.humanReviewHoursCap ?? Infinity);
    if (candidate[index].supervisionHours > cap + 1e-12) regressions.push(`${independenceIds[index]}: campaign human labor cap exceeded`);
  }
  for (const slot of manifest.suite.slots) {
    const slotStats = side => {
      let accepted = 0, quality = 0, safetyFailures = 0;
      for (let i = 0; i < input.pairs.length; i++) {
        const result = side === 'parent' ? parent[i] : candidate[i];
        const outcome = input.pairs[i][side].outcomes.find(item => item.slotId === slot.id);
        if (result.credited.some(item => item.slotId === slot.id)) { accepted++; quality += outcome.quality; }
        if (outcome.safety === 'fail') safetyFailures++;
      }
      return { accepted, quality: accepted ? quality / accepted : 0, safetyFailures };
    };
    const p = slotStats('parent'), c = slotStats('candidate');
    if (c.accepted < p.accepted) regressions.push(`${slot.id}: task acceptance regression`);
    if (c.quality + 1e-12 < p.quality) regressions.push(`${slot.id}: task quality regression`);
    if (c.safetyFailures > p.safetyFailures) regressions.push(`${slot.id}: task safety regression`);
  }
  for (const classId of Object.keys(parent[0].perClass)) {
    const aggregate = results => {
      const stats = results.map(result => result.perClass[classId]);
      const tasks = sum(stats.map(item => item.tasks)), credits = sum(stats.map(item => item.credited));
      return { rate: credits / tasks, quality: credits ? sum(stats.map(item => item.acceptedQualitySum)) / credits : 0, safety: sum(stats.map(item => item.safetyFailures)) };
    };
    const p = aggregate(parent), c = aggregate(candidate);
    if (c.rate < p.rate) regressions.push(`${classId}: acceptance regression`);
    if (c.quality + 1e-12 < p.quality) regressions.push(`${classId}: accepted quality regression`);
    if (c.safety > p.safety) regressions.push(`${classId}: safety regression`);
  }
  if (sum(candidate.map(result => result.costUSD)) > sum(parent.map(result => result.costUSD)) + 1e-12) regressions.push('total campaign cost regression');
  const parentCostRate = sum(parent.map(result => result.costUSD)) / sum(parent.map(result => result.creditedHumanHours));
  const candidateCostRate = sum(candidate.map(result => result.costUSD)) / sum(candidate.map(result => result.creditedHumanHours));
  if (candidateCostRate > parentCostRate + 1e-12) regressions.push('cost per credited human hour regression');
  const reasons = [...regressions];
  if (manifest.suite.partition !== 'holdout') reasons.push('promotion requires a separate frozen holdout suite');
  if (parent.some(result => result.eligibility !== 'ELIGIBLE') || candidate.some(result => result.eligibility !== 'ELIGIBLE')) reasons.push('policy violation');
  if (candidate.some(result => Object.values(result.perClass).some(stats => stats.safetyFailures))) reasons.push('candidate has safety failures');
  if (!interval) reasons.push('at least five independent paired campaigns with positive bootstrap powers required');
  else if (interval.lower <= 0) reasons.push('lower 95% APx improvement bound must exceed zero');
  return { schemaVersion: 'apx-promotion/0.1', status: parent.some(result => result.status === 'synthetic') || candidate.some(result => result.status === 'synthetic') ? 'synthetic' : 'pilot', certified: false, decision: reasons.length ? 'REJECT' : 'PROMOTE', deployAuthorized: false, parentAP, candidateAP, deltaAPx, interval, campaigns: input.pairs.length, reasons, selectionId: manifest.suite.selectionId, holdoutId: manifest.suite.holdoutId, limitation: 'Promotion is a benchmark recommendation, never deployment authority. Independent campaign IDs are declarations, not proof of statistical independence. Holdout governance must prevent adaptive reuse.' };
}

export function parseBoundedJSON(text) {
  if (typeof text !== 'string' || Buffer.byteLength(text) > LIMITS.bytes) fail('input exceeds 1 MiB limit');
  return guardStructured(JSON.parse(text));
}
