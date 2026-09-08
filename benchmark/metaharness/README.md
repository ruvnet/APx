# APx MetaHarness

This harness connects APx measurement to native MetaHarness Darwin task suites. It freezes task identity and evaluation context, compiles task packs, scores bound run receipts, and applies paired promotion gates.

It does not run submitted commands itself. Native MetaHarness or another controlled runner executes tasks. APx receives the resulting receipts and measures accepted output. This separation prevents a candidate from changing its own evaluator or treating runtime as useful work.

## Lifecycle

1. Author a selection task pack and keep the real holdout pack under independent control.
2. Compile the pack into the native Darwin suite format.
3. Freeze the human baseline, evaluator and environment into an APx campaign envelope.
4. Execute matched parent and candidate runs through a controlled runner.
5. Bind receipts to the frozen hashes and evaluate them with APx.
6. Compare at least five independent paired campaigns on the holdout partition.
7. Promote only when the lower confidence bound is positive and no quality, safety, cost or human labor regression exists.

## Commands

Run from the benchmark directory:

    node metaharness/bin/apx-metaharness.mjs compile metaharness/specs/software.development.json /tmp/apx-suite.json
    npx -y @metaharness/darwin@0.10.2 bench verify /tmp/apx-suite.json
    node metaharness/bin/apx-metaharness.mjs demo
    node metaharness/bin/apx-metaharness.mjs demo | node metaharness/bin/apx-metaharness.mjs promote -
    node metaharness/bin/apx-metaharness.mjs freeze campaign-input.json campaign.json
    node metaharness/bin/apx-metaharness.mjs evaluate evaluation-input.json evaluation.json
    node metaharness/bin/apx-metaharness.mjs promote promotion-input.json decision.json
    node metaharness/bin/apx-metaharness.mjs verify decision.json

Outputs use exclusive creation. Existing evidence files are never overwritten. Input files are limited to 1 MiB and use the APx structured input guard.

## Trust boundaries

Task pack commands are trusted repository configuration for the external native runner. This wrapper validates and compiles them but never executes them. Human baseline collection, independent adjudication, evidence storage and holdout custody remain external responsibilities.

The included software pack is a visible selection example. Its hidden test command repeats the public test and therefore provides no hidden evidence. It cannot certify APx or measure rUv's productivity.
