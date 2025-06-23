'use client'

import { Button } from "@/components/ui/button"

import { usePathname, useRouter } from 'next/navigation'

export const SearchUsers = () => {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          const form = e.currentTarget
          const formData = new FormData(form)
          const queryTerm = formData.get('search') as string
          router.push(pathname + '?search=' + queryTerm)
        }} className=" grid grid-cols-2 shadow-md rounde-md"
      >
        <input id="search" name="search" type="text" 
        className="mt-4 relative block w-full px-3 py-2 border
         border-gray-300 rounded-md" placeholder='Search for users' />
         
        <Button type="submit" className="rounded-md">Submit</Button>
        
      </form>
    </div>
  )
}