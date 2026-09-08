# APx: Agentic Power as a measure of useful work

Research brief for rUv and Cognitum • 7 September 2026

## Executive finding

APx should be a proposed, task specific measurement layer over accepted output, not another universal intelligence leaderboard. Define ordinary agentic power, AP, as independently accepted reference human work hours divided by the complete elapsed hours of the declared system. Define APx as log₂(AP). The exponent compresses a multiplier; it does not establish exponential growth.

A measured 8 AP on a software maintenance protocol means eight reference human hours of accepted software maintenance per system hour. APx is 3. It does not mean eight times the intelligence, eight displaced employees, or equivalent performance in medicine.

The earlier estimate that rUv runs 20 productive agent workdays per human workday has no timed human calibration or verified runtime dataset in this project. It is not a result. The user reported 100 million lines of code, but we have not independently audited that inventory. It cannot supply a productivity conversion.

## The consequential distinction

OpenAI’s September 2026 account defines its 3.1 agent workdays per human workday using aggregate agent runtime and an eight hour day. It separately discusses success and intervention, and warns that code volume is hard to translate into research progress. APx must therefore preserve runtime as a separate utilization measure. [OpenAI: Research acceleration](https://openai.com/index/research-acceleration-view-inside-openai/)

Three measurements answer different questions:

| Measurement | Numerator | Denominator | Interpretation |
| --- | --- | --- | --- |
| Runtime intensity | Sum of active agent runtime | Human labor time | How much agent activity was used |
| AP | Accepted reference human work hours | System elapsed hours | How quickly the system delivered calibrated work |
| Human labor leverage | Accepted reference human work hours | All human person hours supporting the run | How much reference output each human labor hour supported |

Neither the agent’s count nor its model size occurs in the AP equation. Adding idle agents cannot increase AP. Adding an effective worker can increase AP only if accepted output rises within the same declared constraints.

## What current evaluation research contributes

### 1. Task duration is useful, but is not productivity

METR measures a task’s difficulty using expert human completion duration and estimates success at different task lengths. Its current page explicitly distinguishes this from how long an agent runs. The benchmark primarily covers software, machine learning, and cybersecurity; it also notes that unfamiliar human baseliners may take longer than professionals familiar with a repository. APx borrows the practice of human calibration, not METR’s time horizon as a throughput multiplier. [METR: Task Completion Time Horizons, updated May 8, 2026](https://metr.org/time-horizons/)

### 2. Measure, do not infer from enthusiasm

METR’s 2025 randomized study involved 16 experienced developers and 246 tasks in familiar repositories. AI allowed work took 19% longer under that study’s conditions, despite participants believing it helped. This is evidence that perceived speed and observed completion time can diverge. It is not evidence about every current model or every workflow. [METR: Early 2025 developer productivity study, July 10, 2025](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/)

A 2026 followup identified selection effects and unreliable per task time reporting when developers used concurrent agents. Its authors judged the resulting estimate unreliable as a measure of current productivity effects. APx therefore uses a full campaign observation window and a separate human labor record instead of adding overlapping task clocks. [METR: Experiment design update, February 24, 2026](https://metr.org/blog/2026-02-24-uplift-update/)

### 3. Occupational work needs occupational judges

GDPval spans 44 occupations, uses professional work products, and includes expert evaluation. Its speed and cost comparisons omit human oversight, iteration, and integration. APx includes those costs and delays and requires a task specific acceptance protocol. It must not convert a benchmark’s inference speed into a finished workplace output claim. [OpenAI: GDPval, September 25, 2025](https://openai.com/index/gdpval/)

Mercor’s APEX Agents evaluates 480 professional tasks across applications, with prompts, files, rubrics, gold outputs, and metadata. This is relevant prior work, not an APx implementation. The similar name is a real differentiation issue: APx must consistently expand to Agentic Power exponent and explicitly distinguish itself from Mercor’s APEX family. No trademark clearance or patent novelty claim has been established. [Vidgen et al.: APEX Agents, revised February 23, 2026](https://arxiv.org/abs/2601.14242), [Mercor’s current APEX family](https://www.mercor.com/apex/)

### 4. Functional tests alone can overstate completion

A small METR study using an older model found that changes passing functional tests could still need repair before merging. It is inappropriate to generalize its numerical outcome to current systems, but the acceptance lesson is directly applicable: review, documentation, maintainability, and integration may be part of the job. [METR: Algorithmic versus holistic evaluation, August 13, 2025](https://metr.org/blog/2025-08-12-research-update-towards-reconciling-slowdown-with-time-horizons/)

A vendor audit of a selected set of 138 difficult SWE bench Verified tasks reported test or specification issues and evidence of benchmark exposure. Its percentages are not estimates for the entire benchmark. APx needs frozen evaluators, contamination checks, independently controlled holdouts, and revision histories. [OpenAI: SWE bench Verified limitations, February 23, 2026](https://openai.com/index/why-we-no-longer-evaluate-swe-bench-verified/)

### 5. Executed state matters in computer use and physical tasks

OSWorld’s original work supplies real computer environments and task specific execution checks. Its historical results should not be treated as current frontier scores. APx should borrow the environment reset and state verification pattern for desktop work and require an entirely separate physical validation protocol for robotics. A screenshot is not proof of task success. [Xie et al.: OSWorld, April 11, 2024](https://arxiv.org/abs/2404.07972)

### 6. Jobs are bundles of activities, not single scores

O*NET distinguishes job tasks, work activities, context, skills, and abilities. It is a useful taxonomy source, not a source of human task durations. Our twelve starting profiles are proposed labels, not an official O*NET crosswalk or validated occupational benchmark. A released mapping must record its taxonomy version and receive domain review. [O*NET Content Model](https://www.onetcenter.org/content.html)

The Anthropic Economic Index distinguishes patterns of automation and augmentation in observed use. Adoption patterns are not causal productivity measurements. APx similarly separates assistance modes and refuses to treat usage frequency as proven capability. [Anthropic: Economic Index Cadences, June 26, 2026](https://www.anthropic.com/research/economic-index-june-2026-report)

NIST’s voluntary AI Risk Management Framework supports evaluating trustworthiness within context and across the system lifecycle. APx’s safety and provenance gates are design choices informed by that governance approach, not NIST certification. [NIST AI RMF](https://www.nist.gov/itl/ai-risk-management-framework)

## RuV integration findings

Public source inspection was bounded to relevant manifests, benchmark contracts, exports, and governance documents.

| Component | Observed contract | APx decision |
| --- | --- | --- |
| MetaHarness | @metaharness/darwin 0.10.2, coding task suite and verifier | Wrap executable APx invariants in a native coding suite; retain the occupational scoring kernel separately |
| Autogenous | radio-moe 0.3.1, runtime frames, evidence and promotion boundaries | Use an explicit APx adapter; preserve upstream evidence without inventing metering |
| ruClip | Job, employee, issue, budget and approval context; build governance delegated to MetaHarness and runtime adaptation to Autogenous | Attach governance context to APx reports; an approval is not correctness evidence |
| Ruflo | Coordination and receipt contracts | Coordinate implementation, preserve provenance, and separate candidate recommendation from deployment authority |

MetaHarness’s native suite hash is SHA256 over its task array after recursively sorting object keys and serializing JSON. Its task schema is coding specific. Do not relabel arbitrary occupational tasks as a native Darwin corpus. [Pinned Darwin suite implementation](https://github.com/ruvnet/metaharness/blob/d5833dc6512ac1adeeef91a331c29055cd8a4dbb/packages/darwin-mode/src/bench/suite.ts)

Autogenous’s receipt exporter explicitly discloses that it uses the same selection bench for promotion, has no separate promotion holdout, and emits zero resource quantities because those resources are not metered. An APx importer must treat unmetered zero as unknown, not free work. Source signatures or hashes establish integrity only to the extent independently verified; they never establish occupational success by themselves. [Pinned Autogenous receipt exporter](https://github.com/ruvnet/autogenous/blob/7bf327a9754ce798364dbee8b2825af42a421fd4/packages/radio-moe/src/receipt-export.ts)

ruClip’s governance document assigns build time evaluation to MetaHarness and runtime adaptation to Autogenous. The APx package follows that split through adapters and avoids creating a competing runtime promotion authority. No upstream APx merge or deployed ruClip measurement endpoint has been verified. [Pinned ruClip integration design](https://github.com/ruvnet/ruClip/blob/6e73a8f060bcbb69965a50ffe4627e33622d4094/docs/design/RUCLIP-METAHARNESS.md)

## Recommended design and why

Use a transparent output ratio as the primary quantity. Keep the exponent as a readable display, and publish cost, human help, acceptance, risk, and scope alongside it. Do not multiply arbitrary quality, autonomy, or novelty weights into a single opaque number.

Calibrate task classes narrowly enough that accepted outputs are comparable. Include failed human attempts in the reference rate. Predeclare all agent task slots, including failed and unfinished ones, and include all run time. Require each accepted deliverable to pass its frozen rubric and the appropriate independent adjudication.

A normal benchmark run reports conditional performance on a frozen workload. It does not establish the marginal causal impact of adding agents to a business. That causal question requires a randomized or appropriately controlled study of the whole workflow, including demand, coordination, and downstream outcomes.

The exponent is not intrinsically novel mathematics. Potential defensibility lies in trustworthy benchmark operations, licensed calibration data, accepted outcome records, governed integrations, and reproducible longitudinal evidence. This is a strategic inference, not a legal IP opinion.

## Pilot and acceptance

Start with bounded software maintenance before spanning all twelve domains. A planning example with 30 task instances and three human attempts of approximately one hour each needs 90 human reference hours, before grading, repair, and study administration. At an assumed $100 per hour, that reference labor alone costs $9,000. These are planning assumptions, not a recruitment quote or statistical power guarantee.

Use independent reviewers and a separate development set. Assess task representativeness, rater agreement, baseline uncertainty, and protected holdout handling before publishing a general claim. A second phase can add evidence briefs and synthetic accounting reconciliation with their own cohorts and rubrics.

Acceptance: an independent reviewer can reconstruct credited work, timing, costs, exclusions, and the displayed AP/APx from the frozen manifest and receipts. Doubling runtime without delivering more accepted work must not increase AP. A critical safety failure must block a publishable score. Synthetic inputs must remain synthetic in every export.

## Research limitations and stopping rule

This is a methodological synthesis and reference implementation, not an independent measurement of frontier systems or rUv. No human cohort was recruited. No real clinical, legal, financial, industrial, or robotic task was certified. The browser’s scenario values are invented teaching inputs, not industry estimates.

Discovery covered human time baselines, economic work benchmarks, execution evaluation, occupational taxonomy, governance, the name collision, and exact RuV adapter boundaries. Followup focused on the origin of the 3.1 figure, concurrent timing, holistic quality, and zeroed upstream resource fields. Research stopped once these consequential claims had primary support and the remaining gaps required real measurements rather than more literature.
