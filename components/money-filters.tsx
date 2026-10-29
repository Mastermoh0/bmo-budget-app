import Link from 'next/link'
import { NavigationForm } from './navigation-form'
import type { MoneySnapshot } from '@/lib/money'

export function MoneyFilterForm({ data, report = false }: { data: MoneySnapshot; report?: boolean }) {
  const f = data.filters
  return <NavigationForm label="Apply filters" className="panel filter-form"><h2>{report ? 'Report filters' : 'Find transactions'}</h2><input type="hidden" name="month" value={data.month} /><div className="form-grid">
    <label>Search payee or note<input name="q" defaultValue={f.q} maxLength={100} /></label>
    <label>Filter account<select name="accountId" defaultValue={f.accountId}><option value="">All accounts</option>{data.accounts.map(row => <option key={row.id} value={row.id}>{row.name}{row.closed && ' (closed)'}</option>)}</select></label>
    <label>Filter category<select name="categoryId" defaultValue={f.categoryId}><option value="">All categories</option>{data.categories.map(row => <option key={row.id} value={row.id}>{row.name}{row.archived && ' (archived)'}</option>)}</select></label>
    <label>Filter group<select name="groupId" defaultValue={f.groupId}><option value="">All groups</option><option value="ungrouped">Ungrouped</option>{data.groups.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}</select></label>
    <label>From date<input type="date" name="from" defaultValue={f.from} min={`${data.month}-01`} /></label><label>Through date<input type="date" name="to" defaultValue={f.to} min={`${data.month}-01`} /></label>
    {!report && <label>Transaction status<select name="status" defaultValue={f.status}><option value="all">Active and voided</option><option value="active">Active only</option><option value="voided">Voided only</option></select></label>}
  </div><p className="small muted">Dates stay within the selected month. Filters change this list/report, never your balances or allocations.</p><div className="row"><Link href={`/budgets/${data.budget.id}/${report ? 'reports' : 'transactions'}?month=${data.month}`}>Clear filters</Link></div></NavigationForm>
}
