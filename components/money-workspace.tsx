'use client'
import Link from 'next/link'
import { useRef, useState, useTransition, type FormEvent, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useHydrated } from '@/lib/use-hydrated'
import type { MoneySnapshot } from '@/lib/money'

export type MoneyView = 'budget' | 'accounts' | 'transactions' | 'reports' | 'activity'
type Transaction = MoneySnapshot['transactions'][number]
type Fields = Record<string, FormDataEntryValue>

function money(value: string) {
  const [whole, fraction = '00'] = value.split('.')
  return `${whole.startsWith('-') ? '−' : ''}₦${whole.replace('-', '').replace(/\B(?=(\d{3})+(?!\d))/g, ',')}.${fraction}`
}

function SaveForm({ budgetId, children, build, label, saved }: { budgetId: string; children?: ReactNode; build: (fields: Fields) => object; label: string; saved?: () => void }) {
  const ready = useHydrated(), router = useRouter()
  const [refreshing, startTransition] = useTransition()
  const pending = useRef<{ requestId: string; body: object } | null>(null)
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [success, setSuccess] = useState('')
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    if (!pending.current) pending.current = { requestId: crypto.randomUUID(), body: build(Object.fromEntries(new FormData(event.currentTarget))) }
    setBusy(true); setError(''); setSuccess('')
    try {
      const response = await fetch(`/api/budgets/${budgetId}/money`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...pending.current.body, requestId: pending.current.requestId }) })
      const result = await response.json()
      if (!response.ok) { setError(result.error || 'The change could not be saved.'); if (response.status < 500) pending.current = null; return }
      pending.current = null; setSuccess('Saved.')
      startTransition(() => { saved?.(); router.refresh() })
    } catch { setError('Save not confirmed. Retry to send the same change safely, even if you have edited the fields.') } finally { setBusy(false) }
  }
  return <form method="post" onSubmit={submit}><fieldset disabled={!ready || busy || refreshing}>{children}<button disabled={!ready || busy || refreshing}>{busy || refreshing ? 'Saving…' : label}</button></fieldset>{error && <p role="alert" className="error">{error}</p>}{success && <p role="status" className="success">{success}</p>}</form>
}

function Amount({ label = 'Amount (NGN)', value = '', signed = false }: { label?: string; value?: string; signed?: boolean }) {
  return <label>{label}<input name="amount" inputMode="decimal" defaultValue={value} required pattern={signed ? '-?(0|[1-9][0-9]*)(\.[0-9]{1,2})?' : '(0|[1-9][0-9]*)(\.[0-9]{1,2})?'} placeholder="0.00" maxLength={22} /></label>
}
function CategorySelect({ data, name = 'categoryId', label = 'Category', current }: { data: MoneySnapshot; name?: string; label?: string; current?: string | null }) {
  return <label>{label}<select name={name} defaultValue={current ?? ''} required><option value="">Choose a category</option>{data.categories.filter(row => !row.archived || row.id === current).map(row => <option key={row.id} value={row.id}>{row.name}{row.archived ? ' (archived)' : ''}</option>)}</select></label>
}
function AccountSelect({ data, name = 'accountId', label = 'Account', current }: { data: MoneySnapshot; name?: string; label?: string; current?: string | null }) {
  return <label>{label}<select name={name} defaultValue={current ?? ''} required><option value="">Choose an account</option>{data.accounts.filter(row => !row.closed || row.id === current).map(row => <option key={row.id} value={row.id}>{row.name}{row.closed ? ' (closed)' : ''}</option>)}</select></label>
}

function TransactionForm({ data, transaction, saved }: { data: MoneySnapshot; transaction?: Transaction; saved?: () => void }) {
  const [kind, setKind] = useState(transaction?.kind ?? 'EXPENSE')
  return <SaveForm budgetId={data.budget.id} label={transaction ? 'Save correction' : 'Save transaction'} saved={saved} build={fields => ({ ...fields, action: transaction ? 'edit' : 'post', ...(transaction ? { id: transaction.id, version: transaction.version } : {}), kind })}>
    <div className="form-grid"><label>Transaction type<select name="kind" value={kind} onChange={event => setKind(event.target.value as Transaction['kind'])} disabled={!!transaction}>{transaction?.kind === 'OPENING' && <option value="OPENING">Opening balance</option>}<option value="EXPENSE">Expense</option><option value="INCOME">Income</option><option value="TRANSFER">Between my accounts</option><option value="REFUND">Refund to category</option></select></label>
      <label>Transaction date<input type="date" name="date" defaultValue={transaction?.date ?? data.today} min="1900-01-01" max={data.today} required /></label>
      <AccountSelect data={data} current={transaction?.accountId} label={kind === 'TRANSFER' ? 'From account' : 'Account'} />
      {kind === 'TRANSFER' && <AccountSelect data={data} name="toAccountId" label="To account" current={transaction?.toAccountId} />}
      {(kind === 'EXPENSE' || kind === 'REFUND') && <CategorySelect data={data} current={transaction?.categoryId} />}
      <Amount value={transaction?.amount} />
      <label>Note (optional)<input name="memo" defaultValue={transaction?.memo ?? ''} maxLength={240} /></label>
    </div>
    {kind === 'TRANSFER' && <p className="muted small">Both accounts must belong to this budget. Record fees separately. A payment to another person is an expense.</p>}
    {kind === 'REFUND' && <p className="muted small">Choose the original spending category. A refund restores its available money.</p>}
  </SaveForm>
}

export function MoneyWorkspace({ data, view }: { data: MoneySnapshot; view: MoneyView }) {
  const [editing, setEditing] = useState<string | null>(null)
  const base = `/budgets/${data.budget.id}`, canWrite = data.budget.role !== 'VIEWER'
  const accounts = new Map(data.accounts.map(row => [row.id, row.name])), categories = new Map(data.categories.map(row => [row.id, row.name]))
  const link = (target: MoneyView, page = 1) => `${base}${target === 'budget' ? '' : `/${target}`}?month=${data.month}${page > 1 ? `&page=${page}` : ''}`
  return <><div className="row spread"><div><span className="status">{data.budget.role}</span><h1>{data.budget.name}</h1><p className="muted">Nigerian naira · Africa/Lagos</p></div><form method="get" className="month-picker"><label>Budget month<input type="month" name="month" defaultValue={data.month} min="1900-01" max="2199-12" required /></label><button>View month</button></form></div>
    <nav className="budget-nav" aria-label="Budget navigation">{(['budget', 'accounts', 'transactions', 'reports', 'activity'] as MoneyView[]).map(item => <Link key={item} href={link(item)} aria-current={view === item ? 'page' : undefined}>{item[0].toUpperCase() + item.slice(1)}</Link>)}</nav>
    <div className="metrics"><section className="panel"><h2>Account total</h2><strong>{money(data.totalBalance)}</strong><p className="small muted">Through the end of {data.month}</p></section><section className="panel"><h2>Ready to assign</h2><strong className={data.readyToAssign.startsWith('-') ? 'negative' : ''}>{money(data.readyToAssign)}</strong><p className="small muted">After future allocations and earlier overspending</p></section><section className="panel"><h2>Net spending</h2><strong>{money(data.report.netSpending)}</strong><p className="small muted">Expenses less refunds in {data.month}</p></section></div>
    {!canWrite && <p className="notice">You have view-only access. Financial changes are available to the owner and editors.</p>}
    {view === 'budget' && <>
      <section className="panel"><h2>Categories · {data.month}</h2><div className="table-scroll"><table><thead><tr><th>Category</th><th>Carried in</th><th>Assigned</th><th>Activity</th><th>Available</th></tr></thead><tbody>{data.categories.map(row => <tr key={row.id}><th>{row.name}{row.archived && <span className="status">Archived</span>}</th><td>{money(row.carry)}</td><td>{money(row.assigned)}</td><td>{money(row.activity)}</td><td className={row.available.startsWith('-') ? 'negative' : ''}>{money(row.available)}{row.available.startsWith('-') && <span className="small"> · Overspent</span>}</td></tr>)}</tbody></table></div>{!data.categories.length && <p>Add your first category, such as Groceries or Transport.</p>}<p className="muted small">Positive available money carries forward. An uncovered shortfall resets its category to zero next month and reduces ready-to-assign money once. Future allocations reserve {money(data.futureAssigned)}.</p></section>
      {canWrite && <><div className="two-columns"><section className="panel"><h2>Assign money</h2><SaveForm key={`assign-${data.budget.revision}`} budgetId={data.budget.id} label="Assign money" build={fields => ({ ...fields, action: 'assign', month: data.month, revision: data.budget.revision })}><CategorySelect data={data} /><Amount signed /><p className="small muted">A positive amount assigns money. A negative amount returns available money.</p></SaveForm></section><section className="panel"><h2>Move between categories</h2><SaveForm key={`move-${data.budget.revision}`} budgetId={data.budget.id} label="Move allocation" build={fields => ({ ...fields, action: 'move', month: data.month, revision: data.budget.revision })}><CategorySelect data={data} label="From category" /><CategorySelect data={data} name="toCategoryId" label="To category" /><Amount /></SaveForm></section></div>
        <section className="panel"><h2>Add a category</h2><SaveForm budgetId={data.budget.id} label="Add category" build={fields => ({ ...fields, action: 'category' })}><label>Category name<input name="name" required maxLength={80} placeholder="Groceries" /></label></SaveForm></section>
        <section className="panel"><h2>Manage categories</h2>{data.categories.map(row => <details key={`${row.id}-${row.version}`}><summary>{row.name} · {row.archived ? 'Archived' : 'Active'}</summary><SaveForm budgetId={data.budget.id} label="Save category" build={fields => ({ ...fields, action: 'category-state', id: row.id, version: row.version, inactive: fields.inactive === 'true' })}><label>Category name<input name="name" defaultValue={row.name} required maxLength={80} /></label><label>Status<select name="inactive" defaultValue={String(row.archived)}><option value="false">Active</option><option value="true">Archived</option></select></label><p className="small muted">Archiving keeps this category’s money and history visible.</p></SaveForm></details>)}</section></>}
    </>}
    {view === 'accounts' && <>
      <section className="panel"><h2>Your accounts</h2>{data.accounts.map(row => <article className="account-row" key={`${row.id}-${row.version}`}><div className="row spread"><h3>{row.name} <span className="status">{row.closed ? 'Closed' : row.kind.toLowerCase()}</span></h3><strong className={row.balance.startsWith('-') ? 'negative' : ''}>{money(row.balance)}</strong></div>{canWrite && <details><summary>Manage {row.name}</summary><SaveForm budgetId={data.budget.id} label="Save account" build={fields => ({ ...fields, action: 'account-state', id: row.id, version: row.version, inactive: fields.inactive === 'true' })}><label>Account name<input name="name" defaultValue={row.name} required maxLength={80} /></label><label>Status<select name="inactive" defaultValue={String(row.closed)}><option value="false">Open</option><option value="true">Closed</option></select></label><p className="small muted">An account’s actual balance must be zero to close it. Reopen it before historical corrections.</p></SaveForm></details>}</article>)}{!data.accounts.length && <p>Add the money you already have. Opening balances give you money to assign and are separate from earned income.</p>}</section>
      {canWrite && <section className="panel"><h2>Add an account</h2><SaveForm budgetId={data.budget.id} label="Create account" build={fields => ({ ...fields, action: 'account' })}><div className="form-grid"><label>Account name<input name="name" required maxLength={80} placeholder="Everyday" /></label><label>Account type<select name="kind"><option value="BANK">Bank account</option><option value="SAVINGS">Savings</option><option value="CASH">Cash</option></select></label><Amount label="Opening balance (NGN)" value="0.00" /><label>Opening date<input type="date" name="date" defaultValue={data.today} min="1900-01-01" max={data.today} required /></label></div><p className="small muted">Negative opening balances and credit accounts are deferred. Later expenses can still overdraw an account.</p></SaveForm></section>}
    </>}
    {view === 'transactions' && <>
      {canWrite && <section className="panel"><h2>Add a transaction</h2><TransactionForm data={data} /></section>}
      <section className="panel"><div className="row spread"><h2>Transactions · {data.month}</h2><a href={`/api/budgets/${data.budget.id}/export?month=${data.month}`}>Download month as CSV</a></div><p className="muted small">50 per page. Voided records remain in history and have no effect on balances or reports.</p>{data.transactions.map(row => <article key={row.id} className={`transaction-row ${row.voided ? 'voided' : ''}`}><div className="row spread"><div><strong>{row.kind === 'OPENING' ? 'Opening balance' : row.kind === 'TRANSFER' ? 'Internal transfer' : row.kind[0] + row.kind.slice(1).toLowerCase()}{row.voided && ' · Voided'}</strong><p className="small">{row.date} · {accounts.get(row.accountId)}{row.toAccountId ? ` → ${accounts.get(row.toAccountId)}` : ''}{row.categoryId ? ` · ${categories.get(row.categoryId)}` : ''}</p>{row.memo && <p>{row.memo}</p>}</div><strong>{money(row.amount)}</strong></div>{canWrite && !row.voided && <><button type="button" className="secondary" onClick={() => setEditing(editing === row.id ? null : row.id)}>{editing === row.id ? 'Cancel correction' : 'Correct transaction'}</button>{editing === row.id && <div className="correction"><TransactionForm key={`${row.id}-${row.version}`} data={data} transaction={row} saved={() => setEditing(null)} />{row.kind !== 'OPENING' && <div className="notice"><p>Voiding reverses this transaction’s money effect and preserves its history.</p><SaveForm budgetId={data.budget.id} label="Void this transaction" build={() => ({ action: 'void', id: row.id, version: row.version })} saved={() => setEditing(null)} /></div>}</div>}</>}</article>)}{!data.transactions.length && <p>No transactions in this month.</p>}<div className="row spread">{data.page > 1 ? <Link href={link('transactions', data.page - 1)}>Previous page</Link> : <span />}<span>Page {data.page}</span>{data.hasNext ? <Link href={link('transactions', data.page + 1)}>Next page</Link> : <span />}</div></section>
    </>}
    {view === 'reports' && <section className="panel"><h2>Money report · {data.month}</h2><table><tbody>{[['Opening balances', data.report.opening], ['Received income', data.report.income], ['Expenses', data.report.expenses], ['Refunds', data.report.refunds], ['Net spending', data.report.netSpending]].map(([label, value]) => <tr key={label}><th>{label}</th><td>{money(value)}</td></tr>)}</tbody></table><p className="notice">Internal transfers have no effect on income or spending. Opening balances are separate. Voided transactions are excluded.</p><h2>Spending by category</h2><table><thead><tr><th>Category</th><th>Net activity</th><th>Available</th></tr></thead><tbody>{data.categories.map(row => <tr key={row.id}><th>{row.name}</th><td>{money(row.activity)}</td><td>{money(row.available)}</td></tr>)}</tbody></table><p className="small muted">Negative category activity is net spending; positive activity is a net refund. Earlier uncovered overspending has reduced ready to assign by {money(data.pastOverspending)}.</p></section>}
    {view === 'activity' && <section className="panel"><h2>Recent changes</h2><p className="muted small">Latest 20 financial changes across all months. Previous records are retained for corrections and voids.</p>{data.activity.map(row => <details key={row.id}><summary>{row.action.replaceAll('-', ' ')} · {new Date(row.createdAt).toLocaleString('en-GB', { timeZone: 'Africa/Lagos' })}</summary><AuditRecord label="Before" value={row.before} accounts={accounts} /><AuditRecord label="After" value={row.after} accounts={accounts} /></details>)}{!data.activity.length && <p>No financial changes yet.</p>}</section>}
  </>
}

function AuditRecord({ label, value, accounts }: { label: string; value: unknown; accounts: Map<string, string> }) {
  if (!value || typeof value !== 'object') return null
  const row = value as Record<string, unknown>
  return <div className="audit"><strong>{label}</strong>{typeof row.name === 'string' && <p>{row.name}</p>}{typeof row.kind === 'string' && <p>{row.kind.toLowerCase()}</p>}{typeof row.date === 'string' && <p>Date: {row.date.slice(0, 10)}</p>}{typeof row.memo === 'string' && <p>Note: {row.memo || 'None'}</p>}{typeof row.opening === 'string' && <p>Opening: {money(row.opening)}</p>}{Array.isArray(row.entries) && row.entries.map((entry: { accountId: string; amount: string }, index: number) => <p key={index}>{accounts.get(entry.accountId)}: {money(entry.amount)}</p>)}{typeof row.month === 'string' && <p>Month: {row.month}</p>}{!!row.voidedAt && <p>Voided</p>}</div>
}
