# APx specification 0.1
## Agentic Power exponent

Proposal by rUv • Reference implementation • 7 September 2026

Status: experimental. No standards body has adopted this specification. No certified human productivity score has been issued. The runnable package is a reference benchmark and accounting kernel, not a live evaluation service.

## 1. Purpose and boundaries

APx makes useful human and agent output comparable for a specific job, function, or capability under a declared protocol. Its business purpose is to support procurement, workflow design, resource allocation, and evaluation of retained agent improvements.

An APx claim must identify the system, workload, human reference group, tools, quality standard, time boundary, cost boundary, and assistance mode. APx is not intelligence, consciousness, general capability, economic value, employment displacement, or physical horsepower.

The four dimensions of the explainer are three spatial dimensions plus time replay. Its instrument is an illustrative interface, not a real sensor or a scientific four dimensional field model.

## 2. Quantities

For task class j, define H_j as reference human hours per accepted equivalent output:

H_j = sum of elapsed hours across all predeclared human attempts in class j / accepted equivalent outputs in class j.

Human attempts use a qualified single worker protocol and include unsuccessful attempts, declared timeout costs, review, repair, and required integration. Class definitions must be sufficiently narrow to make completed outputs comparable. If no human attempts are accepted, the reference is undefined and the class cannot be scored.

For agent campaign c, define a_i as one if task slot i is accepted after all gates, and zero otherwise. Exact duplicate deliverables are credited at most once. Let T_c be the complete declared campaign elapsed hours.

W_c = sum over unique accepted task slots of a_i × H_class(i).

AP_c = W_c / T_c.

APx_c = log₂(AP_c), when AP_c > 0.

AP is a dimensionless rate ratio expressed as a proposed reference unit. APx is its dimensionless base two exponent. No exponential growth claim follows from this transform. Zero work produces 0 AP and a JSON null exponent with an explicit explanation. Unknown input produces no score, not zero work.

| AP | APx | Meaning within a declared task protocol |
| --- | --- | --- |
| 0 | undefined | No accepted output |
| 0.25 | −2 | One quarter of the human reference rate |
| 0.5 | −1 | Half the reference rate |
| 1 | 0 | Reference parity |
| 2 | 1 | Twice the reference rate |
| 4 | 2 | Four times the reference rate |
| 8 | 3 | Eight times the reference rate |
| 16 | 4 | Sixteen times the reference rate |
| 20 | approximately 4.322 | Twenty times the reference rate |
| 64 | 6 | Sixty four times the reference rate |

### Additional mandatory measurements

Report total credited reference hours, accepted task count and declared task count, agent runtime, system elapsed time, human labor, total cost and currency, failed work, safety status, evidence grade, and task coverage.

Human labor leverage L = W / total human person hours used by the campaign. Include prompting, steering, recovery, review, and integration. The v0.1 field is named humanReviewHours for historical brevity; it MUST include all campaign human labor, not only final review. A zero denominator yields null, not a claim of infinite leverage.

Cost efficiency = total campaign cost / W. Include the frozen cost boundary: inference, tools, rented compute, allocated hardware costs, human labor and integration. If any required component is unmeasured, do not claim total cost efficiency. Financial value or revenue per reference hour is a separate outcome metric.

Runtime days = sum agent runtime hours / 8. This utilization quantity is never automatically credited as human workdays.

Verified reference workdays = W / 8. For a report specifically comparing with human workdays, divide these reference workdays by measured human person hours / 8. Specify whether the denominator means all human labor, rUv’s own time, or a scheduled calendar day.

### Worked examples, all hypothetical

| Output | Assumed human reference | Accepted agent output | Complete elapsed time | AP | APx |
| --- | --- | --- | --- | --- | --- |
| Bounded bug fixes | 2 hours per accepted fix | 8 unique fixes | 2 hours | 8 | 3 |
| Support resolutions | 20 minutes per accepted case | 24 cases | 2 hours | 4 | 2 |
| A publishable book | 400 hours per accepted book | 1 complete accepted book | 50 hours | 8 | 3 |
| Failed output | Any calibrated class | 0 accepted tasks | 8 hours | 0 | undefined |

The book’s 400 hours is an assumption, not an industry estimate. A pile of generated chapters does not establish a publishable book. An application has no universal number of code lines or hours. A software score requires a defined deliverable, tests, review, and acceptance.

At a genuinely sustained 20 AP, an eight hour run yields 160 reference hours or 20 eight hour workdays. Across 250 eight hour operating days, it yields 40,000 reference hours, equivalent to twenty 2,000 hour reference working years. It does not yield decades per day. Continuous operation over 365 days needs an explicitly different operating schedule and cannot silently replace a 250 day assumption.

## 3. A score is a conditioned claim

A valid claim has this form:

“System S achieved AP p, APx x, on workload W version V, against cohort C, under evaluator E, environment R, assistance mode A, and budgets B, during window T, with evidence grade G and stated uncertainty.”

Do not publish APx alone. Results from different cohorts, budgets, tools, environments, quality thresholds, workload distributions, or time boundaries are not directly interchangeable.

An ordinary human using spreadsheets or an IDE is a different baseline from a human forbidden those tools. A human with AI assistance is a third baseline. Label these separately. Do not select an artificially weak human baseline and describe it as professional parity.

A fleet’s AP belongs to the declared fleet. Also report concurrency, model versions, token and compute budgets, hardware, and active operators. Dividing fleet AP by the number of agents does not yield each agent’s marginal contribution; use controlled ablations for that question.

## 4. Human calibration protocol

1. Define a job and decompose it into representative, independently assessable task classes.
2. Choose qualification and experience requirements, language, jurisdiction, tool access, working context, and accommodation policy.
3. Freeze task briefs, rubrics, task distribution, timeouts, success window, and exclusion rules before either arm starts.
4. Recruit qualified participants. Give humans and agents equivalent task information and access appropriate to the stated comparison.
5. Randomize equivalent task instances and assignment order. Avoid asking people to perform the identical task twice where memory would change the comparison.
6. Observe start, stop, failure, review, repair, waiting, and final acceptance. Keep every predeclared attempt, including timeouts and failures.
7. Have independent reviewers apply the same acceptance standard. Reviewers should be blinded to source when feasible. Adjudicate disagreements.
8. Estimate H_j and quantify calibration uncertainty. Identify participant and task clustering rather than treating correlated attempts as independent.
9. Freeze a versioned baseline manifest and artifact references before agent scoring.

The kernel validates declared evidence and manifest consistency. It cannot prove a participant’s qualifications, authenticate a reviewer, or establish that elapsed times were truthfully measured. External baseline custody and audit are required. A rehashed manifest is not a trusted registry.

For now, all shipped cohorts are synthetic. The twelve task profiles are vocabulary and evaluator blueprints, not calibrated industry baselines.

## 5. Acceptance and safety

Acceptance is an externally established outcome, not the generating agent’s self assessment.

A task receives credit only when its declared completion condition, quality threshold, safety gate, required provenance, and unique artifact identity all pass. A task score below threshold is zero credit in v0.1. Partial credit is not implemented; any future fractional scheme must freeze its units and demonstrate comparable interpretation across humans and agents.

Objective toy tests may establish synthetic acceptance. Measured pilot results require independently adjudicated evidence bound to the task slot, artifact, run, and evaluator. The current reference implementation still treats these records as declarations, not authenticated testimony.

Any known safety failure or run policy violation makes the official score ineligible. Diagnostic accepted work may remain visible but cannot be promoted as an official result. Unknown safety or missing evidence earns no task credit.

Repeated artifact hashes or deliverable identities cannot inflate output. Conflicting identities must not allow one deliverable to count under several aliases. Semantic duplicates remain an external adjudication requirement: changing whitespace can evade a byte hash, so byte deduplication is not semantic originality detection.

High stakes tasks need separate qualified evaluators, local requirements, and domain authorization. The initial health profile is synthetic administration only, not diagnosis or treatment. The legal profile is supervised extraction, not legal advice. Finance does not execute payments or trades. Robotics remains simulation unless a separately approved physical protocol is established.

## 6. Time, resources, and causality

The campaign clock starts when the full declared workload enters the authorized execution boundary and ends at its frozen deadline or completion and acceptance boundary. The same rule applies to comparator campaigns. Failed work, retries, queueing, blocked calls, repair, and integration remain inside the denominator.

The v0.1 wall breakdown uses mutually exclusive categories: execution, retry, review, blocking wait, and other elapsed hours. These categories sum to the wall total. Parallel task clocks must not be summed into elapsed time. Human person hours and summed agent runtime may exceed elapsed hours because of concurrency.

Working hours versus continuous calendar hours must be explicit. The human reference protocol must declare treatment of overnight, off shift, and external waiting. A laboratory protocol with short controlled work windows cannot automatically support an around the clock workforce claim.

The comparison describes conditional throughput, not causality. To estimate the business effect of adopting agents, randomize comparable workflows or teams and include downstream rework, coordination, available demand, failure costs, and customer outcomes.

## 7. Taxonomy and coverage

Each task profile records:

| Field | Purpose |
| --- | --- |
| Industry and vertical | Deployment context |
| Occupation and qualification | Human reference group |
| Function | Actual job activity |
| Capability tags | Retrieve, reason, create, calculate, plan, communicate, perceive, act, coordinate, verify |
| Task class and difficulty | Comparable work unit |
| Environment | Text, code, browser, enterprise tool, simulator, or physical setting |
| Completion and acceptance | What useful output means |
| Risk and oversight | Required governance boundary |
| Cost and resource boundary | What the comparison counts |

Initial proposed domains: software, research, publishing, support, finance, legal operations, health administration, manufacturing, logistics, education, media, and robotics. Domain labels are not official O*NET codes. A future versioned crosswalk requires review.

Report the per task class profile first. A fixed workload basket can aggregate W/T only with its task distribution and full declared coverage visible. Missing classes are unknown, not perfect, and no task slots can silently disappear. Do not average log scores across arbitrary occupations or cherry pick successful sectors.

Dependent stages require a workflow level acceptance check. Do not add the credits for a research brief, draft, and book when the frozen job defines only the finished book; that double counts intermediate work. Intermediate work can be scored in a different, clearly identified protocol.

## 8. Data contract and executable kernel

The package’s docs/CONTRACT.md is the executable field reference. Manifest schema is apx/0.1, result schema apx-result/0.1, and promotion schema apx-promotion/0.1. Schema versions are explicit and unknown versions fail closed.

A manifest contains frozen suite, baseline, evaluator, and environment records, each with a version and SHA256 hash. A run references those hashes, records all predeclared task slots, and separates time, runtime, human labor, cost, assistance, policy violations, and outcomes.

Task receipts include slot ID, deliverable ID, artifact digest, quality, safety, acceptance, and provenance. Measured evidence requires binding and calibration metadata. Each result retains comparison context and an explicit evidence assurance limit.

JSON transport is bounded to 1 MiB, depth 32, and 100,000 nodes. Core arrays and bootstrap work are bounded. The kernel does not fetch URLs, execute submitted code, run arbitrary commands, discover credentials, or mutate external systems.

Hashing uses a deterministic sorted JSON representation for this package. This is not a claim of full Ruflo witness or RFC 8785 signature interoperability. Hashes must be checked against a independently trusted manifest. No private keys or signature issuing authority are bundled.

Assistance modes are autonomous, evaluation only, supervised, and collaborative. Evaluation only means a human checks an output without steering its production; its labor still counts. Autonomous cannot hide human production assistance.

## 9. Statistics and promotion

The reference implementation compares paired full campaigns on one frozen manifest. It resamples pairs, not individual parallel agents. With at least five independent declared pairs and positive powers, it reports a seeded percentile bootstrap interval for the APx improvement.

This interval is conditional on the frozen human calibration and workload. It excludes baseline uncertainty, task sampling uncertainty, selection bias, adaptive holdout reuse, and reviewer error. Five pairs is an implementation floor, not a statistically adequate sample size for every claim. Zero denominators or zero bootstrap powers lead to no interval.

Before an audited population claim, implement a preregistered power analysis and hierarchical uncertainty model that includes human participants, task families, instances, and run variation. Sparse and high reliability claims need substantially more evidence. Do not present degenerate bootstrap bounds as population certainty.

A promotion recommendation requires a separate declared holdout, a positive lower improvement bound, and no task, class, quality, safety, cost, or human labor regression. Any violation blocks recommendation. Holdout IDs alone do not prove independence; an external evaluation custodian must prevent contamination and repeated optimization against the same holdout.

Self learning may revise candidate prompts, routing, model selection, memory use, workflow topology, and budgets within authorized limits on development data. It must not alter the baseline, scorer, rubric, hidden task set, acceptance authority, or historical receipts to improve its own score.

The kernel returns only a recommendation. deployAuthorized is always false. Synthetic recommendations stay explicitly synthetic. No automatic operational promotion or deployment occurs.

## 10. RuV architecture

| Layer | Responsibility | Current integration status |
| --- | --- | --- |
| Ruflo | Coordination, work ownership, routing | Pinned 3.25.6 CLI used during implementation |
| MetaHarness Darwin | Build time conformance and candidate evaluation | Native 0.10.2 suite verifier exercised on an APx development wrapper |
| Autogenous | Runtime adaptation and execution evidence | APx contract adapter implemented and tested locally; live service unverified |
| ruClip | Employee, job, issue, budget, and approval context | APx import boundary implemented and tested locally; live service unverified |
| APx kernel | Independent validation, credit accounting, statistics | Runnable local reference implementation |
| Independent custodian | Human calibration, adjudication, hidden holdouts, audit | Required operational role; not provided by this prototype |

ruClip here refers to the ruvnet/ruClip orchestration repository, not a vision embedding model. An upstream approval does not establish success. Autogenous resource fields known to be unmetered are unknown even if encoded as zero.

The native MetaHarness wrapper is a visible coding regression smoke suite. Its required hidden test command repeats a visible test and is explicitly not an independent occupational holdout. Native suite verification proves hash compatibility, not benchmark accuracy or human productivity. The included generator supports an explicit source commit and rejects an unclean pinned source subtree.

The package supplies bounded stdio MCP tools apx_evaluate, apx_validate, and apx_promote. It is not a hosted MCP service. Remote transport, authentication, durable storage, and signed third party attestation require separate implementation.

## 11. SPARC decisions

### Specification gate

Inputs: bounded task manifest, calibrated baseline, complete run receipts.
Output: reproducible AP/APx result and exclusions.
Success: every credited unit is traceable and the same input yields the same score.
Exclusions: no measured rUv score, no automatic deployment, no live regulated decisions.

### Pseudocode gate

Validate bounds and schemas. Verify frozen hashes and task coverage. Establish class calibration from all human attempts. Identify blocking safety and policy failures. Validate evidence and distinct deliverables. Credit only accepted unique work. Divide by full elapsed time. Emit the exponent only for positive power. Preserve diagnostic output when ineligible. Compare only matching campaigns. Recommend improvement only after holdout and resource gates.

Success case: eight accepted two hour fixes completed in two hours yields 8 AP, APx 3.
Failure case: same workload includes a safety failure; official AP and APx are null, eligibility is INELIGIBLE, and diagnostic work is retained.

### Architecture gate

Selected: independent pure scoring functions and bounded adapters.
Rejected: tokens or code lines as productivity; they measure volume.
Rejected: summed agent runtime as output; it measures activity.
Rejected: one weighted intelligence score; it conceals task and risk tradeoffs.
Rejected: optimizer owned grading; it invites reward manipulation.

### Refinement gate

Critical invariants are executable tests. Independent review examines the invariants, not just the passing test count. Fixes must include regression tests and preserve synthetic labeling.

### Completion gate

Run the Node suite, native Darwin hash verification, CLI/MCP checks, production build, and package integrity checks. Inspect results and document any exceptions. Browser visual QA was not requested and is not claimed.

## 12. Release, privacy, and rollback

Keep workforce data minimized and access controlled. Prefer participant pseudonyms. Do not ingest secrets, raw personal communications, or regulated records into demonstrations. Encrypt and audit real calibration data in the eventual deployment environment. Do not use APx alone for hiring, firing, medical care, or safety critical decisions.

Release benchmark manifests and source versions together. Never overwrite historical results; supersede invalid records with an explanatory revision. Freeze published baselines. A revised rubric requires a new comparison version or an explicit validated bridge.

Rollback restores the last accepted candidate and its frozen evaluation context. A change of metric definition must not silently revise old scores. Production users retain control over credentials, task permissions, and deployment.

## 13. Pilot plan and acceptance

Stage 1: complete software maintenance calibration. Use 30 varied bounded tasks with three qualified human attempts each as an initial planning design. At an assumed one hour per attempt, budget 90 human reference hours, plus independent review and administration. This is a planning estimate, not a power calculation.

Stage 2: run paired agent campaigns with fixed tool and cost access, including unsuccessful tasks. Separate prompting and final review labor. Investigate disagreement and failures before using scores.

Stage 3: add evidence briefs and synthetic reconciliation under separate qualified cohorts. Add more domains only when their standards and safety boundaries are independently reviewed.

Acceptance test: recompute a report from its frozen inputs. Verify duplicate output gives no extra credit, any known safety failure invalidates the official score, missing tasks cannot vanish, unmeasured cost cannot be treated as free, more human labor cannot silently pass promotion, and synthetic fixtures never become a personal measured claim.

The product delivered here is the specification, reference benchmark, conformance tests, native wrapper, adapters, and interactive explanation. Representative calibration data and operational independent audit remain the major missing prerequisites for a credible public APx rating.
