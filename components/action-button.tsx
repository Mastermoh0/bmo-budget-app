import type { ButtonHTMLAttributes } from 'react'

export function ActionButton({ busy = false, pendingLabel = 'Working…', children, disabled, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { busy?: boolean; pendingLabel?: string }) {
  return <button {...props} disabled={disabled || busy} aria-busy={busy}><span className="button-label">{busy ? pendingLabel : children}</span>{busy && <span className="button-spinner" aria-hidden="true" />}</button>
}
