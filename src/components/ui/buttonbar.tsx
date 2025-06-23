"use client"
import React, {useState} from 'react'
import { 
    Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,

 } from '@/components/ui/dialog'
 import{CirclePlus, CircleX, ChartBar} from 'lucide-react'
 import AddOfficer from '@/components/addofficer'
import {useRouter} from 'next/navigation' 

const ButtonBar = () => {
    const [open, setOpen] = useState(false);
    const router = useRouter();

    const handleModal = ()=> {
        setOpen(true);
    }

      return (
    <>  
<div className=" w-full flex h-full justify-center items-center">
  <div className="flex h-20 gap-x-10 rounded-xl bg-white px-4 py-1 items-center">
    <button
      className="transition-all duration-300 hover:scale-125
       flex h-10 !w-28 items-center justify-center rounded-md
        border border-[#3490f340] bg-[#e3ecf4] text-[#3490f3] 
        shadow-[0px_1px_4px] hover:shadow-[0px_4px_10px]"
        onClick={handleModal}
    >
      <CirclePlus/>
      Add New Officer
    </button>
    {open && (
        <Dialog open={open} onOpenChange={setOpen}>
        <DialogTitle>ADD OFFICER DETAILS</DialogTitle>
            <DialogContent>
                <AddOfficer/>
                <DialogFooter>
                     <button
      className="transition-all duration-300
       hover:scale-125 flex h-10 !w-20 items-center
        justify-center rounded-md border border-[#3490f340]
         bg-[#e3ecf4] text-red-500 shadow-[0px_1px_4px]
          hover:shadow-[0px_4px_10px]"
          onClick={() => setOpen(false)}
    >
      <CircleX/> Cancel
    </button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )}

   

    <button
      className="transition-all duration-300
       hover:scale-125 flex h-10 !w-30 items-center
        justify-center rounded-md border border-[#3490f340]
         bg-[#e3ecf4] text-[#3490f3] shadow-[0px_1px_4px] 
         hover:shadow-[0px_4px_10px]"
      onClick={()=>router.push('/admin/anual-report')}
        
    >
    <ChartBar/> Get Anual Report
    </button>
   

    <button
      className="transition-all duration-300 hover:scale-125 flex h-10 !w-10 items-center justify-center rounded-md border border-[#3490f340] bg-[#e3ecf4] text-[#3490f3] shadow-[0px_1px_4px] hover:shadow-[0px_4px_10px]"
    >
      
    </button>
  </div>
</div>

    </>

  )
}

export default ButtonBar