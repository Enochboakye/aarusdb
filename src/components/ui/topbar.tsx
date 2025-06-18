import React from 'react'
import {Bell, Share, Settings} from 'lucide-react'
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
      <div className="flex items-center gap-8">
        <Bell />
        <Share />
        <Settings />
        <UserButton afterSignOutUrl="/sign-in" />
      </div>
      </div>
  )
}

export default Topbar