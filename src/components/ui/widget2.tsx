"use client"
import * as React from 'react'
import { useEffect, useState } from "react";
import {
    collection,
    getDocs  
} from "firebase/firestore";
import {db,} from "../../../firebaseconfig"

interface  suspectData {
  // define the shape of the suspectData object here
  id: string;
  ro: string;
  img: string;
  name:string,
  dateofbirth:string;
  gender:string;
  placeofbirth:string;
  hometown: string;
  nationality: string;
  occupation: string;
  phonenumber: string;
  email: string;
  address: string;
  smoke: string;
  alcohol: string;
  tribalmark: string;
  scar: string;
  maritalstatus: string;
  custus: string;
};




const  Widget2 = () => {

    const [suspect, setSuspect] = useState<suspectData[]>([]);
    const [loading, setLoading]= useState(false);

    useEffect(()=>{
      setLoading(true); 
      const fetchData = async () =>{
        const list: suspectData[] = [];
        try {
          const querySnapShot = await getDocs(collection(db, "suspects"));
          querySnapShot.forEach((doc) => {
            list.push({ id: doc.id, ...doc.data() } as suspectData);
          });
          setSuspect(list);
          console.log(list);
          setLoading(false);
        } catch(err) {
            console.log(err)
        }
      };
      fetchData();
    }, []);

    const getInPolCount = suspect.filter(s=> s.custus && s.custus.toLowerCase().includes("in police custody")).length;
    const getPrisonCount  = suspect.filter(s => s.custus && s.custus.toLowerCase().includes("in prison custody")).length;
 const getBailCount = suspect.filter(s => s.custus && s.custus.toLowerCase().includes("on bail")).length;
    return(
        <div className=" flex w-52 p-3 justify-between
         shadow-md shadow-orange-600 h-32 rounded-md">
           <div className="float-left">
            <span className="text-extrabold text-xl">CUSTODY</span><br/>
            <span className="text-rose-600 text-xl">Police: {getInPolCount}</span><br/>
            <span className="text-pink-500 text-xl">Prisons: {getPrisonCount}</span><br/>
            <span className=" text-green-500 text-xl">Bail: {getBailCount}</span>
            </div> 
        </div>
    )
}

export default Widget2