import { evaluate, sha256 } from './core.mjs';

const adapter = (name, manifest, run) => ({ adapter: { name, version: '0.1.0', mode: 'APx contract adapter', nativeIntegration: false }, result: evaluate(manifest, run) });
/** Build-time benchmark contract. Does not claim compatibility with native BenchSuite. */
export const metaharnessAdapter = (manifest, run) => adapter('metaharness', manifest, run);
/** Runtime receipt contract. Does not start agents, radio, or promotion loops. */
export const autogenousAdapter = (manifest, run) => adapter('autogenous', manifest, run);

/** Upstream placeholder zeros are UNKNOWN, not measured free/instant computation. */
export function importMeter(value, status) {
  if (status === 'unmetered' || status === 'unknown' || status === undefined) return { value: null, status: 'unknown' };
  if (!['measured', 'synthetic'].includes(status) || !Number.isFinite(value) || value < 0) throw new Error('Valid measured or synthetic nonnegative meter required');
  return { value, status };
}

/** ruClip orchestration context is provenance, not proof of task correctness. */
export function importRuclipReceipt(receipt) {
  if (!receipt || typeof receipt !== 'object') throw new Error('ruClip receipt object required');
  for (const key of ['jobId', 'issueId', 'employeeId']) if (typeof receipt[key] !== 'string' || !receipt[key].trim() || receipt[key].length > 256) throw new Error(`ruClip ${key} required`);
  if (!receipt.budget || !Number.isFinite(receipt.budget.limitUSD) || receipt.budget.limitUSD < 0) throw new Error('ruClip nonnegative budget required');
  const adjudication = receipt.adjudication;
  if (!adjudication || adjudication.status !== 'accepted' || typeof adjudication.reviewerId !== 'string' || !adjudication.reviewerId.trim() || typeof adjudication.evidenceHash !== 'string' || !/^[a-f0-9]{64}$/.test(adjudication.evidenceHash)) throw new Error('Independent human adjudication and evidence hash required; job completion or approval alone is insufficient');
  if (!receipt.approval || !['approved', 'rejected', 'pending'].includes(receipt.approval.status)) throw new Error('ruClip approval status required');
  return {
    adapter: { name: 'ruClip', mode: 'APx contract adapter', nativeIntegration: false },
    governance: { jobId: receipt.jobId, issueId: receipt.issueId, employeeId: receipt.employeeId, budgetLimitUSD: receipt.budget.limitUSD, approvalStatus: receipt.approval.status, receiptHash: sha256(receipt) },
    provenance: { id: `ruclip-${receipt.jobId}`, kind: 'ruclip-adjudication', verification: 'verified', reviewerId: adjudication.reviewerId, hash: adjudication.evidenceHash },
    policyViolations: receipt.approval.status === 'approved' ? [] : ['ruClip approval not granted'],
    cost: importMeter(receipt.costUSD, receipt.costStatus),
    limitation: 'Caller must include returned policy violations in its run. Governance approval alone does not establish quality or safety. Evidence authenticity is external.'
  };
}
