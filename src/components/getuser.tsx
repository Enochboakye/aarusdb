

import { SearchUsers } from '@/components/SearchUsers'
import { clerkClient } from '@clerk/nextjs/server'
import { removeRole, setRole } from '@/app/(authenticated)/admin/_actions'
export default async function GetUsers(params: {
  searchParams: Promise<{ search?: string }>
}){

    
  const query = (await params.searchParams).search

  const client = await clerkClient()

  const users = query ? (await client.users.getUserList({ query })).data : []

  return(
    <>
      <SearchUsers />

      {users.map((user) => {
        return (
          <div key={user.id} className='border-4 border-sky-500'>
            <div>
              {user.firstName} {user.lastName}
            </div>

            <div>
              {
                user.emailAddresses.find((email) => email.id === user.primaryEmailAddressId)
                  ?.emailAddress
              }
            </div>

            <div>{user.publicMetadata.role as string}</div>

            <form action={setRole}>
              <input type="hidden" value={user.id} name="id" />
              <input type="hidden" value="admin" name="role" />
              <button type="submit" className="bg-green-500 rounded-md mb-2">Make Admin</button>
            </form>

            <form action={setRole}>
              <input type="hidden" value={user.id} name="id" />
              <input type="hidden" value="moderator" name="role" />
              <button type="submit" className="bg-sky-500 rounded-md">Make Moderator</button>
            </form>

            <form action={removeRole}>
              <input type="hidden" value={user.id} name="id" />
              <button type="submit" className='bg-red-600 rounded-md shadow-yellow shadow-md'>Remove Role</button>
            </form>
          </div>
        )
      })}
    </>
  )

}
