# R9 scope gate: quick check
1. Restart the server from this extracted folder. Hard refresh Chrome. Logo: LAB · R9.
2. In Gemma settings, select gemma4:e2b (existing saved model settings are preserved, so change them manually if necessary).
3. Ask 'Solve the heat equation on a cube.' Expect CODE SCOPE CHECK / UNSUPPORTED / NO AI CALL; scene unchanged.
4. Ask 'Change the surface.' Expect CLARIFICATION / NO AI CALL; scene unchanged. Clarify by submitting a new question naming the field.
5. Ask 'Show a smooth rotating field and compare small and large circular loops.' Expect a live Gemma plan, review dialog, and four radius comparisons after acceptance.
6. Enter F=(-3*y,3*x,0). Expect direct formula review, no model rewrite.

The code uses phrase rules for known unsupported requests and requires a recognizable field hint before natural-language inference. It can miss unsupported requests and can over-block negated mentions. Passing a gate is not semantic verification. Always review the proposed plan. No general scope-rejection accuracy claim is warranted. The rules were added after seeing planner failures and must not be counted as improved Gemma scores.
