"use client"
import React from 'react'
import {useEffect, useState} from 'react'
import VerifyOfficer from '@/app/pre-auth/page'
import { usePathname } from 'next/navigation'

const VerifyAuthProvider = ({children}:{children: React.ReactNode}) => {
    const pathname = usePathname()
    const [isVerified, setIsVerified] = useState<boolean| null>(null)

    useEffect(()=>{
        const checkVerifcation = ()=> {
            if(typeof window !== 'undefined'){
                const verified = sessionStorage.getItem('verified') === 'true'
                setIsVerified(verified)
        }
    }

    setTimeout(checkVerifcation, 50)
},[pathname])
    
if(isVerified === null) return <div className='p-4'>Checking Credentials...</div>

if(!isVerified) return <VerifyOfficer onVerified={() => setIsVerified(true)}/>

  return (
    <>{children}</>
  )
}

export default VerifyAuthProvider