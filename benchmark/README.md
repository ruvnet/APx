# APx reference benchmark

AP measures accepted reference human work per observation hour. APx is its base 2 exponent. This is a proposed task-conditioned benchmark, not an established unit of intelligence or a measurement of rUv's output.

```text
AP = credited reference human hours / complete observation wall hours
APx = log2(AP)
AP = 0 implies APx = null in JSON
```

An accepted workload calibrated at 160 reference human hours, completed over 8 observation hours, scores AP 20 and APx approximately 4.32. This does not establish that twenty employees can be replaced, that twenty people would collaborate with the same efficiency, or that an agent clock hour equals a human clock hour.

## Run

Node 22 or later. No installation, package downloads, credentials, network calls, or runtime dependencies are needed.

```bash
node --test
node src/cli.mjs demo
node src/cli.mjs demo | node src/cli.mjs validate -
node src/cli.mjs demo | node src/cli.mjs evaluate -
node src/cli.mjs promote comparison.json
node src/mcp.mjs
```

The tutorial executes financial reconciliation, source prioritization, and output verification using bounded deterministic local functions. The functions genuinely run and their local milliseconds are measured. Human reference times, end-to-end workflow time, costs, and agent runtime are explicitly synthetic. It produces AP 9, APx approximately 3.17, and `certified: false`. These values are not evidence for a personal productivity claim.

## Interfaces

| Module | Exports | Purpose |
| --- | --- | --- |
| `src/core.mjs` | `freezeManifest`, `validateManifest`, `validateRun`, `evaluate`, `compareCampaigns`, `parseBoundedJSON`, `sha256` | Canonical receipts, validation, scoring, promotion |
| `src/metrics.mjs` | `powerMetrics`, `exponentToPower` | Browser-safe arithmetic, no Node imports; does not adjudicate evidence |
| `src/adapters.mjs` | `metaharnessAdapter`, `autogenousAdapter`, `importRuclipReceipt`, `importMeter` | Explicit APx contract adapters, not native interoperability claims |
| `src/demo.mjs` | `runToyTasks`, `demoFixture`, `runDemo` | Executable synthetic tutorial |
| `src/mcp.mjs` | `handleRpc`, `serve` | Newline-delimited stdio MCP subset |

```js
import { evaluate } from './src/core.mjs';
import { demoFixture } from './src/demo.mjs';
const { manifest, run } = demoFixture();
const result = evaluate(manifest, run);
console.log(result.AP, result.APx, result.status, result.certified);
```

MCP advertises `apx_evaluate`, `apx_validate`, and `apx_promote`. It supports initialize, ping, tools/list, and tools/call. Messages are bounded to 1 MiB, depth 32, 100,000 JSON nodes, and 1,000 messages per server session. This is a deliberately small stdio implementation, not a full remote MCP service or certification of compliance with every protocol feature.

## Important boundaries

The scorer checks structure and gates declared evidence. It cannot authenticate an adjudicator, prove submitted receipts are truthful, prove independence from an ID, prove a holdout was never viewed, or establish a representative human baseline. Hashes detect a mismatch against a trusted frozen manifest; hashes are not signatures. Operational deployment needs independent adjudication, metering, a protected manifest registry, privacy controls, and audited holdout allocation.

MetaHarness is represented as a build-time benchmark adapter. Autogenous is represented as a runtime receipt adapter. Neither adapter executes or changes either external system. ruClip is treated as job, issue, employee, budget, and approval orchestration. An approval is not correctness evidence. Its import requires an identified human adjudication and evidence hash. Upstream unmetered zero fields remain unknown; they do not become free or instantaneous work.

The package is private and unpublished. Promotion only returns a recommendation, with `deployAuthorized: false`. Synthetic or pilot results never receive a certificate.

## Acceptance

Run `node --test`. Then run `node src/cli.mjs demo | node src/cli.mjs evaluate -` and verify AP 9, APx approximately 3.17, `status: synthetic`, and `certified: false`. Replace fixtures only after freezing a real cohort, every task attempt, costs, timing boundaries, evaluator, and holdout policy.

See `docs/CONTRACT.md`, `docs/ADR-001.md`, and `docs/SECURITY.md` for rules and limitations.
