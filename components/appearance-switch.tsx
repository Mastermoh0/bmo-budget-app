'use client'
import { useSyncExternalStore } from 'react'
import { appearanceKey, toggleAppearance } from '@/lib/appearance'
import { useHydrated } from '@/lib/use-hydrated'

function read() { return document.documentElement.dataset.appearance === 'dark' }
function subscribe(update: () => void) {
  const stored = (event: StorageEvent) => { if (event.key === appearanceKey || event.key === null) { document.documentElement.dataset.appearance = event.newValue === 'dark' ? 'dark' : 'light'; update() } }
  window.addEventListener('bimo-appearance', update); window.addEventListener('storage', stored)
  return () => { window.removeEventListener('bimo-appearance', update); window.removeEventListener('storage', stored) }
}
export function AppearanceSwitch() {
  const dark = useSyncExternalStore(subscribe, read, () => false), ready = useHydrated()
  return <button type="button" className="appearance-control" role="switch" aria-checked={dark} disabled={!ready} onClick={toggleAppearance}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10Z" /></svg>Dark mode<span className="appearance-track" aria-hidden="true"><span /></span></button>
}
