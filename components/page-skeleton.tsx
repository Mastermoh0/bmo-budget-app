export type SkeletonView = 'budgets' | 'budget' | 'transactions' | 'accounts' | 'reports' | 'targets' | 'activity' | 'household' | 'settings' | 'auth'
export function PageSkeleton({ view = 'budgets' }: { view?: SkeletonView }) {
  const budget = ['budget', 'transactions', 'accounts', 'reports', 'targets', 'activity'].includes(view)
  return <div className={`page-skeleton skeleton-${view}`} role="status" aria-busy="true" aria-label={`Loading ${view}`}><span className="sr-only">Loading {view}. Your information will appear here.</span><div aria-hidden="true">
    <div className="skeleton-heading"><div><div className="skeleton-block skeleton-title" /><div className="skeleton-block skeleton-subtitle" /></div><div className="skeleton-block skeleton-button" /></div>
    {budget && <><div className="skeleton-tabs">{Array.from({ length: 6 }, (_, i) => <div key={i} className="skeleton-block skeleton-tab" />)}</div><div className="skeleton-metrics">{[0,1,2].map(i => <div key={i}><div className="skeleton-block skeleton-label" /><div className="skeleton-block skeleton-figure" /><div className="skeleton-block skeleton-label" /></div>)}</div></>}
    <div className={['budget', 'targets', 'budgets', 'settings'].includes(view) ? 'skeleton-columns' : ''}>{Array.from({ length: view === 'auth' ? 1 : view === 'settings' ? 4 : 3 }, (_, i) => <div className="skeleton-section" key={i}><div className="skeleton-block skeleton-subtitle" />{Array.from({ length: view === 'settings' || view === 'auth' ? 3 : 4 }, (_, j) => <div key={j} className="skeleton-line"><div className="skeleton-block" /><div className="skeleton-block" /></div>)}</div>)}</div>
  </div></div>
}
