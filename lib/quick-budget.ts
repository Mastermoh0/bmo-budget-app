import { cents, decimal } from './money-math'

export type SplitPortion = { label: string; percent: number; categoryIds: string[] }
export type SavedSplit = { id: string; name: string; portions: SplitPortion[] }
export const splitPresets = [
  { name: 'Balanced — 50/30/20', labels: ['Needs', 'Wants', 'Savings and goals'], percentages: [50,30,20] },
  { name: 'More for essentials — 60/20/20', labels: ['Needs', 'Wants', 'Savings and goals'], percentages: [60,20,20] },
  { name: 'Simple spending and saving — 80/20', labels: ['Everyday spending', 'Savings and goals'], percentages: [80,20] },
  { name: 'Essentials-heavy — 70/20/10', labels: ['Needs', 'Wants', 'Savings and goals'], percentages: [70,20,10] },
  { name: 'Spending, saving and giving — 70/20/10', labels: ['Everyday spending', 'Savings', 'Giving or extra debt payments'], percentages: [70,20,10] },
]

export function validatePortions(value: unknown): SplitPortion[] {
  if (!Array.isArray(value) || !value.length || value.length > 20) throw new Error('Use between 1 and 20 portions.')
  const ids = new Set<string>()
  const portions = value.map(row => {
    if (!row || typeof row.label !== 'string' || !row.label.trim() || row.label.length > 80 || !Number.isInteger(row.percent) || row.percent < 1 || row.percent > 100 || !Array.isArray(row.categoryIds) || !row.categoryIds.length || row.categoryIds.length > 100) throw new Error('Give each portion a name, a whole percentage and at least one category.')
    for (const id of row.categoryIds) {
      if (typeof id !== 'string' || !id || id.length > 80 || ids.has(id)) throw new Error('Choose each category only once across the split.')
      ids.add(id)
    }
    return { label: row.label.trim(), percent: row.percent, categoryIds: [...row.categoryIds] as string[] }
  })
  if (portions.reduce((sum, row) => sum + row.percent, 0) !== 100) throw new Error('Your percentages must add up to 100%.')
  return portions
}

export function splitAssignments(amount: string, input: unknown) {
  const portions = validatePortions(input), total = cents(amount)
  if (total <= 0n || total > 99999999999999999999n) throw new Error('Enter an amount greater than zero, within 18 whole digits.')
  const shares = portions.map((row, index) => ({ index, value: total * BigInt(row.percent) / 100n, remainder: total * BigInt(row.percent) % 100n }))
  let remaining = total - shares.reduce((sum, row) => sum + row.value, 0n)
  for (const share of [...shares].sort((a,b) => Number(b.remainder - a.remainder) || a.index - b.index)) if (remaining > 0n) { share.value++; remaining-- }
  return portions.flatMap((row, index) => {
    const count = BigInt(row.categoryIds.length), share = shares[index].value
    return row.categoryIds.map((categoryId, i) => ({ categoryId, amount: decimal(share / count + (BigInt(i) < share % count ? 1n : 0n)), portion: row.label }))
  })
}
