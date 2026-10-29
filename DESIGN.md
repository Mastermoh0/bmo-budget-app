---
name: Bimo Canvas and Night Desk
description: An open workspace for giving available money a purpose.
colors:
  light-ground: "#eaf0f6"
  light-surface: "#fff"
  light-raised: "#f4f7fb"
  light-text: "#233b55"
  light-muted: "#506782"
  light-line: "#dbe4ef"
  light-control: "#7389a3"
  light-active: "#e6edf6"
  light-accent: "#285fb5"
  light-accent-soft: "#e9f0fc"
  light-positive: "#246447"
  light-positive-soft: "#edf7f1"
  light-negative: "#a52e3a"
  light-negative-soft: "#fceef0"
  light-primary: "#233b55"
  light-on-primary: "#fff"
  dark-ground: "#141414"
  dark-surface: "#1b1b1b"
  dark-raised: "#242424"
  dark-text: "#f1f0eb"
  dark-muted: "#b3b2ac"
  dark-line: "#353532"
  dark-control: "#787870"
  dark-active: "#30302d"
  dark-accent: "#d3ad68"
  dark-accent-soft: "#343024"
  dark-positive: "#bfceb7"
  dark-positive-soft: "#243329"
  dark-negative: "#f29b9b"
  dark-negative-soft: "#382527"
  dark-primary: "#eeeae0"
  dark-on-primary: "#1b1b1b"
  task-backdrop: "#10182066"
typography:
  headline:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 750
    lineHeight: 1.35
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "17px"
    fontWeight: 750
    lineHeight: 1.35
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "13px"
    fontWeight: 650
  financial-summary:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "28px"
    fontWeight: 650
    lineHeight: 1.4
    letterSpacing: "-0.03em"
  supporting:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "12px"
    lineHeight: 1.65
  task-heading:
    fontFamily: "Manrope, system-ui, sans-serif"
    fontSize: "22px"
    fontWeight: 750
    lineHeight: 1.35
    letterSpacing: "-0.02em"
rounded:
  progress: "4px"
  tab: "5px"
  control: "6px"
  task-window: "12px"
  workspace: "14px"
  workspace-narrow: "10px"
spacing:
  inline: "12px"
  stack: "16px"
  section: "24px"
  workspace: "32px"
components:
  button-primary-light:
    backgroundColor: "{colors.light-primary}"
    textColor: "{colors.light-on-primary}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  button-primary-dark:
    backgroundColor: "{colors.dark-primary}"
    textColor: "{colors.dark-on-primary}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  button-secondary-light:
    backgroundColor: "{colors.light-surface}"
    textColor: "{colors.light-text}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  button-secondary-dark:
    backgroundColor: "{colors.dark-surface}"
    textColor: "{colors.dark-text}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
  input-light:
    backgroundColor: "{colors.light-surface}"
    textColor: "{colors.light-text}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
  input-dark:
    backgroundColor: "{colors.dark-surface}"
    textColor: "{colors.dark-text}"
    rounded: "{rounded.control}"
    padding: "10px 12px"
  status-light:
    backgroundColor: "{colors.light-raised}"
    textColor: "{colors.light-muted}"
    rounded: "{rounded.tab}"
    padding: "3px 8px"
  task-window-light:
    backgroundColor: "{colors.light-surface}"
    textColor: "{colors.light-text}"
    rounded: "{rounded.task-window}"
    padding: "28px"
    width: "min(640px, calc(100vw - 32px))"
  task-window-dark:
    backgroundColor: "{colors.dark-surface}"
    textColor: "{colors.dark-text}"
    rounded: "{rounded.task-window}"
    padding: "28px"
    width: "min(640px, calc(100vw - 32px))"
  task-window-narrow:
    rounded: "{rounded.task-window}"
    padding: "22px 18px"
    width: "calc(100vw - 20px)"
---

# Design System: Bimo Canvas and Night Desk

## Overview

**Creative North Star: "Canvas / Night Desk"**

An open workspace gives available money a purpose. Canvas surrounds a white inset surface with a cool blue frame; Night Desk brings the same geometry into charcoal, warm text and amber. Manrope, fine dividers and spacious purpose groups make a working budget feel ordered and approachable.

The interface is built from the accepted Canvas prototype, with runtime records supplying every financial figure. Colour changes carry through navigation, forms, reports and security settings without changing the user's place or financial work. The authored Bimo mark and self-hosted typeface supply the identity; external imagery is not part of this implementation.

**Key Characteristics:**

- A framed workspace with top navigation and a quiet footer.
- Open, divided sections and grouped purposes with expandable financial details.
- Exact NGN figures, tabular numerals and visible status language.
- Shared geometry across light and dark appearances.
- Immediate pending feedback, structural loading placeholders and recoverable errors.

This document records `app/canvas.css`, root layout and the implemented components as of 29 October 2026. The frontmatter is the token inventory; `.impeccable/design.json` extends it with motion, breakpoints and renderable examples. Reference captures are in `.impeccable/review/`; their fixture amounts are evidence of layout, not product defaults.

## Colors

Canvas uses cool paper, blue ink and restrained blue accents; Night Desk uses charcoal neutrals, warm paper text and amber accents. Each frontmatter prefix identifies its appearance. CSS exposes these roles without the prefix on the root element and switches them together with `data-appearance="dark"`.

### Primary

- **Blue Ink / Warm Paper** (`primary`, `on-primary`): the brand mark and filled primary actions. The contrasting foreground follows the appearance.
- **Canvas Blue / Desk Amber** (`accent`, `accent-soft`): ready-to-assign figures, category progress, links on hover, focus outlines, selected switch tracks, caret and text selection.

### Secondary

- **Positive Ink / Sage** (`positive`, `positive-soft`): success text with a tonal background and matching border.
- **Shortfall Red / Soft Coral** (`negative`, `negative-soft`): overspending, errors and the danger variant. Error text is paired with explicit language and a tinted bordered surface.

### Neutral

- **Blue Frame / Outer Charcoal** (`ground`): the page surround.
- **White Canvas / Desk Surface** (`surface`): the inset workspace and ordinary fields.
- **Cool Wash / Raised Charcoal** (`raised`): notices, status tags, read-only fields, corrections and hover surfaces.
- **Blue Ink / Warm Text** (`text`) and **Slate / Warm Grey** (`muted`): primary reading and supporting text.
- **Fine Divider / Desk Divider** (`line`): section and table rules.
- **Slate Control / Grey Control** (`control`): field and secondary-control boundaries, link underlines and scrollbar thumb. Use the current light control token; the earlier lighter prototype boundary is superseded.
- **Selected Wash / Selected Charcoal** (`active`): selected navigation, progress tracks and skeleton blocks.

**The Shared Geometry Rule.** Change appearance through the role tokens; keep layout, information order and form state intact.

## Typography

**Display and body font:** Manrope with system-ui and sans-serif fallbacks. The variable face is self-hosted at `public/fonts/Manrope.ttf`, with its OFL license alongside it. The declared range is 200–800 and font display is swap. No separate display or monospace family is implemented.

Manrope's compact headings and clear numerals keep long-lived money tasks readable. The root uses the body role. Headings balance their text; paragraphs have a maximum width of 76ch.

- **Headline:** the frontmatter headline role for page titles; authentication titles use 29px, and narrow page titles use 25px.
- **Title:** the title role for section headings; purpose-group titles use 16px and ordinary third-level headings use 14px, both at weight 750.
- **Body and label:** the frontmatter roles, with form labels separated from controls by 7px.
- **Financial summary:** the frontmatter financial-summary role; purpose-category figures use 24px with weight 650, line-height 1.4 and tracking −0.02em. Summary figures reduce to 24px at the intermediate breakpoint and 23px at the narrow breakpoint; narrow category figures use 25px.
- **Supporting:** the supporting role plus 11px captions, metric labels/help and navigation details where defined by the component.

**The Exact Figures Rule.** Use formatted runtime NGN values with two decimal places and tabular numerals in financial figures, tables and breakdowns. Placeholder blocks carry no sample balances.

## Layout

The desktop header is centred within 1440px, with a minimum height of 94px and padding of 20px 5%. The main workspace has a maximum width of 1300px, padding of 32px and a minimum height of `calc(100vh - 175px)`. The footer aligns to the workspace. Common inline rows use a 12px gap; stacked forms use 16px; headings separate from content by 24px.

The budget surface presents context and route navigation, a heading with month/action controls, then three figures in a `1.15fr 1fr 1fr` row. Vertical dividers distinguish figures. Purpose groups use `2fr 1fr` columns with gaps of 28px vertically and 36px horizontally. The first group spans two rows and contains two category columns; a final odd category spans both. Other groups retain one category column. Expanded details stay within their category.

Common form grids have two equal columns separated by 24px; the broader two-column layout uses 40px. The budget directory uses two columns with a 36px gap. Account security uses `1.15fr 1fr` columns with a 44px gap; its sign-in methods section occupies the upper right across two rows at full width. Authentication is a centred column capped at 440px. Tables scroll horizontally within their container.

- **At 1360px and below:** workspace margins become 24px, header side padding 36px and footer side margins 28px.
- **At 900px and below:** workspace padding becomes 26px; purpose columns become equal and the first group returns to one category column; the heading wraps. Settings gaps reduce to 28px and its right-hand section stops spanning rows.
- **At 650px and below:** the header wraps its navigation onto a full-width row; the local-preview label disappears. Workspace margins become 10px and padding 22px 18px. Forms, purpose groups, directory, settings and skeleton columns become single columns. Summary figures become three stacked label/value rows. Month controls and budget actions wrap; the footer wraps too.

These are the implemented narrow fallbacks. A separately designed mobile composition and the tutorial remain future work.

Task windows use the frontmatter task-window width and padding, scroll internally, and cap their height at `calc(100dvh - 40px)`. At the existing 650px narrow breakpoint, they use the task-window-narrow geometry, cap their height at `calc(100dvh - 24px)`, collapse form grids to one column, wrap the footer and use 16px input, select and textarea text. Both appearances share this geometry.

## Elevation & Depth

Depth comes from the outer ground, inset surface, tonal washes and fine rules. Panels are open sections with a top divider and generous vertical padding. There is no resting card shadow in the current system.

### Shadow Vocabulary

- **Pressed action:** `inset 0 2px 4px #0003`, paired with a 1px downward translation while a button or button link is active. Disabled controls remove both effects.
- **Task window:** `0 18px 64px #0003`, reserved for the native modal surface above the shared task-backdrop colour. The shadow and backdrop treatment are also recorded in the sidecar; ordinary sections retain their existing depth treatment.

**The Open Surface Rule.** Preserve the existing open sections and divider-based purpose groups when extending these screens; do not turn them into a stack of elevated cards.

## Shapes

The workspace uses a gently rounded 14px corner, reduced to 10px on narrow screens. Buttons, fields, notices and correction containers use the 6px control radius. Task windows use the frontmatter task-window radius and a 1px control-colour boundary. Status tags and navigation tabs use 5px; category tracks and skeleton blocks use 4px. Field borders are 1px, distinct from the quieter section dividers. The provisional authored mark is an inline rounded-square SVG with its Bimo letterform; reuse that asset from the root layout.

## Components

### Buttons

Compact, clear actions use 13px Manrope at weight 750, padding 10px 16px and a minimum height of 40px. Primary actions use the primary/on-primary pair; hover changes the background and border to accent. Secondary actions use the surface, text and control boundary, then raised background and text boundary on hover. The danger variant uses negative colour with surface-colour text. Reorder and target-removal buttons inherit the secondary treatment.

All focusable controls receive the 3px accent outline with a 4px offset. Button transitions are 160ms ease-out for background/shadow and 100ms ease-out for transform. Disabled buttons use 0.6 opacity and a blocked cursor; busy buttons use 0.85 opacity and a progress cursor. `ActionButton` replaces its label with the action-specific pending phrase, adds a decorative 14px spinner and disables repeated submission.

### Status tags and notices

Status tags are compact raised/muted labels at 11px and weight 650, with 3px 8px padding. They communicate roles or archive state rather than acting as filters. Notices use raised surfaces, 14px 16px padding and a 1px line border. Errors and successes exchange this for their semantic pair and matching boundary. Error messages use `role="alert"`; save confirmation uses a status announcement.

### Containers and fields

Panels use 26px vertical padding, a 12px top margin and a fine top border; they have no filled-card treatment. Form controls are full-width with 10px 12px padding, a 42px minimum height and a control-colour border. Placeholders use the muted text role at full opacity. Read-only inputs use raised surfaces; textareas resize vertically. Labels remain visible above fields. Correction containers use a raised surface, 22px padding and a line border.

### Navigation

The header presents the brand, Budgets, Account security and the appearance switch. Budget routes use compact links above a divider: the current page has the active fill and weight 800; hover uses raised fill. `NavLink` reserves a small accent dot and pulses it while navigation is pending. The month form keeps its fields present and changes its action to “Updating…” while the route transition runs. The skip link becomes visible on keyboard focus and targets the main workspace.

### Appearance switch

The labelled “Dark mode” control is a button with switch semantics and an exposed checked state. It includes an inline moon SVG and a 24px by 14px track with an 8px thumb. The thumb moves 10px over 180ms using `cubic-bezier(.16,1,.3,1)`. Saved appearance boots in the document head before paint. Blocked local storage falls back safely, and switching still works on the current page. Theme changes update the root data attribute without navigation, retaining inputs and month selection.

### Purpose category

The signature component is a native details/summary row within a named purpose group. Its closed state shows the category name, available figure, a thin spending track and net-spending/target caption. The chevron rotates on expansion. Its open state exposes carried-in money, monthly assignment, net activity, available money, notes and any savings-target link. Negative availability has both the negative colour and “overspent” text. Archived records remain labelled. The detailed worksheet remains available in a separate disclosure.

### Task windows

Contextual triggers open focused tasks over the current workspace using native `dialog.showModal()`. The implemented scope is Assign money, Move money, Add transaction, transaction correction/void, add/manage account/category/group, and add/edit savings target. Reordering, target removal and shared notes keep their existing controls.

The window uses the current surface, text and control roles with the task-window tokens above. Its heading uses the task-heading role, with a 4px top margin. The heading row has a 20px gap and 24px bottom margin. Close is a 36px square secondary button with 8px padding and an 18px inline cross. The footer has a line-colour top divider, 24px top margin, 18px top padding and a 16px gap. Existing labelled fields, primary save actions and notices retain their styles; correction content loses its enclosing wash and border within the window.

Opening focuses the title. Native modality contains keyboard focus and makes the background inert; closing returns focus to the opener. Cancel, Close, Escape and a pointer click outside dismiss the window, with an inside-to-outside drag excluded. Ordinary dismissal remounts the form so unsent edits reset. Saving disables dismissal and duplicate submission, retains the form during refresh, and closes only after confirmed success and the refresh completes.

An unconfirmed save keeps its original request identifier, body and form state when dismissed and reopened while the same page remains mounted. A visible reminder beside the trigger directs the user to reopen for a safe retry; in-window guidance explains that retry sends the original details even after field edits. This retention is not durable across navigation or reload. Authored validation and permission failures keep friendly guidance in the window and allow revised fields on the next attempt.

The task-window specimen in the sidecar is a static visual sample. Native focus containment, dismissal, reset and request recovery belong to the application runtime, not the specimen.

### Loading and action feedback

Real Next route `loading.tsx` boundaries render `PageSkeleton` variants for budgets, budget subroutes, household, settings and authentication. Placeholder shapes mirror headings, tabs, metrics or form sections as appropriate. A single status container has `aria-busy="true"` and a spoken loading description; all decorative blocks are hidden from assistive technology. The 1.5s pulse animates opacity between 1 and 0.5. No artificial wait or sample money is used.

Save forms retain their fields during a request and refresh. An unconfirmed network/server request retains its original body and request identifier for a safe retry, with explicit guidance that edits will not change those original retry details. Ordinary authored validation or permission failures let the next attempt use revised fields. Raw infrastructure details are filtered out of user-facing errors. Authentication and security actions expose their own pending labels and friendly failures. A stale security session leads to a friendly sign-in notice and returns to Settings after reauthentication.

The reduced-motion preference removes animations and transitions, including spinner rotation, skeleton pulse and switch motion. Busy labels, disabled states and status announcements remain available.

## Do's and Don'ts

### Do:

- **Do** use the existing semantic colour roles for both appearances and preserve shared geometry.
- **Do** show exact runtime balances and distinguish overspending with words as well as colour.
- **Do** retain work during asynchronous actions and explain what a retry will send.
- **Do** pair decorative loading with one accessible status and honour reduced motion.
- **Do** reuse the self-hosted Manrope face and authored inline Bimo mark.

### Don't:

- **Don't** copy fixture amounts from a prototype or review screenshot into product defaults.
- **Don't** replace open purpose groups with elevated card stacks on these screens.
- **Don't** remove visible field labels, keyboard focus or textual error guidance.
- **Don't** imply an unavailable provider, mailbox connection or account-deletion feature is ready.
- **Don't** describe the narrow fallback as the separately planned mobile composition.
