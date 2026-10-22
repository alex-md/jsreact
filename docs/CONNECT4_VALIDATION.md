# Connect 4 validation

Run `npm run test:connect4` for board rules, legal move handling, tactical wins and blocks at every non-random strength, shared-position validation, terminal positions, and Master endgames checked against an independent array-based oracle.

Run `npx --yes --package typescript@5.7.3 tsc --project tests/tsconfig.connect4.json` for the focused TypeScript check.

Build with `npm run build`, then run `npm run preview -- --host 127.0.0.1`. Open `/connect4/` on that preview server and run the function in `tests/connect4.browser.js` through Playwright's browser code tool. The browser checks use actual bundled workers and verify:

- One AI request and one reply per turn at all three practice difficulties.
- Turn-based practice undo/redo, human input disabled during AI turns, and stale reply cancellation after reset, undo, or a mode switch.
- Worker error recovery, winning hints, winning-cell highlights, keyboard activation, draws, and invalid URLs/settings.
- Help keyboard focus and Escape dismissal.
- All four Connect 4 routes at 320, 390, 768, and 1440 pixels: visible mobile solver controls, no horizontal overflow, working section anchors, one heading, canonical URLs, descriptions, and parseable structured data.

Additional release checks: manual hints at all five strengths, Red/Yellow targeting, preset positions, sharing, full practice games, and desktop/mobile screenshots. Build success and local browser checks do not confirm a production deployment or search ranking changes.
