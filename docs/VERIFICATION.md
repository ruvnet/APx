# APx v0.1 verification

7 September 2026. Runtime: Node v24.19.0. Package supports Node 22 or newer.

## Executed checks

| Check | Result | Scope |
| --- | --- | --- |
| Reference kernel tests | 130 passed | Arithmetic, calibration, gating, deduplication, receipts, promotion, CLI, MCP, bounded input |
| Native suite generator tests | 10 passed | Exact native fields, sorted hash, explicit commit, development labeling |
| Site tests | 8 passed | Calculator/kernel agreement, invalid values, rendered HTML, existing UI primitives |
| Native Darwin 0.10.2 verifier | Exit 0, hash OK | Native coding suite hash compatibility only |
| APx frontend TypeScript project | Exit 0 | Implemented site surfaces and imported controls |
| Production build | Passed | Vinext Worker and client compilation |
| Ruflo 3.25.6 security scan | No findings reported | Bounded local source scan; not proof of security or evidence authenticity |

The combined kernel and generator invocation passed 140 tests in about 0.74 seconds in this environment. This is test execution time, not agent work output. Site tests passed separately in about 2.07 seconds. Performance figures are one local run, not a controlled speed benchmark.

Commands:

```bash
cd benchmark
node --test test/core.test.mjs .harness/generate.test.mjs
node bin/apx.mjs demo | node bin/apx.mjs evaluate -
npx -y @metaharness/darwin@0.10.2 bench verify .harness/bench.development.json
```

From the Site checkout:

```bash
node --test tests/*.test.mjs
npx tsc --noEmit --project tsconfig.apx.json
```

## Independent review fixes

1. Known task safety failure previously left an aggregate score eligible. It now yields INELIGIBLE, official AP null and APx null, with diagnostic work separately labeled.
2. One unrelated adjudication could previously be reused across tasks. Measured evidence now requires task, artifact, evaluator, run and decision binding, plus independent reviewer declarations.
3. Measured baselines now require protocol and participant metadata, observed attempt evidence and adjudication. Relabeling and rehashing a synthetic fixture is insufficient.
4. Faster campaigns could hide unlimited additional human labor. Total and per campaign human labor regression now blocks promotion.
5. Transitive conflicting deliverable aliases now reject the run instead of crediting a second identity.
6. Direct programmatic input also receives reserved identifier, nesting and cycle checks.

The parent independently reproduced the safety case after repair and obtained INELIGIBLE with null official scores. The extra human labor case returned REJECT with explicit labor regression reasons.

## APx MetaHarness

The APx MetaHarness adds a native Darwin suite compiler, frozen campaign envelopes, run evaluation, paired promotion, bounded file input and tamper detection. Its visible software selection pack compiled successfully and the exact native verifier reported one task with a valid suite hash.

The integrated regression command now passes 158 checks, including ten MetaHarness checks for task pack identity, source pin format, multiline command rejection, envelope tampering, end to end synthetic promotion and the permanent absence of deployment authority. Ruflo 3.25.6 deep and secret scans reported zero findings in the new MetaHarness directory. Direct inspection still treats native task execution, receipt authenticity, human calibration and holdout custody as external trust boundaries.

## Explicit limits

No browser, screenshot, visual, mobile device or end to end interaction QA was requested or performed. The Three.js render is implemented and compiled; visual realism and real device frame rate have not been measured.

The optional whole scaffold TypeScript invocation reported missing platform runtime declarations in untouched Worker/database helpers. An attempt to generate platform types hit an access boundary and was stopped. A separate local APx frontend type project passed. This is not a claim that the whole scaffold type check passed.

No live Autogenous or ruClip service, paid model, actual occupational human cohort, external approval authority, signed third party certificate, or real rUv productivity dataset was exercised. Adapters and input declarations are not authentication. The native suite is a visible development smoke wrapper with no independent holdout.

The tutorial result is synthetic: AP 9, APx approximately 3.169925, certified false. Its three toy computations execute for real, but human reference hours, workflow timing, costs and agent runtime remain invented teaching inputs.

The initial scanner reported no source findings even before independent reasoning uncovered scoring flaws. This is why the verification gate relies on reviewed invariants and evidence, not a clean scanner badge.

## Acceptance

Extract the package, run the kernel and native generator tests, and reproduce the synthetic example. A safety failure must block official scores, copied evidence must not credit another task, extra human effort must not silently pass promotion, and zero accepted output must yield 0 AP with a null exponent.
