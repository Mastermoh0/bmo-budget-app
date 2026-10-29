// Only our explicitly authored request messages may cross into the interface.
export function userFacingError(status: number, payload: unknown, fallback = 'This change could not be saved. Please try again.') {
  if (status >= 500) return 'Bimo could not confirm that request. Please try again.'
  if (status === 429) return 'You have made several requests in a short time. Please wait a minute and try again.'
  if (payload && typeof payload === 'object' && 'code' in payload && payload.code === 'BIMO_REQUEST_ERROR' && 'error' in payload && typeof payload.error === 'string' && payload.error.length <= 300 && !/Prisma|SQLSTATE|ECONN|TypeError|ReferenceError|SyntaxError|\n\s*at\s|<html/i.test(payload.error)) return payload.error
  if (status === 401) return 'Please sign in again to continue.'
  if (status === 403) return 'You do not have permission to make this change. Check your access or sign in again.'
  if (status === 404 || status === 410) return 'This item is no longer available. Refresh the page or open a new invitation.'
  if (status === 409) return 'Something changed while you were working. Refresh the page, check the latest details and try again.'
  if (status === 400 || status === 413) return 'Please check the details you entered and try again.'
  return fallback
}
