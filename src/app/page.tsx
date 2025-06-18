"use client"
import Splash from "@/components/ui/welcome-message";
import { useEffect } from "react";
import { redirect } from "next/navigation";
import Image from 'next/image'


export default function Home() {



  useEffect(() => {
    // Simulate a loading state
    const timer = setTimeout(() => {
      // Redirect to dashboard after 3 seconds
      redirect('/dashboard');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="justify-items-center items-center">
      <Image
        src="/aaru-logo.png"
        alt="AarusDB Logo"
        width={200}
        height={200}
        className="mx-auto mb-4 rounded-full"/>
      <Splash />
      <p className="text-2xl font-extra-bold
       text-gpink-600 mt-4">Loading....</p>
    </div>
    
  )
}
