# Native verification evidence

Executed September 7, 2026 on Node `v24.19.0`, npm `11.9.0`.

## Native package execution

```text
npx -y @metaharness/darwin@0.10.2 bench verify bench.development.json

Suite apx-development-smoke@0.1.0: 1 tasks, hash OK (0b712aa1ee24…)
exit code: 0
```

The actual invocation supplied the absolute path of `bench.development.json` and used the APx package as its working directory. The filename above is shortened for portability.

Verified task hash:

```text
0b712aa1ee24fd02d47b23e7b654c8d0060f8d5a715c12525750387bcb23240a
```

The package really executed. This result establishes compatibility with the native Darwin suite hash verifier, not just an internally reproduced checksum. It does not establish native evolution, independent holdout evaluation, a production integration, or measured human equivalent output.

## Separate local regression execution

```text
node --test generate.test.mjs
10 tests passed, 0 failed

node --test test/core.test.mjs
96 tests passed, 0 failed
```

The APx tests were executed separately from the native hash verifier. Their execution time was about 0.64 seconds on this single development run and is not a latency benchmark or an APx observation interval. No paid models, credentials, live company actions, candidate evolution, or upstream writes were used.

The example deliberately remains development unpinned and non certified. A real source snapshot, independently protected holdout, calibrated human cohort, and operational evidence controls remain necessary for a measured productivity claim.
