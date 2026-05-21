# Feature 1 — QA lab evidence (Lab 4.1)

Do not put secrets or tokens in this file.

---

## Summary

| Work item | Tests | Command | Outcome | Verification link |
|-----------|-------|---------|---------|-------------------|
| Dashboard card shape preset selector (UI + store + styles) | `ui/shared/dashboard-card/react/__tests__/DashboardCardShapeStore.test.ts` (added Lab 4.1) | `yarn test ui/shared/dashboard-card/react/__tests__/DashboardCardShapeStore.test.ts` | **PASS** (see run below) | Commit `66cdaad47af` on `Ash-Uchida/canvas-lms` `master`; PR optional — direct merge to fork |

---

## Item 1: Card shape preset selector (behavior-changing code)

### Project / issue identity

- **Feature:** Dashboard Card Appearance Preset Selector (`agents/tasks/feature-1/feature-1.md`)
- **FR trace:** FR-1 (selector), FR-3 (immediate apply), FR-4 (persistence) — `agents/tasks/feature-1/implementation-research.md`
- **Work item (board):** Card shape / appearance preset UI + persistence slice (same scope as Lab 3.2 implementation; link your GitHub Project issue URL here if not already in `implementation-evidence.md`): `https://github.com/users/Ash-Uchida/projects/` *(replace with your Lab 2.2 project URL and issue # when graded)*

### Implementation scope (what QA validated)

Application code changed in:

- `ui/shared/dashboard-card/react/DashboardCardShapeStore.ts`
- `ui/shared/dashboard-card/react/DashboardCard.tsx`, `DashboardCardBox.tsx`
- `ui/features/dashboard/react/DashboardOptionsMenu.jsx`
- `app/stylesheets/bundles/dashboard_card.scss`

### Tests added or updated

| Path | What it covers |
|------|----------------|
| `ui/shared/dashboard-card/react/__tests__/DashboardCardShapeStore.test.ts` | `isDashboardCardShape`; className + style helpers; store set/ignore invalid; custom event; localStorage persist key per `ENV.current_user_id` |

SCSS-only visual deltas are covered indirectly via JS helpers (`dashboardCardShapeInnerStyle`, etc.); full pixel/visual checks remain manual per `implementation-research.md` §5.

### Command + outcome

```bash
cd canvas-lms
yarn test ui/shared/dashboard-card/react/__tests__/DashboardCardShapeStore.test.ts
```

**Result:** PASS — Vitest v3.0.3, **10 tests** in 1 file, exit code 0 (run 2026-05-21):

```
✓ ui/shared/dashboard-card/react/__tests__/DashboardCardShapeStore.test.ts (10 tests) 4ms
Test Files  1 passed (1)
Tests  10 passed (10)
Duration  981ms
```

### PR / commit

- **Fork:** https://github.com/Ash-Uchida/canvas-lms
- **Implementation commit:** `66cdaad47af` — message `feature` (card shape store, menu, card render, SCSS)
- **QA test commit:** *(fill after you commit `DashboardCardShapeStore.test.ts` + agent markdown)*

### Rationale: automated tests required

Behavior-changing TypeScript/JavaScript (Zustand store, menu handler, card render wiring). Lab 4.1 requires unit-level checks for validators and persistence — not docs-only.

---

## Workflow trace (instructor skim)

1. Implementation agent delivered slice (`66cdaad47af`).
2. QA agent (`agents/quality-assurance.md`) added `DashboardCardShapeStore.test.ts` and ran `yarn test …DashboardCardShapeStore.test.ts` → pass.
3. Project item **Complete** only after this file documents pass (align with `agents/feature-implementation.md`).

---

## Items with justified no-test (none for Item 1)

*N/A for this lab slice — code changed.*

Template for future items:

| Work item | Why no automated test |
|-----------|------------------------|
| *(example: update `agents/feature-implementation.md` only)* | Docs-only; no runtime behavior |
