import { verifiedSession, json, apiFailure } from '@/lib/access'

async function unavailable(request: Request) {
  try { await verifiedSession(request.headers); return json({ error: 'This feature is being rebuilt and is unavailable in the auth foundation.', code: 'FEATURE_NOT_READY' }, 410) } catch (error) { return apiFailure(error) }
}
export { unavailable as GET, unavailable as POST, unavailable as PUT, unavailable as PATCH, unavailable as DELETE }
