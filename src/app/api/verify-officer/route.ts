import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/firebase'
import {collection, query, where, getDocs } from 'firebase/firestore'




export async function POST(request: NextRequest) {
  try {
    const { serviceNumber, fullName } = await request.json()

    // Query Firebase for officer verification
    const officersRef = collection(db, 'preauth')
    const q = query(
      officersRef, 
      where('serviceNumber', '==', serviceNumber),
      where('fullName', '==', fullName)
    )
    
    const querySnapshot = await getDocs(q)
    const verified = !querySnapshot.empty

    return NextResponse.json({ verified })
  } catch {
    return NextResponse.json({ verified: false, error: 'Verification failed' }, { status: 500 })
  }
}