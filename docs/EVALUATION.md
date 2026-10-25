# Evaluation protocol
No live-model accuracy or timing results have been recorded for this release.

## Mathematical checks
Run `node tests.mjs` (requires Node). These check analytic examples, orientation, restricted syntax, singular probes, and the automated comparison suite. They do not measure Gemma.

## Reproducible translation probe
Start Ollama, with your chosen model installed. In Windows CMD:
```
set FIELDTRIP_EVAL_MODEL=gemma3:1b
node evaluation/run.mjs
```
No npm install is needed. The probe runs 30 cases sequentially, saving every response, error and elapsed time to `evaluation/latest-results.json` after each case. The model output is checked against reference values at four fixed points. This is a diagnostic of translation, not full-app accuracy, symbolic equivalence or a hidden benchmark. Keep failed cases. Do not tune prompts on these cases and later describe them as unseen. The checked-in SHA256 identifies the original case file; document any changes.

## Manual end-to-end checks to record
- Local Gemma request, plan review, application and selected observations.
- Reject a plan and confirm the previous experiment is unchanged.
- Vortex: radius 2, circulation and curl flux 50.2655; reverse gives -50.2655.
- Loophole: default circulation 6.2832, curl flux 0; axis probe undefined.
- Explore for me: eight rows; replay row; export JSON; import it; recalculate.
- Unsupported requests: ask for a PDE solution, arbitrary surface, proof, time-dependent field, and scalar-only input. Record actual behavior; do not claim automatic abstention is implemented.
- Offline: download model first, disconnect Wi-Fi, reload localhost, request Gemma and export. Reconnect afterward. Record model and real time.
- Render: curated mode, source download and mobile layout; verify no live local inference is implied.

Record participant consent and genuine feedback if testing with another person. Do not infer learning gains from a working visualization.

## R7 rerun protocol
The uploaded original 2/30 result is preserved as evaluation/baseline-results.json. Its original prompt runner is run-baseline.mjs and writes a different filename if rerun.

R7 model-only uses the shared neutral translation prompt, without a concrete example answer:
```
node evaluation/run.mjs
```
Writes evaluation/model-only-results.json.

R7 hybrid uses the same direct formula extractor as the app, then asks the model only for remaining questions:
```
node evaluation/run.mjs --hybrid
```
Writes evaluation/hybrid-results.json. Report results by route. No generated result file overwrites the original uploaded baseline.

Local tests verified the direct extractor returned equivalent fields at the dataset's four sample points in 27 of the 30 seen development cases. Three were not directly parsed. This is a parser check on a development set already inspected, not a Gemma score or a held-out generalization result. No R7 live-model scores have been measured here.

Explicit formulas now work without a model: the app shows an extraction review, applies the accepted formula, and labels this route NO AI CALL. Natural-language questions still use Gemma's plan and observation selection. Do not imply the --hybrid translation probe measures that full UI workflow.

## R8 bounded planner
Gemma now returns only a field ID and comparison ID. It cannot supply or modify component formulas in this path. The same planner schema, prompt and validation module is used by the app and evaluation runner. The direct formula parser remains separate and visibly makes no AI call.

Start Ollama, then run:
```
set FIELDTRIP_EVAL_MODEL=gemma3:1b
node evaluation/run-planner.mjs
```
The runner records 24 new author-created questions: 15 supported examples and 9 outside-scope requests. It scores field selection and comparison selection separately and saves raw outputs/errors/timings to a timestamped planner-results file. Neither retries nor repair passes are used. A returned outside_scope ID must be paired with none. That enforces output consistency, not correctness of the scope decision.

The questions are frozen before the first live-model run. They were authored alongside the planner, so do not call them an independent or hidden benchmark. If prompt or dataset changes follow observed errors, subsequent results become development results. Record hashes and retain failures. No R8 live model accuracy has yet been measured.

Manual app check: ask for a rotating field with increasing loop radii; review and accept the plan; confirm four radius rows. Ask to solve the heat equation; if Gemma chooses outside_scope, confirm no scene change. A supported answer to an unsupported question is a planner error and must be reported. For a source visualization without comparison, no table should be auto-created. The generic Explore for me button still computes all eight comparisons independently of AI.
