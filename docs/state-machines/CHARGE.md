# Interrupted-charge repair

Source discovery found overlapping lifecycle and gesture state:

- Lifecycle: not initialized -> ready -> background -> ready.
- Gesture: idle -> charging -> release (short tap or long super ripple) -> idle.
- Cancellation: charging -> idle without an emitted ripple/sound.

Before this repair, blur, touchcancel, pointercancel and backgrounding had no shared cancellation transition. A held pointer followed by simulated document-hidden left isCharging/isPointerDown true; a later release emitted ripples. The cancellation transition now resets both flags and the start timestamp.

An explicit method is enough here. No new state-machine framework or rewrite is needed. Invariant: cancellation never commits a charge; a subsequent release is inert until a new press.

## Executed verification

`tests/charge-cancellation.cjs` uses real browser mouse press/release at 390 and1365px. Cancellation and document visibility events are simulated, not physical-device OS backgrounding or real touch cancellation. All four cancellation routes leave gesture idle; later release creates no new ripple; ordinary taps still create ripples; no page errors. Exact results in charge-proof.json.

This is local app behavior proof, not production or all-game feature coverage. Preview/deployment follow-up still required before a shipped claim.
