import { redirect } from 'next/navigation'
import { checkRole } from '@/utils/roles'
import { clerkClient } from '@clerk/nextjs/server'
import { removeRole, setRole, deleteUser } from '@/app/(authenticated)/admin/_actions'
import {PageContainer} from '@/components/page-container'
import { MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"



export default async function UserManagement() {
  if (!checkRole('admin')) {
    redirect('/')
  }

  const client = await clerkClient()
  
  // Fetch all users without query filtering
  const users = (await client.users.getUserList()).data

  return (
    <PageContainer className='justify-items-center items-center mt-4'>
      <p>This is the protected admin dashboard with all users displayed.</p>


      <table className="table-fixed border-spacing-2 border
       border-gray-400 dark:border-gray-500 mt-8">
        <thead>
          <tr>
            <th className="border border-gray-300 dark:border-gray-600 h-10">Name</th>
            <th className="border border-gray-300 dark:border-gray-600 h-10">Email</th>
            <th className="border border-gray-300 dark:border-gray-600 h-10">Role</th>
            <th className="border border-gray-300 dark:border-gray-600 h-10">Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td  className="border border-gray-300 h-10 p-4">
                {user.firstName} {user.lastName}
              </td>
              <td className="border border-gray-300 h-10 p-4">
                {
                  user.emailAddresses.find((email) => email.id === user.primaryEmailAddressId)
                    ?.emailAddress
                }
              </td>
              <td className=" border border-gray-300 h-10 p-4">{user.publicMetadata.role as string}</td>
              <td className=" grid grid-cols-3 border border-gray-300 h-10 p-4 gap-2">
                <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem asChild>
               <form action={removeRole} style={{ display: 'inline-block' }}>
                  <input type="hidden" value={user.id} name="id" />
                  <button type="submit" className="bg-blue-600 rounded-md h-10 text-sm">Remove Role</button>
                </form>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <form action={setRole} style={{ display: 'inline-block', marginRight: '8px' }}>
                  <input type="hidden" value={user.id} name="id" />
                  <input type="hidden" value="admin" name="role" />
                  <button type="submit" className="bg-pink-600 rounded-md h-10 text-sm">Make Admin</button>
                </form>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                 <form action={deleteUser} style={{ display: 'inline-block' }}>
                     <input type="hidden" value={user.id} name="id" />
                    <button type="submit"  className="bg-red-00 rounded-md h-10 text-sm">
                     Delete User
                 </button>
                </form>
              </DropdownMenuItem>
              {/* Delete DropdownMenuItem and AlertDialogTrigger removed */}
            </DropdownMenuContent>
          </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </PageContainer>
  )
}