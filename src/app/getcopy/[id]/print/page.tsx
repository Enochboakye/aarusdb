"use client"
import * as React from 'react';
import { useEffect, useRef, useState } from "react";
import {
  getDoc,
  doc
} from "firebase/firestore";
import { db } from "../../../../../firebaseconfig";
import {useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import Date from '@/components/ui/date'
import {useReactToPrint} from 'react-to-print'


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
  cell: string;
  investigator: string;
  height: string;
  haircolor: string;
  skintone: string;
  nickname: string;
  tattoos: string;
  mothersname: string;
  fathersname: string;
};

const Print = () => {
  const [suspect, setSuspect] = useState<suspectData[]>([]);
  const [data, setData] = useState<suspectData>({
    id: '',
    ro: '',
    img: '',
    name: '',
    dateofbirth: '',
    gender: '',
    placeofbirth: '',
    hometown: '',
    nationality: '',
    occupation: '',
    phonenumber: '',
    email: '',
    address: '',
    smoke: '',
    alcohol: '',
    tribalmark: '',
    scar: '',
    maritalstatus: '',
    custus: '',
  cell: '',
  investigator:'',
  height: '',
  haircolor: '',
  skintone: '',
  nickname: '',
  tattoos: '',
  mothersname: '',
  fathersname: ''
  });
  const [loading, setLoading] = useState(false);
  const params = useParams();
  const id = params?.id as string;
  const contentRef = useRef<HTMLDivElement>(null);
  const reactToPrintFn = useReactToPrint({contentRef});

  
const filter = suspect.find((item)=> item.id === id);
if(filter){
  setData(filter);
}
console.log(id);

const docRef = doc(db, "suspects", id);
  

  useEffect(() => {
  
      setLoading(true);
      
          const fetchData = async () => {
            const querySnapShot = await getDoc(docRef);
            if (querySnapShot.exists()) {
              setData(querySnapShot.data() as suspectData);
            }
          };
          fetchData();
  }, [docRef]);
  

  return (
    <>
    <Button onClick={()=> reactToPrintFn()}>
      Print Copy
    </Button><br/>
    <div ref={contentRef} className=" mt-10 ml-20 items-center justify-center shadow-md p-10">
    <h1 className="text-3xl font-bold mt-2 ml-40">PROFILE OF SUSPECT</h1>
      <Date/>
      <br/>
      <div className="grid grid-cols-2 gap-5 items-center justify-center flex-row mt-4">
        <p className="float-left shadow-md mt-2 font-extrabold border-2 w-28">R.O: {data.ro}</p>
       <p className="float-right shadow-md mt-2 font-extrabold border-2 w-28">Gender: {data.gender}</p>
      </div>
      <div className="grid grid-cols-2 gap-5 items-center justify-center flex-row mt-4">
           <img className="shadow-md float-right"
                  src={data.img}
                  width={100}
                  height={100}
                  alt="profile pic"
                  />
      </div>

      <div className="grid grid-cols-2 gap-5 items-center justify-center flex-row mt-4">
        <p className="shadow-md font-extrabold">Name: {data.name}</p>
        <p className="shadow-md font-extrabold">Nickname: {data.nickname}</p>
      </div>

      <div className="grid grid-cols-2 gap-5 items-center justify-center flex-row mt-4">
        <p className="shadow-md font-extrabold">Place of birth: {data.placeofbirth}</p>
        <p className="shadow-md font-extrabold">Date of Birth: {data.dateofbirth}</p>
      </div>

      <div className="grid grid-cols-2 gap-5 items-center justify-center flex-row mt-4">
        <p className="shadow-md font-extrabold">Nationality: {data.nationality}</p>
        <p className="shadow-md font-extrabold">Hometown: {data.hometown}</p>
      </div>

      <div className="grid grid-cols-2 gap-5 items-center justify-center flex-row mt-4">
        <p className="shadow-md font-extrabold">Height: {data.height}</p>
        <p className="shadow-md font-extrabold">Hair Color: {data.haircolor}</p>
      </div>

      <div className="grid grid-cols-2 gap-5 items-center justify-center flex-row mt-4">
        <p className="shadow-md font-extrabold">Skin Tone: {data.skintone}</p>
        <p className="shadow-md font-extrabold">Occupation: {data.occupation}</p>
      </div>

      <div className="grid grid-cols-2 gap-5 items-center justify-center flex-row mt-4">
        <p className="shadow-md font-extrabold">Phone number: {data.phonenumber}</p>
        <p className="shadow-md font-extrabold">Email Address: {data.email}</p>
      </div>

      <div className="grid grid-cols-2 gap-5 items-center justify-center flex-row mt-4">
        <p className="shadow-md font-extrabold">Residential Address: {data.address}</p>
        <p className="float-left shadow-md mt-2 font-extrabold border-2 ">Marital Status: {data.maritalstatus}</p>
      </div>

        <div className="grid grid-cols-2 gap-5 items-center justify-center flex-row mt-4">
        <p className="shadow-md font-extrabold">Smoke: {data.smoke}</p>
        <p className="shadow-md font-extrabold">Alcohol: {data.alcohol}</p>
      </div>

      <div className="grid grid-cols-2 gap-5 items-center justify-center flex-row mt-4">
        <p className="shadow-md font-extrabold">Tribal Mark: {data.tribalmark}</p>
        <p className="shadow-md font-extrabold">Scar: {data.scar}</p>
      </div>

      <div className="grid grid-cols-2 gap-5 items-center justify-center flex-row mt-4">
        <p className="shadow-md font-extrabold">Tattoos: {data.tattoos}</p>
      </div>

      <div className="grid grid-cols-2 gap-5 items-center justify-center flex-row mt-4">
        <p className="shadow-md font-extrabold">Father&apos;s Name: {data.fathersname}</p>
        <p className="shadow-md font-extrabold">Mother&apos;s Name: {data.mothersname}</p>
      </div>

      <div className="grid grid-cols-2 gap-5 items-center justify-center flex-row mt-14">
        <p className="shadow-md font-extrabold">Signature of Case Officer:</p>
        <p className="shadow-md font-extrabold">Signature of Suspect/Accused</p>
      </div>
      
      <div className="grid grid-cols-2 gap-5 items-center justify-center flex-row mt-14">
        <p className="shadow-md font-extrabold">Signature of Station Officer:</p>
      </div>
      
    </div>
    </>
  )
}

export default Print;