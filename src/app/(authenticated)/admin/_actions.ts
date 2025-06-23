'use server'

import { checkRole } from '@/utils/roles'
import { clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export async function setRole(formData: FormData) {
  const client = await clerkClient()

  // Check that the user trying to set the role is an admin
  if (!checkRole('admin')) {
    redirect('/')
  }

  try {
    await client.users.updateUserMetadata(formData.get('id') as string, {
      publicMetadata: { role: formData.get('role') },
    })
  } catch (err) {
    console.error('Error setting role:', err)
  }
}

export async function removeRole(formData: FormData) {
  const client = await clerkClient()

  try {
    await client.users.updateUserMetadata(formData.get('id') as string, {
      publicMetadata: { role: null },
    })
  } catch (err) {
    console.error('Error removing role:', err)
  }
}

export async function deleteUser(formData: FormData){
  const userId = formData.get('id') as string
  const client = await clerkClient()

  try {
    await client.users.deleteUser(userId)
    return { message: 'User deleted' }
  } catch (error) {
    console.log(error)
    return { error: 'Error deleting user' }
  }
}