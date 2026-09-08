# APx reference core security assessment

Scope: this local package, CLI, pure metrics, contract adapters, and newline-delimited stdio MCP. Threat actors include malicious or mistaken receipt submitters, benchmark optimizers, compromised evidence producers, and local untrusted clients. Data classes are task identifiers, hashes, scores, governance IDs, costs, and time; raw personal data and secrets should not appear in receipts.

## Controls and remaining risks

| Boundary | Abuse | Implemented control | Residual risk / owner |
| --- | --- | --- | --- |
| JSON ingress | Memory/CPU denial or prototype keys | 1 MiB, depth/node limits, task/attempt/campaign/iteration limits, reserved key rejection | Local caller can still consume bounded CPU; service operator must add process quotas |
| Evaluator | Shell execution, SSRF, arbitrary submitted code | No shell, network, remote loading, eval, or untrusted program execution in core | Future native runners need isolated workers and explicit capabilities |
| Receipt truth | Forged evidence, omitted time, fabricated human baseline | Complete declared sets, hash consistency, explicit provenance and timing fields | Hashes do not authenticate data; study owner needs signatures, immutable logs, and independent audit |
| Work credit | Duplicate outputs and failed-task removal | Exact ID/hash deduplication, frozen task sets, failures retained | Semantic duplicates and hidden work require independent adjudication |
| Promotion | Holdout leakage, pseudoreplication, speed hiding quality loss | Separate IDs, full-campaign bootstrap, task/class/quality/safety/cost gates | Statistical independence and pristine holdouts require outside scheduling and governance |
| ruClip governance | Approval confused with correctness; unmetered zeros treated as free | Separate adjudication, approval policy violations, explicit unknown metering | Caller must retain imported violations and protect receipt authenticity |
| CLI file input | Read special files or oversized content | Regular-file and size checks; JSON only | Local user explicitly chooses path; do not expose CLI file paths as a remote API |
| MetaHarness task pack | Submitted commands become code execution | Compiler treats commands as bounded data and never executes them | Native runner operator must trust repository configuration and isolate task execution |
| Campaign envelopes | A stored result or manifest is edited after evaluation | Canonical envelope hash binds kind, timestamp and payload | Hashes detect changes but do not authenticate the publisher; production needs signatures and immutable storage |
| Outputs | Synthetic results represented as certification | Synthetic/pilot labels, certified=false, deployAuthorized=false | A publisher can misquote outputs; product UI must preserve status and limitations |

No credentials are accessed and no network calls occur in runtime code. Tests spawn only local Node CLI processes with controlled commands to verify the CLI boundary; this is not a scorer capability.

## Assessment provenance

Method: direct source inspection, deterministic negative and integration tests, and read only Ruflo 3.25.6 scans. Runtime dependency count for the benchmark package is zero. No external advisory feed was queried because the standalone benchmark has no third-party runtime dependencies. Node runtime vulnerabilities, host hardening, the separate Site dependency tree, and any future dependencies remain outside this package assessment. The deep scanner reported zero findings and the secret scanner reported no detected secrets on 2026-09-08. Scanner coverage is supporting evidence, not proof of security.

No confirmed critical/high code issue remains from this scoped inspection. This is not a production security certification. Evidence authenticity, representative calibration, signatures, independent holdout governance, resource isolation for future native task execution, and authenticated remote access are explicit deployment blockers for certified or remotely hosted scoring.

Independent review identified and remediated six material integrity gaps: known safety failures now invalidate official scores across the whole run; measured outcomes require independently declared human adjudication bound to run, task, evaluator, artifact, and acceptance decision; measured baselines require participant/protocol/provenance/adjudication bindings; human labor cannot increase during promotion or fall below elapsed review time; conflicting admissible deliverable/hash aliases reject the run; and direct APIs enforce depth/cycle/reserved-key and task-identifier guards. Exported results retain their complete comparison context. Regression tests cover each finding. These structural safeguards do not prove receipt authenticity.

Validation command: `node --test`. Relevant test names cover nonfinite/negative fields, missing fields, all frozen hash mismatches, exact task sets, provenance requirements, duplicate IDs/artifacts, prototype keys, input depth/bytes, bounded bootstrap, and MCP unknown tools.
