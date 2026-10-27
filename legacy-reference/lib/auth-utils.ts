import { signOut } from 'next-auth/react'

/**
 * Checks if an API response contains an authentication or user-not-found error
 * and automatically redirects to sign-in if needed
 */
export const handleAuthError = async (response: Response, errorData: any) => {
  const isAuthError = response.status === 401 || 
                     errorData.error?.includes('not found in database') ||
                     errorData.error?.includes('User not found') ||
                     errorData.error?.includes('Unauthorized')

  if (isAuthError) {
    console.log('Authentication error detected:', errorData.error)
    await signOut({
      callbackUrl: '/auth/signin',
      redirect: true
    })
    return true
  }
  
  return false
}

/**
 * Utility function to check if an error indicates the user needs to sign in again
 */
export const isAuthenticationError = (response: Response, errorData: any): boolean => {
  return response.status === 401 || 
         errorData.error?.includes('not found in database') ||
         errorData.error?.includes('User not found') ||
         errorData.error?.includes('Unauthorized')
} 