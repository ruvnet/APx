# APx native MetaHarness suite wrapper

This is a source aligned coding benchmark wrapper for `@metaharness/darwin@0.10.2`. It wraps the public APx regression suite. It does not measure human productivity, run a model, perform candidate evolution, certify APx, or exercise a live Autogenous service.

Copy these files into the APx package's `.harness/` directory. Run every generated task from the APx package root: native `task.repo` is `.`. The output uses the exact native `BenchSuite` and `BenchmarkTask` fields, and the native sorted JSON SHA256 task hash. The assurance sidecar is APx metadata, not an upstream schema extension.

## Development smoke check

```bash
node .harness/generate.mjs --development --out .harness/bench.development.json
npx -y @metaharness/darwin@0.10.2 bench verify .harness/bench.development.json
node --test test/core.test.mjs
```

The example suite contains `DEVELOPMENT-UNPINNED`, is tagged `not-certified`, and has no independent holdout. The native required `hiddenTestCommand` repeats the public command, honestly exposing that limitation. The suite's cost budget of zero prohibits paid work; it is not a measured cost claim.

Native `bench verify` verifies the task hash. It does not run the APx tests, prove that source is pinned, prove a holdout is hidden, validate a human cohort, or certify a productivity claim.

## Commit pinned generation

After reviewing and committing the APx package, supply its full actual commit SHA. There is no automatic `WORKDIR` or `HEAD` fallback. The generator requires the explicit SHA to match actual HEAD and requires the APx package subtree to be clean before it generates the suite.

```bash
node .harness/generate.mjs --commit YOUR_ACTUAL_LOWERCASE_40_CHARACTER_COMMIT_SHA --out .harness/bench.json
npx -y @metaharness/darwin@0.10.2 bench verify .harness/bench.json
```

Existing outputs are never overwritten. The pinned suite evaluates the earlier reviewed commit it names; adding the generated suite creates a subsequent commit and does not change the source identity being evaluated. Exact commit identity improves reproducibility but does not create hidden occupational evidence.

`--repo-path` can point to the APx package while generating from another working directory. `--created-at` accepts a canonical UTC timestamp for byte stable reproduction. `--out` resolves relative to the generator's process working directory.

```bash
node .harness/generate.mjs --repo-path . --development --created-at 2026-09-07T00:00:00.000Z --out .harness/bench.example.json
node --test .harness/generate.test.mjs
```

## Source provenance

Manifest: `@metaharness/darwin` version `0.10.2`, binary `metaharness-darwin`, observed source commit `d5833dc6512ac1adeeef91a331c29055cd8a4dbb`.

1. [Exact task and suite interfaces](https://github.com/ruvnet/metaharness/blob/d5833dc6512ac1adeeef91a331c29055cd8a4dbb/packages/darwin-mode/src/bench/types.ts).
2. [Exact task hash implementation](https://github.com/ruvnet/metaharness/blob/d5833dc6512ac1adeeef91a331c29055cd8a4dbb/packages/darwin-mode/src/bench/suite.ts).
3. [Package identity and binary](https://github.com/ruvnet/metaharness/blob/d5833dc6512ac1adeeef91a331c29055cd8a4dbb/packages/darwin-mode/package.json).

The wrapper is a development deliverable, not an upstream merged feature. [Native verifier execution evidence](VERIFICATION.md) records the real pinned package command passing against the included development suite, separately from source compatibility and separately from APx regression tests.
