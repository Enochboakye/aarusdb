'use client'
import { useState } from 'react'
import { collection, setDoc, doc } from 'firebase/firestore'
import {db} from '@/lib/firebase'

interface officer {
  fullName: string;
  serviceNumber: string;
  rank: string
}

export default function AddOficer() {
  const [data, setData] = useState<officer>({
    fullName: '',
    serviceNumber: '',
    rank: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  
    const handleInput = (e:React.ChangeEvent<HTMLInputElement>
    )=>{
      const {name, value}= e.target;
      setData((prevData)=>({...prevData, [name]: value}));
    };
  

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try{ 
    await setDoc(doc(collection(db, 'preauth')), {
        fullName:data.fullName,
        serviceNumber:data.serviceNumber,
        rank:data.rank,
    })
    setTimeout(()=>{
        window.location.reload()
    },3000)

    }catch(err) {
      console.error('Error adding officer:', err);
      setError('Error adding officer. Please try again.')
    }
      
      setLoading(false)
    }
  

  return (
    <div className=" flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <h2 className="text-[#3490f3]">Add Officer Details</h2>
          <div>
            <label htmlFor="serviceNumber" className="block text-sm font-medium text-gray-700">
              Service Number
            </label>
            <input
              id="serviceNumber"
              name="serviceNumber"
              type="text"
              required
              value={data.serviceNumber}
              onChange={handleInput}
              className="mt-1 relative block w-full px-3 py-2 border border-gray-300 rounded-md"
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
              value={data.fullName}
              onChange={handleInput}
              className="mt-1 relative block w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Enter Officer full name"
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
              value={data.rank}
              onChange={handleInput}
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
            {loading ? 'Adding...' : 'Add Officer'}
          </button>
        </form>
      </div>
    </div>
  )
}