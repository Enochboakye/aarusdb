"use client"
import React from 'react'
import {ModeToggle} from '@/components/ui/mode-toggle'
import {SidebarTrigger } from "@/components/ui/sidebar"

import {
  UserButton,
} from '@clerk/nextjs'
const Topbar = () => {
  
  return (
    <div className='flex justify-between items-center p-4  shadow-md w-4xl fixed top-1'>
      <div className=" flex items-center space-x-4">
        <SidebarTrigger />
        <ModeToggle/>
         
      </div>
      <div><h1 className='text-2xl font-bold text-blue-700 text-shadow-2xs text-shadow-sky-300'>ANTI ARMED ROBBERY UNIT (C.I.D HQRS)</h1></div>
      <div className="flex items-center gap-8">
       
        <UserButton afterSignOutUrl="/sign-in" />
      </div>
      </div>
  )
}

export default Topbar