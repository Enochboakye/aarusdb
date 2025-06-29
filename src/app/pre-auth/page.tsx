'use client'
import { useState, useEffect } from 'react'
import { collection, getDocs, } from 'firebase/firestore'
import {db} from '@/lib/firebase'

interface officer {
  fullName: string;
  serviceNumber: string;
  rank: string
}

export default function VerifyOfficer({onVerified}:{onVerified: () => void}) {
  const [officers, setOfficers] = useState<officer[]>([])
  const [serviceNumber, setServiceNumber] = useState('')
  const [fullName, setFullName] = useState('')
  const [rank , setRank] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(()=>{
    const fetchOfficers = async () => {
      try{
        const snapshot = await getDocs(collection(db, 'preauth'))
        const data = snapshot.docs.map(doc => doc.data() as officer)
        setOfficers(data)
      }catch(err){
        console.error('Error fetching officers:', err);
        setError('Error fetching officers. Please try again.')
      }
    }
    fetchOfficers()
  },[])

  const handleVerification = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    
      const matched = officers.find(officer => officer.serviceNumber === serviceNumber.trim() && officer.fullName === fullName.trim() && officer.rank === rank)
      if(matched){
        alert(` Oficcer ${matched.fullName}, You are verified`)
        sessionStorage.setItem('verified', 'true')
        onVerified()
  
      }  else{
        alert("error verifying")
        setError('Verification failed. Please try again.')
      }
      
      setLoading(false)
    }
  

  return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div>
          <h2 className="text-center text-3xl font-extrabold text-gray-900">
            Ghana Police - Officer Verification
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleVerification}>
          <div>
            <label htmlFor="serviceNumber" className="block text-sm font-medium text-gray-700">
              Service Number
            </label>
            <input
              id="serviceNumber"
              name="serviceNumber"
              type="text"
              required
              value={serviceNumber}
              onChange={(e) => setServiceNumber(e.target.value)}
              className="mt-1 relative block w-full px-3 py-2 border border-gray-300 rounded-md text-black"
              placeholder="Enter your service number"
            />
          </div>
          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
              Full Name
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="mt-1 relative block w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter your full name"
            />
          </div>

          <div>
            <label htmlFor="rank" className="block text-sm font-medium text-gray-700">
              Rank
            </label>
            <input
              id="rank"
              name="rank"
              type="text"
              required
              value={rank}
              onChange={(e) => setRank(e.target.value)}
              className="mt-1 relative block w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter your Rank"
            />
          </div>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Verify Officer'}
          </button>
        </form>
      </div>
    </div>
  )
}