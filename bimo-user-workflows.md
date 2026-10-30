# Bimo task flowcharts

Checked against the current local application's screens and button names on 30 October 2026. Except for creating a budget, start signed in with the relevant budget open. Financial changes and note changes require owner/editor access. Only the owner can invite members.

## Create a budget

```mermaid
flowchart TD
    home(["Open Your budgets"])
    first{"Your first budget?"}
    setup["Learn Bimo: choose Set up my own budget"]
    another["Click Create another budget"]
    name["Enter a budget name"]
    create["Click Create private budget"]
    open["Click Open budget"]
    accounts["Accounts: Add account, enter current balance, then Create account"]
    categories["Budget: Organize categories and groups, then Add category"]
    done(["Your budget is ready to plan"])
    home --> first
    first -->|"Yes"| setup
    first -->|"No"| another
    setup --> name
    another --> name
    name --> create --> open --> accounts --> categories --> done
```

Current budgets use Nigerian naira and Africa/Lagos. Enter only money you already have as an opening balance; new budgets start without demo money.

## Save toward a goal

```mermaid
flowchart TD
    start(["Choose what you are saving for"])
    exists{"Savings category exists?"}
    add["Budget: Organize categories and groups, then Add category"]
    targets["Targets: find the category and click Add target"]
    goal["Choose monthly saving or saving by a date"]
    details["Enter amount, start month and deadline if needed"]
    save["Click Set target"]
    assign["Budget: click Assign money"]
    fund["Choose the savings category and an amount from Ready to assign"]
    confirm["Click Assign money in the window"]
    done(["Money is earmarked; review progress in Targets"])
    start --> exists
    exists -->|"No"| add --> targets
    exists -->|"Yes"| targets
    targets --> goal --> details --> save --> assign --> fund --> confirm --> done
```

A target describes the goal. Assigning money funds its category. Neither step transfers money at a bank. Monthly targets measure this month's contributions; save-by-date targets measure current category availability. To move money between real accounts, make that transfer separately and record it using the transfer flow below. If a target already exists, use Edit target instead of Add target.

## Invite someone to a budget

```mermaid
flowchart TD
    start(["Open the budget to share"])
    owner{"Are you its owner?"}
    ask(["Ask the owner to send the invitation"])
    household["Open Household"]
    email["Under Invite someone, enter their email"]
    role["Choose Editor or Viewer"]
    send["Click Send invitation"]
    link["Recipient opens the invitation link"]
    login["Sign in or create an account with the invited email"]
    verify["Verify that email if needed; return to the invitation page"]
    review["Click Review invitation, then Accept invitation"]
    done(["Both people can access this shared budget"])
    start --> owner
    owner -->|"No"| ask
    owner -->|"Yes"| household --> email --> role --> send --> link --> login --> verify --> review --> done
```

Editors can change money and shared notes. Viewers can read and export. Only the owner manages access; other budgets remain private. Invitations expire after seven days. In the current preview, invitation emails go to the local Mailpit inbox; real inbox delivery is not configured.

## Record spending

```mermaid
flowchart TD
    start(["You have paid for something"])
    add["Click Add transaction"]
    type["Choose Expense"]
    fields["Enter date, paying account, category and amount"]
    optional["Optionally enter payee and note"]
    save["Click Save transaction"]
    done(["Account balance and category availability update"])
    start --> add --> type --> fields --> optional --> save --> done
```

Record the payment once. An expense records spending that has happened; it does not send a payment.

## Record a transfer between your accounts

```mermaid
flowchart TD
    start(["Money has moved between two of your accounts"])
    ready{"Both accounts already in this budget?"}
    addAccounts["Accounts: add any missing account with its correct opening balance"]
    add["Click Add transaction"]
    type["Choose Between my accounts"]
    fields["Choose From account, To account, date and amount"]
    save["Click Save transaction"]
    done(["One balance falls and the other rises; combined money is unchanged"])
    start --> ready
    ready -->|"No"| addAccounts --> add
    ready -->|"Yes"| add
    add --> type --> fields --> save --> done
```

Both accounts must be open and belong to the same budget. Use balances from before the recorded transfer, so it is not counted twice. Record a transfer fee separately as an expense. A payment to another person is an expense, rather than a transfer between your own accounts.

## Add, edit or delete a note

```mermaid
flowchart TD
    start(["Click Notes"])
    choose["Expand a category or group in the side panel"]
    exists{"A note already exists?"}
    add["Click Add note"]
    action{"What do you want to do?"}
    edit["Click Edit note"]
    write["Write or change the text"]
    finish{"Keep these changes?"}
    save["Click Save note"]
    cancel["Click Cancel edit"]
    delete["Click Delete note"]
    saved(["Saved text appears; the panel stays open"])
    unchanged(["Saved note stays unchanged"])
    empty(["Note text is removed; category or group stays"])
    start --> choose --> exists
    exists -->|"No"| add --> write
    exists -->|"Yes"| action
    action -->|"Edit"| edit --> write
    action -->|"Delete"| delete --> empty
    write --> finish
    finish -->|"Yes"| save --> saved
    finish -->|"No"| cancel --> unchanged
```

Owners/editors can add, edit and delete shared notes; viewers can read them. Deletion clears the current note and keeps audit history. Close the panel with its close button, Cancel, Escape or an outside click when no save is running.

## If a save is interrupted

The app shows a friendly message. While a request is running, wait for confirmation. If confirmation is uncertain, retry the same change; Bimo retains its original request/details while that page stays mounted. Do not assume a network error means the change was not saved. Reload/navigation does not preserve that client retry state.

## Source basis

These diagrams describe the implemented local workflows, checked against `app/page.tsx`, `app/setup/page.tsx`, `components/budget-setup.tsx`, `components/money-workspace.tsx`, `components/category-groups.tsx`, `components/savings-targets.tsx`, `components/household.tsx`, `components/invitation-review.tsx` and `components/budget-notes.tsx`. This documentation task did not change application code or execute financial operations.
