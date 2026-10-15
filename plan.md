# Investments Destination Ghana — Visa Application

## Product scope
Build a responsive, client-facing visa application intake flow from the supplied Visa Application Requirement Form PDF. It is a public, browser-only form in this phase (no database, file storage, or notifications were selected in the confirmed blueprint). It should guide applicants through identity, document readiness, service selection, approval details, review, and a final confirmation state.

## Implementation approach
- React + TypeScript single-page flow in `client/src/pages/Home.tsx`.
- Use local React state for form values, selected service, upload metadata, step navigation, and success state. Values are preserved while navigating between steps.
- Use accessible native inputs and buttons with inline validation; use `framer-motion` for step transitions, progress changes, upload state transitions, and confirmation choreography.
- Keep document uploads in-browser only for now: validate file size/type, show a preview/file state, allow replace/remove, and simulate a brief progress state without claiming durable storage.
- Use the existing Tailwind v4 setup plus focused custom CSS in `client/src/index.css` for the brand system and responsive layout.
- Serve the required route manifest at `public/manus-routes.json` for `/` and `/404`.
- Keep server/database resources off; no persistence or external submission endpoint is introduced beyond the client-side success confirmation.

## Project structure
- `client/src/pages/Home.tsx`: the complete multi-step form UI and interaction state.
- `client/src/index.css`: global theme variables, typography, layout, responsive rules, motion helpers, and branded surfaces.
- `client/src/App.tsx`: existing route shell, retaining `/` and `/404`.
- `public/manus-routes.json`: route declarations for the preview/published site.
- `app.config.ts`: project logo metadata.
- `TODO.md`: outcome checklist and acceptance clauses.

## Design direction

### Styles considered
- **Ghanaian editorial modernism** — 0.07: warm paper surfaces, deep forest ink, and red-gold-green accents presented with an editorial application dossier feel.
- **Quiet luxury immigration concierge** — 0.05: restrained navy/cream with high-contrast serif typography and calm, premium service cues.
- **Tech-forward civic utility** — 0.04: crisp cobalt, modular cards, and dense dashboard-like information hierarchy.

### Chosen style: Ghanaian editorial modernism

- **Design Movement:** contemporary editorial forms inspired by West African print craft and modern civic service design.
- **Core Principles:** guided not bureaucratic; warm and trustworthy; visible progress; generous breathing room with purposeful information density.
- **Color Philosophy:** a deep forest ink grounds trust and professionalism, warm cream keeps the experience human and paper-like, while a restrained Ghana flag trio (red, gold, green) is used as confident accents rather than decoration.
- **Layout Paradigm:** an offset two-column dossier: a fixed-feeling left rail for orientation and a flowing right-hand form canvas, collapsing into a single column on small screens. Avoid a centered generic form stack.
- **Signature Elements:** a red/gold/green micro-stripe, rounded dossier cards with small uppercase labels, and a “review before release” summary panel that feels like a stamped application record.
- **Interaction Philosophy:** every action should acknowledge progress; fields reveal with short slide/fade movement, upload cards become visibly ready, and service selection updates the fee summary immediately.
- **Animation:** 180–260ms ease-out transitions for controls and cards; step changes use a soft horizontal slide plus fade; upload progress uses an indeterminate shimmer; success state uses a single celebratory ring/check reveal without excessive motion. Respect `prefers-reduced-motion`.
- **Typography System:** `DM Sans` for body/UI labels and `Cormorant Garamond` for large editorial headings and the brand wordmark. Use compact 11–12px uppercase labels with wide tracking for metadata; keep core inputs at 16px minimum on mobile.
- **Brand Essence:** “A clear, considered route from arrival intent to Ghana-ready documentation.” Personality: assured, welcoming, exacting.
- **Brand Voice:** headlines are calm and direct; CTAs are action-led without pressure. Examples: “Bring your Ghana visit into focus.” / “Review your application before release.”
- **Wordmark & Logo:** wordmark paired with a small outlined destination pin/compass mark and the Ghana micro-stripe.
- **Signature Brand Color:** `#0d3b2e` deep forest ink.

## Acceptance behavior
The UI must include all PDF fields and options, support responsive layouts, preserve values, provide inline validation, render upload states and previews, show the selected fee, support review/edit, and finish with an obvious confirmation state after final submission.
