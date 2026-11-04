---
name: verify-celestial-garden
description: Serve RippleGame's actual Aura canvas garden, drive taps/long press/Codex and share import with browser input, prove clipboard and reload behavior, capture both widths, and keep organic unlock/audio/device limits explicit.
---
# Aura celestial garden verification

## Launch
Static index.html imports js/app.js,state.js,entities.js,constellation.js,ui.js. No build or runtime dependency required. For manual use `python3 -m http.server 8080 --bind 127.0.0.1` from repo root. Install proof dependencies with `npm ci --ignore-scripts --prefix .cursor/skills/verify-celestial-garden`. Node22.12+ and Chrome required; CHROME_PATH can override /usr/bin/google-chrome. Use an isolated browser profile: storage key auraGardenState belongs to that garden, and URL import deliberately replaces its state. Never import a fixture into the user's existing garden.

## Doctor
`node .cursor/skills/verify-celestial-garden/helpers/verify.mjs /tmp/garden-proof` owns an ephemeral loopback static server and fresh browser contexts. The actual app must initialize canvas, not just answer HTTP. Read-only module state observations distinguish UI clicks from unintended garden awakening. No internal setters or App.handleInteraction calls drive behavior. The helper drives actual mouse/buttons/keys and production URL import. It blocks external fonts, so pixel proof uses fallbacks rather than claiming font-provider availability.

## Drive
At390/1365 open Codex without awakening canvas, verify empty list, native button focus containment, empty-share feedback, Escape and focus return. Real canvas clicks include x=0 (must stay finite), double tap/pulse and650mslongpress/superripple. Actual persisted-state import uses a labeled LYRA URL fixture, not an organic harmonic unlock. Codex shows Lyra, Share writes the real browser clipboard, decoded link preserves it, reload still has Lyra. Invalid null/nonfinite/prototype-key imports cannot crash animation or replace valid current progress. Share test grants clipboard permissions in its fresh context only. Chrome clipboard-sanitized-write is needed for writeText; clipboard-write alone can deny it in this harness.

## Evidence
Named output includes result.json and both-width initial/ripples/Codex PNGs. Inspect pixels after transition settles. Source fixes preserve garden visual design: only canvas starts mouse charge, zero coordinates remain valid, intro no longer hides behind the opaque canvas or keeps pulsing after awakening, Codex uses named native buttons instead of an unavailable emoji glyph, imported data is bounded/validated and saved for reload. Existing Codex shape/theme retained; this is not a redesign. AudioContext-running state is not musical/aesthetic acceptance. Module reads observe result only; they do not seed unlocks.

## Cleanup
Helper owns/closes its server/browser, leaves named evidence. Every run needs separate output/fresh context. PROOF_WIDTH=390 or1365 bounds a diagnostic run; final result must identify the widths actually tested. Failed iterations close owned resources before rerun. Never kill all Chrome by name or delete saved source/proof. One timed-out iteration can leave its exact owned browser PID; verify ownership before cleanup. No deployments/settings/purchases or provider contact.

## Coverage and maintenance
Organic harmonic discovery/seed bloom/shooting-star collision, listening/audio artistry, physical touch/OS lifecycle, device performance and hosted/CI acceptance remain unverified. The reduced-motion check covers CSS transitions/visibility only: canvas animation still runs and is an owned accessibility gap, not a full reduced-motion pass. Existing openPR11 owns blur/touchcancel/pointercancel/background interruption fixes; this source change does not supersede it. No dependencies upgraded. Use /maintain-verification-skill after changes; expand actual user journeys rather than importing fixtures and calling them gameplay.
