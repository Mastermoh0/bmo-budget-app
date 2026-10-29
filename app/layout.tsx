import type { Metadata } from 'next'
import { NavLink as Link } from '@/components/nav-link'
import { AppearanceSwitch } from '@/components/appearance-switch'
import { appearanceBoot } from '@/lib/appearance'
import './globals.css'

export const metadata: Metadata = { title: 'Bimo · Budget preview', description: 'Private budgeting development preview', robots: { index: false, follow: false } }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en" data-appearance="light" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{ __html: appearanceBoot }} /></head><body><span hidden data-design-contract="canvas-night-desk-e365e4bf">THESIS: Plan existing money by purpose. OWN-WORLD: Blue frame, white Canvas, Manrope; charcoal and amber Night Desk. STORY: Plan, record, verify, share. FIRST VIEWPORT: Top navigation, inset workspace, exact summary, purpose groups, Add transaction. FORM: User-pinned Canvas, e365e4bf. FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.</span><a className="skip-link" href="#main">Skip to content</a><header className="site-header"><Link className="brand" href="/" aria-label="Bimo home"><svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="9" fill="currentColor" /><path d="M10 8v15h7a6 6 0 0 0 0-12h-3" fill="none" stroke="var(--on-primary)" strokeWidth="3" /></svg>bimo</Link><span className="preview">Local preview</span><nav aria-label="Main navigation"><Link href="/">Budgets</Link><Link href="/settings">Account security</Link></nav><AppearanceSwitch /></header><main id="main" tabIndex={-1}>{children}</main><footer className="site-footer">Bimo · Local development preview<span>NGN · Africa/Lagos</span></footer></body></html>
}
