# FieldTrip — the lazy vector calculus lab

One question becomes a structured experiment plan, a particle field, symbolic derivatives, numerical checks, and an exportable lesson. Five curated examples work immediately; personalised AI planning requires a real Gemma endpoint.

## Start locally

Python 3.10+ is sufficient to host the app (no Python dependencies):

```
python server.py
```

Open http://localhost:8765 . For Windows, `py server.py` also works.

## Connect Gemma with Ollama

Install Ollama from its official distribution, review the model licence, and download a compatible Gemma model, for example `ollama pull gemma3:4b`. Model availability and performance depend on the device. Start Ollama. In the lab's Connect Gemma dialog, set endpoint to `http://localhost:8765` and model to the installed name. The local proxy calls Ollama at `http://127.0.0.1:11434`; this avoids browser CORS configuration. Local model weights are not included.

A prompt goes to Gemma, which returns a finite JSON plan (a reference experiment, three restricted field expressions, strength, radius, surface lift and explanation). The app validates the schema, expression syntax and parameter bounds, computes its own results, and renders the experiment. A second model call receives the computed derivatives, parameters and integral values to explain the results. Model text is displayed as text, not executable HTML. No generated code is executed. Gemma's explanation is model generated and may contain errors; computed math is separately inspectable.

Without a connection, text prompts perform keyword selection of curated examples. The interface explicitly labels this. This is not live inference and must not be presented as such in a submission.

## Optional OpenAI-compatible Gemma host

`server.py` supports a fixed OpenAI-compatible destination. Set `FIELDTRIP_PROVIDER=openai`, `FIELDTRIP_MODEL_URL` to the provider's API base including `/v1`, `FIELDTRIP_MODEL` to an available Gemma model ID, and `FIELDTRIP_API_KEY` in your terminal environment (never in source or the browser). Restart the local server; the browser endpoint stays `http://localhost:8765`. This adapter has not been tested against DigitalOcean or a live model. Verify the provider's current model catalogue and prices. It imposes no paid resource creation.

The server deliberately binds to localhost. Production hosting of model credentials needs authentication, rate limiting, TLS, budgets, and fixed upstream configuration. The published static preview contains no credentials or running model.

## Math and domain

- Cartesian fields with three restricted expressions. Variables x, y, z and strength a.
- math.js symbolic derivatives for divergence and curl.
- RK4 particle trajectories, with respawning at the display boundary. Particle density is NOT a divergence calculation.
- Circle boundary `(R cos t, R sin t, 0)`; spanning surface `(r cos t, r sin t, h(1-r²/R²))`.
- Independent midpoint integration for boundary circulation and curl flux (32 radial × 128 angular samples, refinement 64 × 256).
- Reversing orientation changes both boundary direction and surface normal.
- Numerical agreement is not proof; samples can miss singularities. Smoothness and domain hypotheses need independent review.
- The singular vortex excludes the z-axis. Its disk fails Stokes' hypotheses. This is a standard counterexample, not a newly discovered result.
- Custom fields cannot solve arbitrary PDEs, evaluate all possible surfaces, or certify global conservativeness.

## Visualisation

Three.js field arrows (instanced cone heads), particles, trails, boundary and deformable surface. GSAP camera reset. Canvas projection fallback when WebGL is unavailable; it uses the same field and RK4 integration. Animation starts paused for reduced-motion preference. Play/pause, speed, layer toggles, probe coordinates, surface lift, radius, strength and orientation controls are available. Source fallback was browser tested; hardware WebGL was unavailable in QA.

## Reuse and exports

Export lesson downloads Markdown with expressions, computed results, assumptions and a JSON workspace. Save workspace persists one browser-local workspace, restorable in How this lab works. No accounts or server database. Source ZIP includes everything needed to run locally. All JS dependencies are vendored; fonts are optional online resources. Full network-disabled operation with a local model has not yet been verified.

## Verification

`node tests.mjs` checks analytic circulation, derivatives, orientation reversal, deforming a surface, a custom field, the singular example, and rejection of unsafe syntax. Browser checks cover preset selection, custom expression editing, counterexample warnings and exports. No live model inference was available during development; test with your Gemma endpoint before presenting this as a completed AI challenge entry.

## Hosting and sponsor status

`render.yaml` can deploy `dist` as a static site. DigitalOcean can supply a compatible Gemma endpoint through the local adapter. Neither deployment has been made to those services. Mastra, Temporal, Sentry and the other discussed integrations are not implemented. Do not claim their use in the entry.

## References

- https://threejs.org/docs/pages/InstancedMesh.html
- https://mathjs.org/docs/reference/functions/derivative.html
- https://ai.google.dev/gemma/docs/capabilities/text/function-calling-gemma4
- https://docs.sympy.org/latest/modules/vector/vector_integration.html (background reference; SymPy is not used in this browser build)

## Licensing

Original source: MIT (LICENSE). math.js: Apache-2.0. Three.js: MIT. GSAP: its standard licence (https://gsap.com/standard-license/). Gemma weights have separate terms and are not redistributed. Preserve third-party notices bundled in vendor files.

## Checked observations update
Gemma creates the field plan and selects observation IDs from an eligible catalog. The UI renders mathematical statements from that catalog rather than free-form generated prose. Symbolic derivatives and numerical integrals are displayed directly. Polynomial fields are certified smooth using a restricted AST check; other custom domains remain uncertified. This does not verify that Gemma faithfully interpreted every user question. Live model testing is still required on the target laptop.

## R6: automated investigations
Click Explore for me to compute eight comparisons: four radii, three surface lifts and reversed orientation. Click any row to replay it. Export investigation JSON and import it to recalculate a workspace. The comparison table uses fixed settings from when it was created. Model plans are shown for review before application.

See docs/EVALUATION.md for the 30-case translation probe and manual UI/offline checks. No live-model benchmark results are bundled. See docs/ARTICLE-PLAN.md for article evidence requirements. Render deployment is still pending.

## R7: preserve explicit formulas
The question box reads supported F=(...), F=[...], F=<...>, labelled Fx/Fy/Fz and components lists directly. Review extracted formulas before applying. This route never calls AI and is labelled accordingly. Natural-language behavior requests still use Gemma. The evaluation now has separate model-only and hybrid commands; see docs/EVALUATION.md. Table buttons explicitly say Replay.

## R8: bounded Gemma planner
For language-based requests, Gemma selects one supported field (vortex, source, saddle, gradient, singular) plus a comparison (radius, surface, orientation, none), or outside_scope. Code supplies formulas and calculations. Plans are reviewed before application. The requested comparison runs automatically after acceptance. No unrestricted formula generation or generated mathematical prose is used in this route. Gemma can still choose an inappropriate example; plan review and separate evaluation remain necessary.

Run `node evaluation/run-planner.mjs` with Ollama running to measure the bounded planner. The original translation scores and R7 files are retained separately. Render deployment remains pending.

## R9: code scope gate
Known unsupported tasks (PDE/quantum solving, formal proofs, arbitrary geometry and certain unrelated topics) are blocked before inference. Requests without an explicit formula or recognizable field behavior ask for clarification. The scene remains unchanged on these paths, with a CODE SCOPE CHECK / NO AI CALL label. Phrase rules are conservative and incomplete; they can miss requests or over-block negations. Plan review remains necessary. The model-settings default is gemma4:e2b; saved browser settings are not silently overwritten. See docs/R9-QUICK-CHECK.md.
