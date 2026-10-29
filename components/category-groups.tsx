'use client'
import Link from 'next/link'
import type { MoneySnapshot } from '@/lib/money'
import { cents, decimal } from '@/lib/money-math'
import { money, SaveForm } from './money-form'
import { TaskDialog } from './task-dialog'

export function GroupSelect({ data, current }: { data: MoneySnapshot; current?: string | null }) {
  return <label>Category group<select name="groupId" defaultValue={current ?? ''}><option value="">Ungrouped</option>{data.groups.filter(row => !row.archived || row.id === current).map(row => <option value={row.id} key={row.id}>{row.name}{row.archived ? ' (archived)' : ''}</option>)}</select></label>
}

export function ReorderControls({ data, kind, item, siblings }: { data: MoneySnapshot; kind: 'group' | 'category'; item: { id: string; version: number }; siblings: { id: string }[] }) {
  const index = siblings.findIndex(row => row.id === item.id)
  return <div className="row order-controls">{(['up', 'down'] as const).map(direction => <SaveForm key={direction} budgetId={data.budget.id} label={`Move ${kind} ${direction}`} disabled={direction === 'up' ? index <= 0 : index === siblings.length - 1} build={() => ({ action: 'reorder', kind, id: item.id, version: item.version, direction })} />)}</div>
}

export function GroupControls({ data }: { data: MoneySnapshot }) {
  return <section className="panel"><h2>Category groups</h2><p className="muted small">Organize categories into groups such as Essentials or Savings. Changing a group never moves your money. Move or archive its active categories before archiving a group.</p>
    <div className="task-actions"><TaskDialog title="Add a group" label="Add group"><SaveForm budgetId={data.budget.id} label="Add group" build={fields => ({ ...fields, action: 'group' })}><label>Group name<input name="name" maxLength={80} required placeholder="Essentials" /></label></SaveForm></TaskDialog></div>
    {data.groups.map(row => <article className="account-row" key={row.id}><div className="row spread"><h3>{row.name} · {row.archived ? 'Archived group' : 'Active group'}</h3><TaskDialog title={`Manage ${row.name}`} label="Manage group"><SaveForm budgetId={data.budget.id} label="Save group" build={fields => ({ ...fields, action: 'group-state', id: row.id, version: row.version, inactive: fields.inactive === 'true' })}><label>Group name<input name="name" defaultValue={row.name} maxLength={80} required /></label><label>Group status<select name="inactive" defaultValue={String(row.archived)}><option value="false">Active</option><option value="true">Archived</option></select></label></SaveForm></TaskDialog></div>{!row.archived && <ReorderControls data={data} kind="group" item={row} siblings={data.groups.filter(item => !item.archived)} />}</article>)}
  </section>
}

function FullWorksheet({ data }: { data: MoneySnapshot }) {
  const groups = [...data.groups.filter(row => !row.archived), { id: null, name: 'Ungrouped', archived: false }, ...data.groups.filter(row => row.archived)]
  return <section className="panel"><h2>Categories · {data.month}</h2><div className="table-scroll"><table><thead><tr><th>Category</th><th>Carried in</th><th>Assigned</th><th>Activity</th><th>Available</th><th>Target</th></tr></thead>{groups.map(group => {
    const categories = data.categories.filter(row => row.groupId === group.id)
    if (!group.id && !categories.length) return null
    const totals = (['carry', 'assigned', 'activity', 'available'] as const).map(field => decimal(categories.reduce((sum, row) => sum + cents(row[field], true), 0n)))
    return <tbody key={group.id ?? 'ungrouped'} aria-label={group.name}><tr className="group-row"><th scope="rowgroup">{group.name}{group.archived && ' · Archived'}</th>{totals.map((value, index) => <td key={index}>{money(value)}</td>)}<td /></tr>{categories.map(row => <tr key={row.id}><th scope="row">{row.name}{row.archived && <span className="status">Archived</span>}</th><td>{money(row.carry)}</td><td>{money(row.assigned)}</td><td>{money(row.activity)}</td><td className={row.available.startsWith('-') ? 'negative' : ''}>{money(row.available)}{row.available.startsWith('-') && <span className="small"> · Overspent</span>}</td><td className="small">{row.target && !row.target.removed ? <Link href={`/budgets/${data.budget.id}/targets?month=${data.month}`}>{row.target.percent}% · {row.target.kind === 'MONTHLY' ? 'Monthly' : 'By date'}</Link> : '—'}</td></tr>)}{!categories.length && <tr><td colSpan={6} className="muted">No categories in this group yet.</td></tr>}</tbody>
  })}</table></div>{!data.categories.length && <p>Add your first category, such as Groceries or Transport.</p>}<p className="muted small">Positive available money carries forward. An uncovered shortfall resets its category to zero next month and reduces ready-to-assign money once. Future allocations reserve {money(data.futureAssigned)}. Archived records remain included in the totals.</p></section>
}

export function GroupedWorksheet({ data, onAssign, onAddCategory }: { data: MoneySnapshot; onAssign: () => void; onAddCategory: () => void }) {
  const groups = [...data.groups.filter(row => !row.archived), { id: null, name: 'Ungrouped', archived: false, note: '' }, ...data.groups.filter(row => row.archived)].filter(group => data.categories.some(row => row.groupId === group.id) || group.id)
  const overspent = data.categories.filter(row => cents(row.available, true) < 0n)
  const shortfall = decimal(overspent.reduce((sum, row) => sum - cents(row.available, true), 0n))
  return <>{overspent.length > 0 && <div className="notice row spread"><p><strong className="negative">{money(shortfall)} to cover.</strong> {overspent.length === 1 ? overspent[0].name : `${overspent.length} categories`} spent more than available.</p>{data.budget.role !== 'VIEWER' && <button type="button" className="secondary" onClick={onAssign}>Cover overspending</button>}</div>}<div className="row spread purpose-header"><h2>Your plan, by purpose</h2>{data.budget.role !== 'VIEWER' && <button type="button" className="secondary" onClick={onAssign}>Assign money</button>}</div>
    {!data.categories.length && <div className="notice"><h3>Give your money a place to go</h3><p>Add a category such as Groceries, Transport or an Emergency fund. Your available money stays yours until you assign it.</p>{data.budget.role !== 'VIEWER' && <button type="button" onClick={onAddCategory}>Add your first category</button>}</div>}
    <div className="purpose-grid">{groups.map(group => {
      const categories = data.categories.filter(row => row.groupId === group.id)
      const available = decimal(categories.reduce((sum, row) => sum + cents(row.available, true), 0n))
      return <section className="purpose-group" key={group.id ?? 'ungrouped'} aria-label={`${group.name} purposes`}><div className="purpose-group-header"><h3>{group.name}{group.archived && ' · Archived'}</h3><span>{money(available)} left</span></div><div className="purpose-categories">{categories.map(row => {
        const assigned = cents(row.assigned, true) + cents(row.carry, true), spending = -cents(row.activity, true)
        const percent = assigned > 0n && spending > 0n ? Number((spending > assigned ? assigned : spending) * 100n / assigned) : 0
        return <details key={row.id} className="purpose-category"><summary><span className="category-name">{row.name}{row.archived && <span className="status">Archived</span>}<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg></span><span className="category-figure"><strong className={row.available.startsWith('-') ? 'negative' : ''}>{money(row.available)}</strong><small>{row.available.startsWith('-') ? 'overspent' : 'available'}</small></span><span className="category-bar" aria-hidden="true"><span style={{ width: `${percent}%` }} /></span><span className="category-caption"><span>{money(decimal(spending))} net spending</span><span>{row.target && !row.target.removed ? `${row.target.percent}% of target` : 'View details'}</span></span></summary>
          <dl className="category-breakdown">{[['Carried in', row.carry], ['Assigned this month', row.assigned], ['Net activity', row.activity], ['Available', row.available]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{money(value)}</dd></div>)}</dl>{row.note && <p className="purpose-note">{row.note}</p>}{row.target && !row.target.removed && <p className="small"><Link href={`/budgets/${data.budget.id}/targets?month=${data.month}`}>View savings target</Link></p>}
        </details>
      })}</div>{!categories.length && <p className="purpose-note">No categories in this group yet.</p>}{group.note && <p className="purpose-note">{group.note}</p>}</section>
    })}</div>
    <details className="worksheet-details"><summary>View detailed worksheet</summary><FullWorksheet data={data} /></details></>
}
