'use client'
import { useContext, useState } from 'react'
import type { MoneySnapshot } from '@/lib/money'
import { cents, decimal } from '@/lib/money-math'
import { splitAssignments, splitPresets, validatePortions, type SplitPortion } from '@/lib/quick-budget'
import { money, SaveForm } from './money-form'
import { TaskDialog, TaskDialogContext } from './task-dialog'

function SplitEditor({ data }: { data: MoneySnapshot }) {
  const dialog = useContext(TaskDialogContext)
  const [selection, setSelection] = useState('preset-0'), [name, setName] = useState('My payday split')
  const [portions, setPortions] = useState<SplitPortion[]>(splitPresets[0].labels.map((label, i) => ({ label, percent: splitPresets[0].percentages[i], categoryIds: [] })))
  const [amount, setAmount] = useState(data.readyToAssign.startsWith('-') ? '0.00' : data.readyToAssign)
  const [error, setError] = useState(''), [preview, setPreview] = useState<ReturnType<typeof splitAssignments> | null>(null)
  const categories = data.categories.filter(row => !row.archived)
  const saved = data.quickBudgetSplits.find(row => row.id === selection)
  const totalPercent = portions.reduce((sum, row) => sum + row.percent, 0)
  function choose(value: string) {
    setSelection(value); setPreview(null); setError('')
    const existing = data.quickBudgetSplits.find(row => row.id === value)
    if (existing) { setName(existing.name); setPortions(existing.portions); return }
    if (value === 'custom') { setName('My payday split'); setPortions([{ label: 'Essentials', percent: 60, categoryIds: [] }, { label: 'Savings', percent: 40, categoryIds: [] }]); return }
    const preset = splitPresets[Number(value.slice(7))]
    setName(preset.name.split(' — ')[0]); setPortions(preset.labels.map((label, i) => ({ label, percent: preset.percentages[i], categoryIds: [] })))
  }
  function update(index: number, patch: Partial<SplitPortion>) { setPreview(null); setPortions(rows => rows.map((row, i) => i === index ? { ...row, ...patch } : row)) }
  function review() {
    try {
      const changes = splitAssignments(amount, portions)
      if (cents(amount) > cents(data.readyToAssign, true)) throw new Error('Choose an amount within your ready-to-assign money.')
      if (changes.some(row => !categories.some(category => category.id === row.categoryId))) throw new Error('A selected category is no longer active. Update your choices.')
      setPreview(changes); setError('')
    } catch (error) { setPreview(null); setError((error as Error).message) }
  }
  let valid = false
  try { validatePortions(portions); valid = true } catch { /* Validation guidance appears on review. */ }
  return <div className="quick-budget">
    <fieldset disabled={dialog?.phase !== 'idle'}>
    <p className="muted">Split available money between your existing categories. Previous assignments stay in place.</p>
    <label>Quick Budget option<select value={selection} onChange={event => choose(event.target.value)}>
      <optgroup label="Suggested splits">{splitPresets.slice(0,3).map((row,i) => <option key={row.name} value={`preset-${i}`}>{row.name}</option>)}</optgroup>
      <optgroup label="More splits">{splitPresets.slice(3).map((row,i) => <option key={row.name} value={`preset-${i+3}`}>{row.name}</option>)}</optgroup>
      {!!data.quickBudgetSplits.length && <optgroup label="Saved for this budget">{data.quickBudgetSplits.map(row => <option key={row.id} value={row.id}>{row.name}</option>)}</optgroup>}
      <option value="custom">My custom split</option>
    </select></label>
    <label>Amount to distribute (NGN)<input inputMode="decimal" value={amount} onChange={event => { setAmount(event.target.value); setPreview(null) }} /></label>
    <p className="small muted">Ready to assign: {money(data.readyToAssign)} · Month: {data.month}. This plans money; it does not move money at your bank.</p>
    <h3>Make this split yours</h3><p className="small muted">Choose each category once. Multiple categories within a portion share its money equally. Edit any name or percentage, then save your choices to reuse them.</p>
    {portions.map((portion,index) => <fieldset key={index} className="split-portion"><legend>Portion {index+1}</legend>
      <div className="form-grid"><label>Portion name<input value={portion.label} maxLength={80} onChange={event => update(index,{ label: event.target.value })} /></label><label>Percentage<input type="number" min="1" max="100" step="1" value={portion.percent || ''} onChange={event => update(index,{ percent: Number(event.target.value) })} /></label></div>
      <div className="split-categories">{categories.map(category => <label key={category.id}><input type="checkbox" checked={portion.categoryIds.includes(category.id)} disabled={!portion.categoryIds.includes(category.id) && portions.some(row => row.categoryIds.includes(category.id))} onChange={event => update(index,{ categoryIds: event.target.checked ? [...portion.categoryIds,category.id] : portion.categoryIds.filter(id => id !== category.id) })} />{category.name}</label>)}</div>
      {portion.categoryIds.some(id => !categories.some(row => row.id === id)) && <p className="error">An old category is unavailable. <button type="button" className="secondary" onClick={() => update(index, { categoryIds: portion.categoryIds.filter(id => categories.some(row => row.id === id)) })}>Remove unavailable categories</button></p>}
      {portions.length > 1 && <button type="button" className="secondary" onClick={() => { setPortions(rows => rows.filter((_,i) => i !== index)); setPreview(null) }}>Remove portion {index+1}</button>}
    </fieldset>)}
    {!categories.length && <p className="notice">Add your budget categories first, then return here to connect them to a split.</p>}
    <div className="task-actions"><button type="button" className="secondary" disabled={portions.length >= 20} onClick={() => { setPortions(rows => [...rows,{ label: 'New portion', percent: 0, categoryIds: [] }]); setPreview(null) }}>Add portion</button><span aria-live="polite">Total: {totalPercent}% of 100%</span></div>
    <button type="button" onClick={review}>Preview split</button>{error && <p role="alert" className="error">{error}</p>}
    </fieldset>
    {preview && <section className="split-preview" aria-label="Split preview"><h3>Review your assignments</h3><p>Adding {money(amount)} in {data.month}</p><div className="table-scroll"><table><thead><tr><th>Category</th><th>Available now</th><th>Add</th><th>After</th></tr></thead><tbody>{preview.map(row => { const category = categories.find(c => c.id === row.categoryId)!; return <tr key={row.categoryId}><td>{category.name}<small className="muted">{row.portion}</small></td><td>{money(category.available)}</td><td>{money(row.amount)}</td><td>{money(decimal(cents(category.available,true) + cents(row.amount)))}</td></tr> })}</tbody></table></div>
      <p>Ready to assign afterward: <strong>{money(decimal(cents(data.readyToAssign,true) - cents(amount)))}</strong></p><p className="small muted">Tiny rounding differences go to the largest fractional shares, then the first selected categories. Review again if the budget changes.</p>
      <SaveForm budgetId={data.budget.id} label={`Apply ${money(amount)}`} build={() => ({ action: 'quick-budget', month: data.month, amount, portions, revision: data.budget.revision })} />
    </section>}
    <details className="budget-tools"><summary>Save or manage this split</summary><SaveForm budgetId={data.budget.id} label={saved ? 'Update saved split' : 'Save split'} disabled={!valid} build={() => ({ action: 'save-split', revision: data.budget.revision, split: { id: saved?.id ?? crypto.randomUUID(), name, portions } })}><label>Split name<input value={name} required maxLength={80} onChange={event => setName(event.target.value)} /></label><p className="small muted">Saved splits are shared with this budget’s owner and editors. Saving a split does not assign money. To duplicate one, change its name and use Save as new.</p></SaveForm>
      {saved && <><SaveForm budgetId={data.budget.id} label="Save as new" disabled={!valid || !name.trim()} build={() => ({ action: 'save-split', revision: data.budget.revision, split: { id: crypto.randomUUID(), name, portions } })} /><SaveForm budgetId={data.budget.id} label="Delete saved split" saved={() => dialog?.complete()} build={() => ({ action: 'delete-split', id: saved.id, revision: data.budget.revision })}><p className="small muted">Delete “{saved.name}”? This removes the saved template only. Existing assignments stay in place.</p></SaveForm></>}
    </details>
  </div>
}

export function QuickBudget({ data }: { data: MoneySnapshot }) {
  return <TaskDialog title="Quick Budget"><SplitEditor data={data} /></TaskDialog>
}
