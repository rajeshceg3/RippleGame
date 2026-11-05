# Interrupted-charge repair

Source discovery found overlapping lifecycle and gesture state:

- Lifecycle: not initialized -> ready -> background -> ready.
- Gesture: idle -> charging -> release (short tap or long super ripple) -> idle.
- Cancellation: charging -> idle without an emitted ripple/sound.

Before this repair, blur, touchcancel, pointercancel and backgrounding had no shared cancellation transition. A held pointer followed by simulated document-hidden left isCharging/isPointerDown true; a later release emitted ripples. The cancellation transition now resets both flags and the start timestamp.

An explicit method is enough here. No new state-machine framework or rewrite is needed. Invariant: cancellation never commits a charge; a subsequent release is inert until a new press.

## Current-main reconciliation (5 November 2026)

PR11's cancellation transition was applied additively to main94c85a4. The newer
canvas-only mouse start, Codex buttons and focus, bounded storage/hash import,
share/clipboard behavior and verification workflow remain intact. Do not replace
current main with PR11's older tree.

## Executed verification

Install the existing verification dependencies with
`npm ci --ignore-scripts --prefix .cursor/skills/verify-celestial-garden`.
Run `node .cursor/skills/verify-celestial-garden/helpers/cancellation.mjs /tmp/cancellation-proof`.
The helper owns a loopback server and fresh browser contexts. It drives real
browser mouse input and CDP-emulated touch input at 390 and 1365px. App module
state is observed read-only. Blur, touchcancel, pointercancel and hidden/visible
events are simulated, not physical OS lifecycle tests.

All 16 combinations reproduced the stale charge and unwanted release on the
unmodified main baseline. All 16 passed with this additive transition. Each case
also exercised four rapid blur/release cycles and a new long hold. A cancelled
initial charge did not initialize the garden; a fresh tap and long hold recovered.
No page errors occurred. Named screenshots and result.json are written to the
chosen output directory. The current input/Codex/share regression helper also
passed both widths after the change.

This is local app behavior proof, not CI, hosted acceptance, physical touch,
organic constellation discovery, seed bloom or shooting-star collision coverage.
Existing reduced-motion canvas, audio artistry and device performance gaps remain.
