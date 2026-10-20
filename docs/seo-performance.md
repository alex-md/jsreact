# SEO and performance work — 2026-10-20

## Findings and changes

The supplied GA4 summary is a starting point, not a fresh traffic audit. A 23% decline with steady engagement does not establish performance as the cause; compare landing-page acquisition, organic queries, devices, and periods after deployment.

- Numigma previously placed a large setup interface between its generate button and results. Plain instructions, a worked example, collapsed customization, and a smaller default range now reduce the setup burden. Generation runs in a separate worker with a 30-second failure timeout. Shared seeds and depth options remain supported. Fixed the deeper-search profile's undefined `markup` reference.
- Domain Appraisal previously had no visible heading or explanation before its client-only form. The introduction and interpretation guide now ship in HTML. Removed the Tailwind CDN runtime and redundant stylesheet/font requests. Added deduplication, bare-domain validation, a request timeout, empty-response feedback, accessible status updates, and a provider link on failure. The existing Humbleworth endpoint failed in the browser and through curl during validation; successful live appraisals remain unverified.
- Connect 4 guides retain their existing answer-first layout, prominent solver links, and static HTML. Added jump navigation and a reproducible six-move winning exercise to the strategy and solver guides. Clarified that a double threat needs two playable squares.
- Upgraded React/React DOM from 18 to 19.3.1. Deferred the playground package manager and field-performance measurement. Isolated React and build runtime helpers from Monaco so unrelated routes need not download the editor.
- Removed the shared head's injected body opacity delay, which made already-rendered content wait for JavaScript and a fade.

## Rendering architecture and outstanding RSC work

This deployment is a Vite multipage static site with Cloudflare Pages functions. Guides already ship their text, metadata, canonical URLs, and JSON-LD in HTML; they do not require React hydration. Numigma is a browser tool, not a React page. The Domain form remains a React client island beneath static introductory content.

**React Server Components are not implemented by these changes.** React 19 alone does not enable RSC. A supported RSC bundler/framework and a separate rendering/build integration are still required. `react-dom/server` prerendering would be SSR/SSG, not RSC. An RSC migration must preserve all current URLs, Pages functions, asset paths, and worker bundling, and validate the existing React tools (Connect 4, OSRS, playground, keyword, and analytics). Do not add a `use server` directive to an ordinary Vite component and treat it as RSC support.

References: https://react.dev/reference/rsc/server-components and https://react.dev/learn/creating-a-react-app

No affected hero uses a raster image: the LCP candidates are text and tool UI. There is no applicable hero `<img>` to prioritize. For a future real hero use `fetchPriority="high"` in JSX (`fetchpriority="high"` in HTML), explicit dimensions, and eager loading; do not assign high priority to every icon or add an image for this purpose.

## GA4 settings verified live

Property: 321009523. Measurement ID in the source/build: G-ZEFG04PXR7.

On October 20, event data retention was 2 months and user data retention was 14 months. Event retention was changed to 14 months, saved, and verified by reopening the screen. Both now show 14 months. GA4 states changes take effect after 24 hours. Reset on new user activity remains enabled.

The property had zero custom dimensions. These event-scoped dimensions were created and verified:

| Display name | Event parameter |
| --- | --- |
| Page type | page_type |
| Result status | result_status |
| Puzzle difficulty | difficulty |
| Metric name | metric_name |
| Metric rating | metric_rating |

`content_group` is also supplied as the route family (a built-in GA4 dimension). New outcomes are `puzzle_generate`, `appraisal_start`, and `appraisal_complete`. Appraisal payloads include counts/outcomes, not submitted domain names. Do not register metric IDs or submitted input as custom dimensions.

`web_vital` events report LCP, INP, and CLS through the web-vitals library. `metric_value` is rounded milliseconds for LCP/INP and CLS multiplied by 1000. Filter by `metric_name` before interpreting it. The numeric parameter is not yet registered as a custom metric. Reporting begins only after these source changes are deployed, and custom definitions do not backfill historical events.

Proof: `output/playwright/ga4-retention.png` and `output/playwright/ga4-custom-dimensions.png`.

## Validation and release gate

- Production Vite build and sitemap generation.
- Deterministic puzzle generation across all four difficulty levels and three deeper-search levels; candidate sets preserve the target.
- Browser generation and deeper search, appraisal empty/invalid-input recovery, provider-failure path, and responsive layout checks at 390px.
- Confirm no Monaco imports/preloads on Domain or guide routes in the final build.
- Field targets: 75th percentile INP <200ms, LCP <2500ms, and CLS <=0.1, segmented by mobile Chrome. A successful build or a local timing is not evidence that those targets are met in production.
- After deployment: verify GA4 DebugView/collection, dimensions and outcomes; exercise real appraisals; compare acquisition and organic landing pages over equivalent periods. Inspect the GTM container for duplicate GA4 configuration since both GTM and a direct Google tag already exist.

No deployment or source push is included. RSC migration, successful appraisal service verification, and production Core Web Vitals remain outstanding.
