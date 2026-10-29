# Canvas application implementation

Mode: Operate. Code-led implementation of the user's already-selected HTML direction; no new identity/concept round or image comp is required. The reference screenshots are prototype evidence, not a pixel-perfect application comp: real features/data replace invented sample content.

THESIS: Plan existing money by purpose on an open Canvas workspace, with controls available where they are needed.
OWN-WORLD: Cool blue frame, white inset surface, Manrope and blue marks; Night Desk changes only colour roles to charcoal, warm text and amber. Fine dividers and spacious groups replace stacks of financial cards.
STORY: Choose a budget/month, inspect purpose groups, assign money, record transactions and verify reports; household access is explicit.
FIRST VIEWPORT: Top navigation, an inset workspace, budget/month/action row, three aligned financial figures, then purpose groups. The main action is Add transaction; it and Assign money open focused native task windows over the current workspace.
FORM: User-pinned Canvas (historical prototype seed e365e4bf; the user chose Canvas rather than the seed's first candidate). Signature: expand a category in its purpose group to inspect exact carry/assignment/activity without losing context.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

Loading matches each route's structure, announces one status, hides decorative placeholders from assistive technology, supports reduced motion, and never displays invented money or artificial delays. Theme switching preserves URL, input state, selected month and financial records. Essential submission pending states retain the form and the existing safe-retry contract.

Task-window refinement: contextual windows cover assignment, category moves, transactions and correction/void, account/category/group creation and management, and target creation/editing. The modal surface inherits the selected appearance and shared geometry: a 640px cap, viewport-aware height, a 12px radius, a 22px heading, a soft offset shadow and a subdued backdrop. Narrow fallbacks retain reachable fields and footer actions without completing the separate mobile milestone.

Opening with native showModal moves focus to the heading, contains keyboard focus and makes the background inert. Cancel, Close, Escape and outside clicks dismiss except while saving; ordinary dismissal resets unsent values. An unconfirmed save retains its original request body and identifier across close/reopen on the same mounted page, with visible retry guidance. This retention does not survive navigation or reload. Confirmed saves refresh before closing. Reordering and target removal remain in their existing controls.

Notes is a right-hand companion panel opened by the Notes button across all six money workspace views. It reuses native modality and the approved theme roles, with a 480px cap, 12px viewport inset, 24px padding and internally scrolling content between the heading and footer. Saved notes refresh without closing the panel or resetting other drafts. An uncertain note blocks other saves until its original request is confirmed. Viewer access remains read-only. Cancel, Close, Escape and outside click dismiss when idle; this panel does not introduce personal/freeform notes or a new storage model.

The task-window finish review is SHIP: C:/Users/MasterMoh/.codex/visualizations/2026/10/25/01a173e9-b493-7902-9acb-c6ccae4374e8/task-windows-2026-10-29/finish-review.md. Its supplied desktop light/dark and narrow viewport evidence supports this additive refinement; it does not select a new visual world or broaden browser/device coverage.
