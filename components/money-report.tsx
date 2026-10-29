'use client'
import { useState } from 'react'
import type { MoneySnapshot } from '@/lib/money'
import { cents, decimal } from '@/lib/money-math'
import { money } from './money-form'
import { MoneyFilterForm } from './money-filters'

export function MoneyReport({ data }: { data: MoneySnapshot }) {
  const [grouped, setGrouped] = useState(false), [chart, setChart] = useState(false)
  const r = data.filteredReport
  const rows = grouped ? [...data.groups, { id: null, name: 'Ungrouped' }].map(group => ({ id: group.id ?? 'ungrouped', name: group.name, amount: decimal(data.categories.filter(row => row.groupId === group.id).reduce((sum, row) => sum + cents(r.categories.find(item => item.id === row.id)?.netSpending ?? '0.00', true), 0n)) })) : data.categories.map(row => ({ id: row.id, name: row.name, amount: r.categories.find(item => item.id === row.id)?.netSpending ?? '0.00' }))
  const max = rows.reduce((value, row) => cents(row.amount, true) > value ? cents(row.amount, true) : value, 1n)
  const percentage = (amount: string) => Number((cents(amount, true) > 0n ? cents(amount, true) : 0n) * 10000n / max) / 100
  const query = new URLSearchParams({ month: data.month, ...Object.fromEntries(Object.entries(data.filters).filter(([key, value]) => key !== 'status' && value)) })
  return <><MoneyFilterForm data={data} report /><section className="panel"><div className="row spread"><h2>Filtered money report · {data.month}</h2><a href={`/api/budgets/${data.budget.id}/report?${query}`}>Download report CSV</a></div><table><tbody>{[['Opening balances', r.opening], ['Received income', r.income], ['Expenses', r.expenses], ['Refunds', r.refunds], ['Net spending', r.netSpending]].map(([label, value]) => <tr key={label}><th>{label}</th><td>{money(value)}</td></tr>)}</tbody></table><p className="notice">Internal transfers and voided transactions do not count as spending or income. Opening money is separate. The summary cards above always show the whole budget/month.</p>
    <div className="row spread"><h2>Budget versus spending</h2><div className="row"><button className="secondary" aria-pressed={grouped} onClick={() => setGrouped(!grouped)}>{grouped ? 'Show categories' : 'Show groups'}</button><button className="secondary" aria-pressed={chart} onClick={() => setChart(!chart)}>{chart ? 'Show table' : 'Show chart'}</button></div></div>
    {chart ? <div aria-label="Net spending chart">{rows.map(row => <div className="spending-bar" key={row.id}><div className="row spread"><span>{row.name}</span><strong>{money(row.amount)}</strong></div><meter min={0} max={100} value={percentage(row.amount)} aria-label={`${row.name} relative spending`} /></div>)}</div> : <div className="table-scroll"><table><thead><tr><th>{grouped ? 'Group' : 'Category'}</th><th>Assigned (whole month)</th><th>Net spending (filtered)</th><th>Available (whole month)</th></tr></thead><tbody>{rows.map(row => {
      const categories = grouped ? data.categories.filter(c => (c.groupId ?? 'ungrouped') === row.id) : data.categories.filter(c => c.id === row.id)
      const total = (key: 'assigned' | 'available') => money(decimal(categories.reduce((sum, c) => sum + cents(c[key], true), 0n)))
      return <tr key={row.id}><th>{row.name}</th><td>{total('assigned')}</td><td>{money(row.amount)}</td><td>{total('available')}</td></tr>
    })}</tbody></table></div>}<p className="muted small">Negative net spending means refunds exceeded expenses. Chart bars show positive spending; exact amounts remain visible. Category allocations belong to the budget, not to one bank account.</p></section></>
}
