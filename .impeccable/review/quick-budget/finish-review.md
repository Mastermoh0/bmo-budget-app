# Quick Budget finish review

Disposition: **ship**.

Reviewed `components/quick-budget.tsx`, `lib/quick-budget.ts`, the related SaveForm/TaskDialog behavior and application branch in `lib/money.ts`, against DESIGN.md and the craft floor. Visually inspected desktop-top.png, desktop.png, mobile.png and dark.png. The reported 47 passing integration tests, build and lint were supplied evidence; this review did not rerun them.

## Findings

No remaining blocking defects found in the reviewed scope. The deletion regression below was found during subsequent browser testing and fixed before this final disposition.

- All five presets are selectable in named groups. Custom portions support names, integer percentages, additions/removals and explicit existing-category mapping. Category reuse is prevented in the editor and rejected by validation. Saved templates expose update, duplicate and delete controls separately from applying money.
- Preview is required to reveal Apply. Amount, preset and portion edits invalidate the preview. It shows exact per-category current/add/after figures and the remaining ready-to-assign amount. Integer-cent allocation conserves the total; the server checks the revision and available money inside the operation transaction before incrementing assignments.
- The visual extension retains Canvas/Night Desk typography, semantic color roles, native focused task-window geometry and ordinary controls. Desktop preview columns remain readable. The supplied narrow top capture fits its viewport with stacked fields and legible input text. Dark appearance retains the established warm text and charcoal surfaces. No clipping or overlapping controls appear in these captures.
- Empty category guidance, inactive-category recovery, percentage/mapping errors, busy locking and uncertain-save recovery are present. Template deletion explicitly explains that existing assignments remain.

## Confirmed regression and fix

Subsequent browser testing by the implementing agent found that deleting the selected saved template removed its conditional SaveForm during the refresh before its completion effect ran. The dialog could consequently remain in the saving phase. The reviewed fix adds `saved={() => dialog?.complete()}` to Delete saved split. SaveForm invokes this callback only after a confirmed successful response, before refreshing, so deletion closes and resets the task window without depending on the removed form surviving the refresh. Failure and uncertain-response paths retain their existing retry behavior. This source inspection supports the fix; the browser reproduction was supplied by the implementing agent.

## Nonblocking usability observation

The mobile form is long: the supplied 390px-wide capture reaches only the first portion's percentage field before the viewport ends. Repeated category lists will increase scrolling as the real category count grows. This follows the existing internally scrolling task-window pattern and does not prevent completion; do not redesign the established layout as part of this narrow change. If larger real budgets expose friction later, evaluate a category picker within that separate scope.

## Evidence limits

The supplied mobile capture shows the editor top rather than the preview or saved-template controls. Responsive preview scrolling is present in the markup (`table-scroll`), but its narrow appearance was not independently exercised in this review. Keyboard interaction and live pending/error behavior were inspected in source, not through a browser session. Existing canvas.css font-size detector advisories are outside this change.

