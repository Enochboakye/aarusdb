import { useUser } from '@clerk/clerk-react'

export default function Example() {
    const { isSignedIn, user, isLoaded } = useUser()
  
    if (!isLoaded) {
      return <div>Loading...</div>
    }
  
    if (!isSignedIn) {
      return <div>Sign in to view this page</div>
    }
  
    return <div>Hello {user.firstName}!</div>
  }