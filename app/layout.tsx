import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = { title: 'Bimo · Auth foundation', description: 'Private-budget authentication development preview', robots: { index: false, follow: false } }

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><header><Link className="brand" href="/">Bimo</Link><span className="preview">Development preview</span><nav aria-label="Main navigation"><Link href="/">Budgets</Link><Link href="/settings">Account security</Link></nav></header><main>{children}</main><footer>Authentication and private-budget foundation. Money entry is being rebuilt.</footer></body></html>
}
