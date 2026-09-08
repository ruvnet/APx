import { performance } from 'node:perf_hooks';
import { freezeManifest, sha256, evaluate } from './core.mjs';

/** These runners execute deterministic toy work. They do not execute submitted code. */
export function runToyTasks() {
  const start = performance.now();
  const amounts = [1900, 3250, -125, 700, -225];
  const reconciliation = amounts.reduce((total, cents) => total + cents, 0);
  const records = [{ id: 'secondary', primary: false, date: 3 }, { id: 'older-primary', primary: true, date: 1 }, { id: 'current-primary', primary: true, date: 2 }];
  const ranking = [...records].sort((a, b) => Number(b.primary) - Number(a.primary) || b.date - a.date).map(item => item.id);
  const runningTotals = []; [2, -1, 4, 0].reduce((total, value) => { const next = total + value; runningTotals.push(next); return next; }, 0);
  const checks = [
    { slotId: 'finance-1', result: { cents: reconciliation }, passed: reconciliation === 5500 },
    { slotId: 'research-1', result: { ranking }, passed: ranking.join(',') === 'current-primary,older-primary,secondary' },
    { slotId: 'software-1', result: { runningTotals }, passed: JSON.stringify(runningTotals) === '[2,1,5,5]' }
  ];
  return { checks, actualRunnerMilliseconds: performance.now() - start, measurementScope: 'Local toy computation only, not end-to-end agent workflow, reference human time, or production capability' };
}

export function demoFixture({ id = 'demo-1', independenceId = 'campaign-1', wallHours = 0.5, costUSD = 0.1 } = {}) {
  const slots = [{ id: 'finance-1', classId: 'financial-reconciliation' }, { id: 'research-1', classId: 'source-prioritization' }, { id: 'software-1', classId: 'output-verification' }];
  const attempts = slots.flatMap((slot, index) => [
    { id: `h-${index}-1`, classId: slot.classId, hours: 1, accepted: true },
    { id: `h-${index}-2`, classId: slot.classId, hours: 0.5, accepted: false }
  ]);
  const manifest = freezeManifest({
    schemaVersion: 'apx/0.1',
    suite: { id: 'apx-toy-tutorial', version: '0.1.0', selectionId: 'tutorial-selection-v1', holdoutId: 'tutorial-holdout-v1', partition: 'holdout', slots },
    baseline: { id: 'illustrative-human-reference', version: '0.1.0', kind: 'synthetic', cohort: { id: 'not-a-measured-human-cohort', tools: ['illustrative calculator and editor'], skills: ['illustrative general knowledge'] }, predeclaredAttemptIds: attempts.map(attempt => attempt.id), attempts },
    evaluator: { id: 'deterministic-toy-checks', version: '0.1.0', qualityThreshold: 0.8 },
    environment: { id: 'tutorial-local', version: '0.1.0', description: 'Dependency-free Node toy runners. Synthetic workflow costs and durations. Not a rUv measurement.' }
  });
  const execution = runToyTasks();
  const run = {
    id, independenceId, kind: 'synthetic', partition: manifest.suite.partition,
    ...Object.fromEntries(['suite', 'baseline', 'evaluator', 'environment'].map(key => [`${key}Hash`, manifest[key].hash])),
    wallHours, agentRuntimeHours: wallHours * 3, humanReviewHours: Math.max(0.05, wallHours * 0.1), assistanceMode: 'evaluation-only', costUSD,
    wallBreakdown: { executionHours: wallHours * 0.6, retryHours: wallHours * 0.1, reviewHours: wallHours * 0.1, blockingWaitHours: wallHours * 0.1, otherHours: wallHours * 0.1 },
    policyViolations: [],
    outcomes: execution.checks.map(check => ({ slotId: check.slotId, accepted: check.passed, quality: check.passed ? 1 : 0, safety: 'pass', deliverableId: `deliverable-${check.slotId}`, artifactHash: sha256(check.result), provenance: [{ id: `test-${check.slotId}`, kind: 'test-receipt', verification: 'verified', hash: sha256(check) }] }))
  };
  return { manifest, run, execution, notice: 'SYNTHETIC TUTORIAL: actual toy task execution, synthetic human calibration, workflow duration, costs, and agent runtime. No evidence for rUv 20x or any human productivity claim.' };
}

export function runDemo() {
  const fixture = demoFixture();
  return { ...fixture, result: evaluate(fixture.manifest, fixture.run) };
}
