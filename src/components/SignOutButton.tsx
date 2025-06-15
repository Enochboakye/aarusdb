'use client'

import { useClerk } from '@clerk/nextjs'

export const SignOutButton = () => {
  const { signOut } = useClerk()

  return (
    // Clicking this button signs out a user
    // and redirects them to the home page "/".
    <button className="bg-red-600 text-white rounded-full" onClick={() => signOut({ redirectUrl: '/sign-in' })}>Sign out</button>
  )
}