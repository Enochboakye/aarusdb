'use client'
import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {


  return( 
    <div className=" flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full p-8">
       <SignIn />
     </div>
    </div>
    )
}