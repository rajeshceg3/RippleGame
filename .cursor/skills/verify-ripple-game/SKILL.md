# Verify RippleGame
Aura: Celestial Garden (Fortified) - static ripple/garden experience.
## Launch
Any static file server from the repo root.
## Doctor
`python3 .cursor/skills/verify-ripple-game/verify.py`
## Drive
Serves the static site and renders it in headless Chromium asserting the boot marker and zero JS console errors.
## Evidence
`.cursor/skills/verify-ripple-game/evidence.json`
## Cleanup
Static/streamlit/next server terminated after the render.
## Known boundaries
Render smoke only; e2e suites not exercised here.
