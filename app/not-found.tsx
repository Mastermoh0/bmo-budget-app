import Link from 'next/link'
export default function NotFound() {
  return <section className="panel"><h1>This page is not available</h1><p>The page may be unavailable in this development milestone, or you may no longer have access to this budget.</p><Link href="/">Return to your budgets</Link></section>
}
