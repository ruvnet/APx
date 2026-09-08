# APx contract v0.1

## Specification gate

Outcome: compare accepted work throughput of humans, agents, and supervised systems under an explicitly fixed workload, tool access, quality threshold, safety policy, and human cohort. Business value is auditable capacity and unit-cost comparison. The unit does not assert generalized intelligence, employee equivalence, revenue causality, or lines-of-code value.

Inputs: a frozen manifest and one complete run receipt, or a frozen manifest and paired independent campaign receipts. Outputs: validation, AP, APx, credit decisions, costs, assistance statistics, synthetic/pilot status, and optional promotion recommendation. Assumptions are honest receipts, external evidence authentication, reliable clocks, no hidden attempts, representative task sampling, and genuinely independent campaigns. No network, untrusted code execution, autonomous deployment, signed certificates, or generalized industry ratings are in scope.

### Frozen manifest

`schemaVersion` is `apx/0.1`. Every component has a version and SHA-256 canonical hash. Canonicalization recursively sorts object keys, retains array order, rejects nonfinite numbers, and serializes JSON without whitespace. `freezeManifest()` is a convenience for creating a draft; access to freeze production manifests must be separately controlled.

| Component | Required data | Rule |
| --- | --- | --- |
| suite | id, version, selectionId, holdoutId, partition, slots, taskSetHash, hash | Unique task slot IDs, separate selection/holdout IDs, exact declared task set |
| baseline | id, version, kind, cohort, predeclaredAttemptIds, attempts, hash | `kind` synthetic or measured; all declared human attempts retained |
| cohort | id, tools, skills | Explicit reference capability and tool access; illustrative data cannot masquerade as measured |
| human attempt | id, classId, hours, accepted | Positive single-worker elapsed hours, including unsuccessful attempts |
| evaluator | id, version, qualityThreshold, hash | Same declared acceptance standard for human calibration and agent tasks |
| environment | id, version, description, hash | Declare relevant hardware, software, tool policy, and measurement conditions in production |

For task class j, reference human hours per accepted task are the sum of elapsed hours across all predeclared human attempts in that class, divided by accepted human tasks in that class. Failed attempts stay in the numerator. A class with zero accepted reference tasks cannot be calibrated and is rejected. Human attempt duration is one worker's elapsed time, not team person-hours or extrapolated token generation time. Pooling workers needs a declared cohort and repeated sampling design outside this reference scorer.

Measured baselines additionally require `cohort.participantIds` and `protocol` containing id, version, predeclaredAt (ISO timestamp), timeBoundary, acceptanceRule, evaluatorId, and evaluatorHash. Each attempt identifies a declared participant, a provenanceHash, and a human adjudication containing independent=true, reviewerId distinct from participantId, hash, attemptId, participantId, evaluatorId, evaluatorHash, provenanceHash, and decision accepted/rejected matching the attempt. These bindings prevent simple synthetic relabeling from passing validation. They remain declarations, not authenticated proof of recruitment, independence, timing, or adjudication.

### Complete run receipt

Required fields: `id`, `independenceId`, `kind`, `partition`, `suiteHash`, `baselineHash`, `evaluatorHash`, `environmentHash`, `wallHours`, `wallBreakdown`, `agentRuntimeHours`, `humanReviewHours`, `assistanceMode`, `costUSD`, `policyViolations`, and `outcomes`.

`wallBreakdown` contains executionHours, retryHours, reviewHours, blockingWaitHours, and otherHours. They are nonoverlapping elapsed segments summing to wallHours. Concurrent activity must not be added twice. All waiting, retry, review, and rework attributable to the observation window stays in the denominator. The scorer checks arithmetic consistency, not whether the observer omitted time.

`agentRuntimeHours` is summed agent execution runtime across parallel workers. It is separate from wall time and never substituted as the AP denominator. Raw runtime days use 8 hours per day. This descriptive convention is not a productivity conversion.

`humanReviewHours` is separate human person-hours, including declared evaluation-only adjudication. Assistance mode is autonomous, evaluation-only, supervised, or collaborative. Autonomous mode requires zero human review hours. For evaluation-only mode, human time is adjudication after agent work and is still disclosed in the complete observation. Production protocols must distinguish operational assistance from scoring labor before data collection.

Elapsed review segments are normative human review time, so humanReviewHours must be at least wallBreakdown.reviewHours. Parallel reviewers can increase person-hours above elapsed review time, never below it.

Cost is total declared cost in USD, including whatever cost boundary the frozen protocol specifies. Unknown costs cannot be scored as numeric zero. The adapter preserves unmetered values as null, which the core rejects until explicitly metered or labeled synthetic. A measured zero is permitted for legitimately zero incremental spend; it must not imply zero fully loaded economic cost. Cross-system comparisons must align the cost boundary.

Every suite task has exactly one outcome, including failures. Each outcome contains slotId, accepted, quality in [0,1], safety pass/fail/unknown, nullable deliverableId, nullable artifactHash, and provenance. Provenance entries contain id, kind, verification, and SHA-256 evidence hash. Human adjudications require reviewerId. A provenance reference is not an authenticated receipt; external verification remains required.

For measured runs, every supplied outcome evidence entry must also bind slotId, artifactHash, evaluatorHash, and runId; its decision must match accepted/rejected status. It must be human-adjudication or ruclip-adjudication with independent=true. Accepted measured outcomes require verified adjudication. Objective test receipts alone are permitted only for synthetic runs in this v0.1. A future version may admit independently trusted automatic evaluators with an explicitly governed trust mechanism.

### Gating and credit

Credit requires accepted = true, quality at or above the frozen threshold, safety = pass, identified deliverable and artifact, and a verified test receipt or human adjudication. Raw media presence never proves correctness. Valid results sharing a deliverable ID or exact artifact hash receive credit once per run. Deterministic task ID ordering resolves duplicates. Invalid results cannot consume identity credit before a valid result. Near-duplicates, plagiarism, and semantically equivalent outputs need an external adjudicator; exact hash deduplication does not solve them.

An admissible deliverable ID mapping to different artifact hashes is a conflicting identity and rejects the entire run. This includes alias chains where one duplicate would otherwise hide a conflict. Repeated IDs with the same hash and different IDs pointing to the same hash receive credit once. Inadmissible outcomes do not poison valid identities.

Credit is binary at the frozen quality threshold. Quality is not silently multiplied into hours. Fractional-task schemes require a separately versioned task model.

AP is the sum of credited reference hours divided by complete observation wall hours. APx is log2(AP), dimensionless. Zero AP maps to null APx rather than JSON Infinity. Any declared policy violation or known safety failure anywhere in the run makes official AP and APx null and eligibility INELIGIBLE. This includes unaccepted tasks with known safety failures. Gated diagnostics remain available and clearly labeled.

Acceptance is credited slots / declared slots. Raw accepted slots are also returned, exposing rejected or duplicate claimed successes. Human leverage is credited reference hours / human review person-hours; zero human input returns null, not infinity. Cost per credited human hour is total cost / credit; zero credit returns null. Synthetic data in either baseline or run dominates the output label. Fully measured declarations remain pilots. `certified` is always false.

Scored results retain suiteHash, baselineHash, evaluatorHash, environmentHash, suiteId, baselineId, baselineCohort, and calibrationProtocolId. Pilot assurance is explicitly declared-measured and not authenticated.

### Campaign comparison and promotion

Pairs use the same frozen suite, baseline, evaluator, environment, and assistance mode. A pair shares an independenceId; different pairs must have distinct independenceIds and unique run IDs. An ID cannot establish independence. Operational scheduling and replication must do so.

The point estimate aggregates credited hours and observation hours across campaigns, then compares AP ratios. With at least five independent pairs and positive sampled powers, the engine resamples whole pairs, calculates log2(candidate AP / parent AP), and reports a percentile 95% interval. Default 2,000 bootstrap samples use a reproducible seed. Per-task observations within one campaign are not treated as independent replicates.

The interval is conditional on the frozen human baseline. It excludes baseline calibration uncertainty, task sampling shift, evaluator error, human cohort heterogeneity, and adaptive holdout reuse. Five campaigns are a minimum implementation gate, not a statistical adequacy guarantee. Heavy tails and small samples need larger predeclared studies or more suitable inference.

Promotion requires lower interval bound strictly above zero, no per-task or per-class acceptance/quality/safety regression, no candidate safety failures, no total-cost or cost-per-credit regression, no policy violations, and a separate frozen holdout partition. These nonregression checks are strict observed checks, not simultaneous statistical equivalence claims. The scorer does not manage holdout rotation, budget authorization, production rollout, or rollback. Selection/holdout IDs are necessary bookkeeping, not proof against leakage. Promotion is never deployment authority.

Promotion additionally rejects an increase in summed human review hours. Each candidate campaign must stay at or below its paired parent's humanReviewHours and, when present, the frozen evaluator.humanReviewHoursCap. Improved aggregate speed cannot hide increased human assistance in one campaign behind reduced assistance elsewhere.

## Pseudocode gate

1. Validate bounded structured input and frozen component hashes.
2. Verify every baseline attempt and task slot is present exactly once.
3. Calibrate each class using failure-inclusive reference hours.
4. Validate time, cost, assistance, and evidence fields.
5. Visit task slots in deterministic order; apply acceptance, quality, safety, evidence, and dedup gates.
6. Sum reference credit; divide by observation time; compute exponent or null.
7. Suppress official AP/APx on policy violations; emit diagnostics and limitations.
8. For comparisons, resample independent full pairs and apply task, safety, cost, and holdout promotion gates.

Success case: three different accepted tutorial artifacts each earn 1.5 reference hours, totaling 4.5 hours over 0.5 synthetic wall hours: AP 9. Failure case: remove one task receipt and validation fails; keep the task as accepted=false and it receives zero credit while all observation time remains.

## Completion evidence

| Requirement | Executable evidence |
| --- | --- |
| Failure-inclusive calibration and missing attempt rejection | baseline arithmetic and predeclared attempt tests |
| Frozen task set and identity | missing/duplicate/unknown slots and all hash mismatch tests |
| Work, time, quality, safety, provenance gates | arithmetic, wall breakdown, acceptance, quality, safety, missing evidence tests |
| Duplicate resistance | deliverable/hash/order/failed duplicate tests |
| Honest status and zero handling | synthetic, pilot, null exponent, unit cost, supervision tests |
| Honest adapters | nativeIntegration=false, ruClip adjudication, unknown metering tests |
| Statistical and promotion constraints | 5-pair bootstrap, deterministic seed, task/quality/safety/cost/holdout tests |
| Input security | byte/depth/prototype-key limits and MCP unknown method tests |
| Real bounded tutorial execution | deterministic runner checks and CLI integration tests |

All evidence is generated by `node --test`. No human study or production agent benchmark was performed by this package.
