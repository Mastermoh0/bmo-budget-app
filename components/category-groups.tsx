'use client'
import Link from 'next/link'
import type { MoneySnapshot } from '@/lib/money'
import { cents, decimal } from '@/lib/money-math'
import { money, SaveForm } from './money-form'

export function GroupSelect({ data, current }: { data: MoneySnapshot; current?: string | null }) {
  return <label>Category group<select name="groupId" defaultValue={current ?? ''}><option value="">Ungrouped</option>{data.groups.filter(row => !row.archived || row.id === current).map(row => <option value={row.id} key={row.id}>{row.name}{row.archived ? ' (archived)' : ''}</option>)}</select></label>
}

export function ReorderControls({ data, kind, item, siblings }: { data: MoneySnapshot; kind: 'group' | 'category'; item: { id: string; version: number }; siblings: { id: string }[] }) {
  const index = siblings.findIndex(row => row.id === item.id)
  return <div className="row order-controls">{(['up', 'down'] as const).map(direction => <SaveForm key={direction} budgetId={data.budget.id} label={`Move ${kind} ${direction}`} disabled={direction === 'up' ? index <= 0 : index === siblings.length - 1} build={() => ({ action: 'reorder', kind, id: item.id, version: item.version, direction })} />)}</div>
}

export function GroupControls({ data }: { data: MoneySnapshot }) {
  return <section className="panel"><h2>Category groups</h2><p className="muted small">Organize categories into groups such as Essentials or Savings. Changing a group never moves your money. Move or archive its active categories before archiving a group.</p>
    <SaveForm budgetId={data.budget.id} label="Add group" build={fields => ({ ...fields, action: 'group' })}><label>Group name<input name="name" maxLength={80} required placeholder="Essentials" /></label></SaveForm>
    {data.groups.map(row => <details key={`${row.id}-${row.version}`}><summary>{row.name} · {row.archived ? 'Archived group' : 'Active group'}</summary><SaveForm budgetId={data.budget.id} label="Save group" build={fields => ({ ...fields, action: 'group-state', id: row.id, version: row.version, inactive: fields.inactive === 'true' })}><label>Group name<input name="name" defaultValue={row.name} maxLength={80} required /></label><label>Group status<select name="inactive" defaultValue={String(row.archived)}><option value="false">Active</option><option value="true">Archived</option></select></label></SaveForm>{!row.archived && <ReorderControls data={data} kind="group" item={row} siblings={data.groups.filter(item => !item.archived)} />}</details>)}
  </section>
}

export function GroupedWorksheet({ data }: { data: MoneySnapshot }) {
  const groups = [...data.groups.filter(row => !row.archived), { id: null, name: 'Ungrouped', archived: false }, ...data.groups.filter(row => row.archived)]
  return <section className="panel"><h2>Categories · {data.month}</h2><div className="table-scroll"><table><thead><tr><th>Category</th><th>Carried in</th><th>Assigned</th><th>Activity</th><th>Available</th><th>Target</th></tr></thead>{groups.map(group => {
    const categories = data.categories.filter(row => row.groupId === group.id)
    if (!group.id && !categories.length) return null
    const totals = (['carry', 'assigned', 'activity', 'available'] as const).map(field => decimal(categories.reduce((sum, row) => sum + cents(row[field], true), 0n)))
    return <tbody key={group.id ?? 'ungrouped'} aria-label={group.name}><tr className="group-row"><th scope="rowgroup">{group.name}{group.archived && ' · Archived'}</th>{totals.map((value, index) => <td key={index}>{money(value)}</td>)}<td /></tr>{categories.map(row => <tr key={row.id}><th scope="row">{row.name}{row.archived && <span className="status">Archived</span>}</th><td>{money(row.carry)}</td><td>{money(row.assigned)}</td><td>{money(row.activity)}</td><td className={row.available.startsWith('-') ? 'negative' : ''}>{money(row.available)}{row.available.startsWith('-') && <span className="small"> · Overspent</span>}</td><td className="small">{row.target && !row.target.removed ? <Link href={`/budgets/${data.budget.id}/targets?month=${data.month}`}>{row.target.percent}% · {row.target.kind === 'MONTHLY' ? 'Monthly' : 'By date'}</Link> : '—'}</td></tr>)}{!categories.length && <tr><td colSpan={6} className="muted">No categories in this group yet.</td></tr>}</tbody>
  })}</table></div>{!data.categories.length && <p>Add your first category, such as Groceries or Transport.</p>}<p className="muted small">Positive available money carries forward. An uncovered shortfall resets its category to zero next month and reduces ready-to-assign money once. Future allocations reserve {money(data.futureAssigned)}. Archived records remain included in the totals.</p></section>
}
