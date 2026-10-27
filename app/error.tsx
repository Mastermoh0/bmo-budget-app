'use client'
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <section className="panel"><h1>Bimo could not load this page</h1><p>Please retry once the local services are available.</p><button onClick={reset}>Try again</button></section>
}
