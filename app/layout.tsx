import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = { title: 'Bimo · Budget preview', description: 'Private budgeting development preview', robots: { index: false, follow: false } }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><header><Link className="brand" href="/">Bimo</Link><span className="preview">Development preview</span><nav aria-label="Main navigation"><Link href="/">Budgets</Link><Link href="/settings">Account security</Link></nav></header><main>{children}</main><footer>Local development preview · Bank accounts, category budgeting and transaction history.</footer></body></html>
}
