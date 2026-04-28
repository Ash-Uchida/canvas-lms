# Feature 1 Implementation Research: Dashboard Card Appearance Preset Selector

## Feature Summary
This feature adds a user-level preference for the visual style of Dashboard course cards in Canvas Card View. A user can choose from a small set of appearance presets (for example: `classic`, `bubble`, `star`, `cat`) and Canvas will consistently render that preset whenever the user returns to the dashboard.

This document extends the feature scope from `agents/tasks/feature-1/feature-1.md` and focuses on design, requirements, codebase traceability, and verification planning.

## In Scope vs Out of Scope

### In Scope
- Add a Dashboard UI control for selecting a card appearance preset.
- Persist the selected preset as a user-level preference.
- Apply the preset during dashboard card render in Card View.
- Provide a safe default when no preset is set or when a saved preset is invalid.
- Ensure accessibility and readability are preserved across presets.

### Out of Scope
- Arbitrary user-uploaded themes, SVG uploads, or custom CSS input.
- Full dashboard layout redesign or card content changes.
- Mobile app implementation parity (web scope only for this lab).
- Per-course preset overrides (single preference per user).
- Building the Lab 4 GitHub Projects MCP integration in this lab.

## 1. Design Considerations

### User Flow
1. User opens Dashboard in Card View.
2. User opens Dashboard options and selects an appearance preset.
3. Cards update in-place so the user immediately sees the new style.
4. Selection is persisted to user settings.
5. On refresh/new session, the same preset is applied automatically.

### UX and Product Tradeoffs
- **Preset-based customization vs freeform customization**
  - Presets are easier to validate for accessibility, safer for maintainability, and lower risk for layout regressions.
  - Freeform styling would increase complexity and security concerns (custom CSS behavior), so this is intentionally excluded.
- **Immediate preview vs save-then-apply**
  - Immediate apply provides better feedback and reduces confusion.
  - Requires graceful handling if persistence fails (fallback behavior and optional user feedback).
- **Placement in existing options menu**
  - Reusing the current dashboard options paradigm reduces UI discovery risk and avoids introducing a new settings surface.

### Data and Boundary Considerations
- Frontend state must reflect both local UI selection and persisted server state.
- Persistence should align with existing user settings patterns, where boolean settings are currently retrieved and updated via `/api/v1/users/self/settings`.
- This feature likely requires adding a new preference key that supports enumerated values (`classic`, `bubble`, etc.), not just a boolean.
- Card rendering is currently composed through the dashboard card React layer and existing class names/CSS bundles, so style preset application should likely map to a deterministic class or attribute on the card container.

### Security and Permissions
- Preference is user-scoped only; one user's selection must not affect any other user.
- API update/read must follow existing authorization model for "self" settings.
- Server should reject invalid preset values rather than storing arbitrary input.

### Canvas Domain Interaction
- Applies to users who use Dashboard Card View and have favorited courses shown in dashboard cards.
- Must coexist with existing dashboard preferences, including:
  - dashboard view mode (`cards` / `planner` / `activity`)
  - color overlay toggle behavior for cards
  - dashboard card position/reordering preferences

### Lab 4 Planning Metadata (for future MCP project sync)
- **Milestones**
  - Research complete
  - API/settings design approved
  - UI implementation complete
  - Test coverage and accessibility verification complete
- **Task Groups**
  - Add/extend preference contract
  - UI selector integration
  - Card rendering + style token/class wiring
  - Automated tests
  - Manual exploratory pass
- **Dependencies**
  - Confirm settings endpoint supports new preference type/value model
  - Confirm approved visual presets and naming
  - Confirm accessibility acceptance thresholds
- **Definition of Done**
  - Persisted preference works across sessions
  - Default and invalid fallback behavior validated
  - Unit/integration/manual tests passing
  - No regressions in dashboard card interactions

## 2. Functional Requirements

FR-1. The system shall provide a visible selector for Dashboard card appearance presets when the user is in Dashboard Card View.

FR-2. The system shall provide only predefined, supported preset options and shall not allow arbitrary style value entry.

FR-3. When a user selects a preset, dashboard cards shall update to that preset in the current session without requiring full page reload.

FR-4. The system shall persist the selected preset as a user-level preference.

FR-5. On subsequent dashboard visits and new authenticated sessions, the system shall apply the persisted preset automatically.

FR-6. If no preset has been saved, the system shall apply the default `classic` preset.

FR-7. If a persisted preset value is unknown or invalid, the system shall fall back to `classic` and continue rendering cards.

FR-8. A user's selected preset shall only affect that user's dashboard card appearance.

FR-9. Changing appearance preset shall not alter card ordering, favoriting state, or dashboard card content.

FR-10. The preset selector shall expose keyboard and assistive technology interaction equivalent to existing dashboard options controls.

## 3. Non-Functional Requirements

NFR-1 (Performance): Preset switching should feel immediate under normal card counts and should not cause noticeable dashboard interaction lag.

NFR-2 (Reliability): Preference write failures must not break dashboard rendering; cards should remain visible using last known valid style or default.

NFR-3 (Security/Privacy): Preference read and write operations must be constrained to authenticated user scope and reject unsupported values.

NFR-4 (Accessibility): Presets must preserve text contrast, focus visibility, keyboard operation, and screen reader-compatible control labeling.

NFR-5 (Observability): Failures to load or persist the preference should be loggable/traceable to support troubleshooting.

NFR-6 (Compatibility): Feature should follow existing Canvas dashboard settings patterns and not assume environment-specific deployment behavior.

## 4. Codebase Analysis Using Lab 2 Agent Workflow

### Hypotheses About Where Change Will Land
- Dashboard card rendering and interaction code in `ui/shared/dashboard-card/`.
- Dashboard options/menu entry points in `ui/features/dashboard/react/`.
- User preferences API and validation in `app/controllers/users_controller.rb`.
- Shared preference typing/environment plumbing in `ui/shared/global/env/`.
- Dashboard styling layer in `app/stylesheets/bundles/dashboard_card.scss`.

### Concrete Findings from Agent-Assisted Exploration
- Dashboard cards are fetched and rendered through `ui/shared/dashboard-card/loadCardDashboard.tsx`, where current dashboard preference data is passed into card container props.
- Card UI composition is centralized in `ui/shared/dashboard-card/react/DashboardCardBox.tsx`, which is a likely extension point for applying preset-specific container classes.
- Existing dashboard card behavior already includes user preference controls (example: color overlay toggle) in `ui/features/dashboard/react/DashboardOptionsMenu.jsx`, indicating an established UX pattern for adding another card-related option.
- Existing user settings endpoint supports boolean preference keys (`/api/v1/users/self/settings`) and is validated via `BOOLEAN_PREFS` in `app/controllers/users_controller.rb`.
- Dashboard card position persistence already exists as a per-user preference-like API (`/api/v1/users/:id/dashboard_positions`) and validates context/authorization in `app/controllers/users_controller.rb`, showing precedent for user-scoped dashboard customization.
- Frontend setting utilities already read/write selected user settings through `ui/shared/settings-query/react/settingsQuery.ts`, providing a pattern for integrating persisted setting reads/updates.
- Existing dashboard card tests are present in `ui/shared/dashboard-card/react/__tests__/DashboardCardBox.test.jsx` and related test files, indicating current test surface for behavior and regression checks.

### Representative Paths and Subsystems
- `ui/shared/dashboard-card/loadCardDashboard.tsx`
- `ui/shared/dashboard-card/react/DashboardCardBox.tsx`
- `ui/features/dashboard/react/DashboardOptionsMenu.jsx`
- `ui/shared/settings-query/react/settingsQuery.ts`
- `app/controllers/users_controller.rb`
- `config/routes.rb`
- `app/stylesheets/bundles/dashboard_card.scss`
- `ui/shared/dashboard-card/react/__tests__/DashboardCardBox.test.jsx`

### Open Questions (Need Spike or Stakeholder Input)
1. Should appearance preset values live in the existing boolean settings endpoint, or should this feature use a dedicated endpoint/value store for enumerated settings?
2. Which exact preset list is acceptable from product/accessibility review, and what is the allowed visual delta per preset?
3. Should preset selection be available only in Card View, or configurable globally even when the user is currently in Planner/Activity views?
4. Should observers/masquerading contexts inherit observer preference only, or require any special handling?
5. Should failure to persist preference show user-facing feedback, silent fallback, or both?

### Session Notes / Evidence of Lab 2 Workflow
- Used repository analysis workflow from `agents/analyze-repo.md` to prioritize indexed search and targeted file reads.
- Queried dashboard/card-related files and user preference endpoints before opening raw files.
- Focused on representative implementation surfaces rather than broad repository scanning.
- Captured specific integration paths for UI, API/controller, and tests listed above.

### How to Use the `analyze-repo` Agent for This Feature
1. Open `agents/analyze-repo.md` and follow its index-first workflow.
2. Check for index artifacts (`repo_index.json`, `symbol_map.json`, `file_summaries/`) and regenerate them if missing or stale.
3. Start with targeted index/symbol queries for dashboard cards, user preferences, settings APIs, and dashboard styles.
4. Read summaries first; only open raw files that confirm candidate integration points.
5. Capture representative paths in three buckets: UI rendering, API/settings persistence, and tests.
6. Record unresolved architecture or product decisions as explicit open questions for later spike/stakeholder input.

## 5. Testing and Verification Plan

### Unit-Level Expectations
- Preset value validator accepts only supported preset keys.
- Preset-to-class/style mapping function returns deterministic output for each supported preset.
- Invalid/missing preset mapping returns default `classic`.
- Any selector/helper that merges server preference + default behaves deterministically.

### Integration-Level Expectations
- API read path returns persisted preset for the authenticated user.
- API update path persists valid preset values and rejects invalid values.
- Dashboard initial load applies persisted preset to card container/card nodes.
- Existing dashboard card features (reorder, unfavorite, publish actions, color overlay behavior) continue to function after preset application.

### Manual / Exploratory Checks
- Change preset and verify immediate UI update.
- Reload dashboard and verify persistence.
- Sign out/sign in and verify persistence.
- Verify one user's preset does not affect a second user account.
- Switch dashboard view modes and confirm no unexpected regression.
- Validate long course names and course images remain readable across presets.
- Keyboard-only navigation and screen reader checks for preset selector discoverability and state announcement.

### Acceptance Criteria Mapped to Functional Requirements
- AC-1 (FR-1, FR-2): Preset selector appears in card view and only offers supported options.
- AC-2 (FR-3): Selecting a preset updates rendered cards immediately.
- AC-3 (FR-4, FR-5): Selection persists and is applied on refresh/new session.
- AC-4 (FR-6, FR-7): Missing/invalid preference safely falls back to `classic`.
- AC-5 (FR-8): Preference is user-isolated across accounts.
- AC-6 (FR-9): Card content/order/favorite state remain unchanged by preset selection.
- AC-7 (FR-10): Selector interaction is keyboard and assistive-technology accessible.

### Success vs Failure Signals
- **Success**
  - Preset selection is stable, persisted, and user-scoped.
  - Dashboard remains performant and usable.
  - Existing dashboard card behaviors are unaffected.
  - Accessibility checks pass for selector and card readability.
- **Failure**
  - Preset resets unexpectedly or fails to persist.
  - Invalid preference causes rendering errors.
  - Preset updates break card interactions or layout.
  - Accessibility regressions (unlabeled control, poor contrast, keyboard traps).

### If Automation Is Impractical
- For cross-browser visual nuance and subjective style readability, use a manual checklist with screenshots and role-based walkthroughs.
- If rollout risk remains, gate implementation behind a feature flag and perform staged validation before broad enablement.
