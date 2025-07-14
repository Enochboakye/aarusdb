"use client"
import React from 'react'
import {ModeToggle} from '@/components/ui/mode-toggle'
import {SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import {useRouter} from 'next/navigation'
import {ArrowBigLeft, ArrowBigRight} from 'lucide-react'

import {
  UserButton,
} from '@clerk/nextjs'
const Topbar = () => {

  const router = useRouter();
  
  return (
    <div className='flex justify-between items-center p-4  shadow-md w-4xl fixed top-1 mb-4  bg-gray-400'>
      <div className=" flex items-center space-x-4">
        <SidebarTrigger />
        <ModeToggle/>
        <Button onClick={()=> router.back()}>
          <ArrowBigLeft/>
        </Button>
         
      </div>
      <div><h1 className='text-2xl font-bold text-indigo-900 text-shadow-2xs text-shadow-sky-300'>ANTI ARMED ROBBERY UNIT (C.I.D HQRS)</h1></div>
      <div className="flex items-center gap-8">
       <div>
        <Button onClick={()=> router.forward()}>
          <ArrowBigRight/>
        </Button>
       </div>
        <UserButton afterSignOutUrl="/sign-in" />
      </div>
      </div>
  )
}

export default Topbar