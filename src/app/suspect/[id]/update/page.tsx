"use client"
import React, { useState, useEffect, useMemo } from 'react'
import {ImageUp, Cigarette, Wine, Mail,Phone, BriefcaseBusiness} from 'lucide-react'
import { useRouter, useParams } from 'next/navigation'
import {db, storage} from "../../../../../firebaseconfig"
import{doc, updateDoc,getDoc, } from 'firebase/firestore'
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import {toast} from 'react-toastify'

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
  custus:string;
  cell:string;
  status:string;
  investigator:string;
  height: string;
  haircolor: string;
  skintone: string;
  nickname: string;
  tattoos: string;
  mothersname: string;
  fathersname: string;

};



const Edit = () => {
const [suspect, setSuspect] = useState<suspectData[]>([]);
const router = useRouter();
const params = useParams();
const id = params?.id as string;
const [file, setFile] = useState<File | null>(null);
const [per, setPer] = useState<number | null>(null)
const [loading, setLoading] = useState(false)
const [data, setData] = useState<suspectData>({
  id: "",
  ro: "",
  img: "",
  name: "",
  dateofbirth: "",
  gender: "",
  placeofbirth: "",
  hometown: "",
  nationality: "",
  occupation: "",
  phonenumber: "",
  email: "",
  address: "",
  smoke: "",
  alcohol: "",
  tribalmark: "",
  scar: "",
  maritalstatus: "",
  custus: "",
  cell: "",
  status: "",
  investigator: "",
  height: "",
      haircolor: "",
      skintone: "",
      nickname: "",
      tattoos: "",
      mothersname: "",
      fathersname: "",
});

const filter = suspect.find((item)=> item.id === id);
if(filter){
  setData(filter);
}
console.log(id);

const docRef = useMemo(() => doc(db, "suspects", id), [id]);

useEffect(()=>{
  setLoading(true);

  const fetchData = async () => {
    const querySnapShot = await getDoc(docRef);
    if(querySnapShot.exists()){
      setData((prevData)=> ({...prevData, ...querySnapShot.data()}));
  }
  };
  
  fetchData();
  
},[docRef]);


const handleChange = (e:React.ChangeEvent<HTMLInputElement | HTMLSelectElement> )=>{
  setData({...data, [e.target.name]: e.target.value})
}

const handleSubmit = async (e:React.FormEvent)=>{
  e.preventDefault();

  try{
      setLoading(true);
      const validData = Object.fromEntries(
        Object.entries(data).filter(([, value])=> value !== '' && value !== null)
      );
      //const suspectCollection = collection(db, "suspects");
      await updateDoc(doc(db, "suspects", id), validData);
      toast.success('suspect suscessfully updated!');
      router.push("/database")
      
  }catch(err){
    console.error(err);
    toast.error('something went wrong.please try again.');
    setLoading(false)
  }
}



 useEffect(()=>{
      if(file){
        const uploadFile = ()=>{
          const name = new Date().getTime()  + file.name;
          console.log('uploading file:', name);
          const storageRef = ref(storage, file.name);
          const uploadTask = uploadBytesResumable(storageRef, file);

          uploadTask.on(
            "state_changed",
            (snapshot)=>{
              const progress: number = (snapshot.bytesTransferred/snapshot.totalBytes) *100;
              console.log('upload is ' + progress + '% done');
              setPer(progress);
              console.log(per);

              switch(snapshot.state){
                case 'paused':
                  console.log('upload is paused');
                  break;
                  case 'running':
                    console.log('upload is running');
                    break;
                    default:
                      break;
              }
            },
              (error)=>{
                console.error('upload error', error);
             },
              ()=>{
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL)=>{
                  setData((prev)=>({...prev, img: downloadURL}));
                });
              }
          );
        };
      uploadFile();
      }
    },[file, per]); 



    

  return (
    <div className="flex  mt-10 ml-40 items-center justify-center">
      <form onSubmit={handleSubmit} className='w-full'>
        <div className="flex flex-col gap-y-4">

            <div>
                <label className='block' htmlFor='ro'>
                    RO_No
                </label>
                <input type="text"
                name="ro"
                id="ro"
                value={data.ro}
                onChange={handleChange}
                className='w-full p-2 rounded-md  border-double border-2 border-gray-500'
                 />
            </div>


            <div className=' flex flex-row'>
                <label htmlFor='file'>
                    <ImageUp/>
                </label>
                <input
                type='file'
                name='file'
                id='file'
                
                onChange={(e)=> setFile(e.target && e.target.files && e.target.files[0])  }/>
                <img
                src={file?
                    URL.createObjectURL(file):data.img ||
                     "https://icon-library.com/images/no-image-icon-0.jpg"
           } alt="profile pic"
                 
               width={100}
               height={50} />
            </div>


            <div>
              <label htmlFor="name">Name: 
              <input type="text"
                name="name"
                id="name"
                placeholder=" Full Name:"
                value={data.name}
                onChange={handleChange}
                className='w-full p-2 rounded-md border-double border-2 border-gray-500  capitalize'
                 autoCapitalize="words"/>
              </label>
            </div>


            <div>
              <label htmlFor="nickname">NickName: 
              <input type="text"
                name="nickname"
                id="nickname"
                value={data.nickname}
                className='w-full p-2 rounded-md border-double border-2 border-gray-500  capitalize'
                 autoCapitalize="words"
                 onChange={handleChange}/>
              </label>
            </div>

            <div>
              <label htmlFor="dateofbirth">Date of Birth:
                <input
                type="date"
                name="dateofbirth"
                id="dateofbirth"
                value={data.dateofbirth}
                onChange={handleChange}
                className='w-full p-2 rounded-md border-double border-2 border-gray-500'
                />
              </label>
            </div>


            <div>
              <label htmlFor="gender">Gender:
               <select name="gender" id="gender" className='w-full p-2 
               rounded-md border-double border-2
                border-gray-500'
                value={data.gender}
                onChange={handleChange}
                >
                <option value=" ">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
               </select>
              </label>
            </div>

            <div>
              <label htmlFor="height">Height: 
              <input type="number"
                name="height"
                id="height"
                value={data.height}
                className='w-full p-2 rounded-md 
                border-double border-2 border-gray-500  capitalize'
                 onChange={handleChange}/>
              </label>
            </div>

            <div>
              <label htmlFor="skintone"> Skin Tone:
               <select name="skintone" id="skintone"
               onChange={handleChange} value={data.skintone}
                className='w-full p-2 rounded-md border-double
                 border-2 border-gray-500'>
                <option value="fair">Fair</option>
                <option value="dark">Dark</option>
                <option value="Light">Light</option>
                <option value="Medium">Medium</option>
                <option value="olive">Olive</option>
                <option value="Tan">Tan</option>
                <option value="Albino"> Albino</option>
               </select>
              </label>
            </div>

            
            <div>
              <label htmlFor="haircolor">Hair Color:
               <select name="haircolor" id="haircolor"
               onChange={handleChange} value={data.haircolor}
                className='w-full p-2 rounded-md
                 border-double border-2 border-gray-500'>
                <option value="black">Black</option>
                <option value="brown">Brown</option>
                <option value="blonde">Blonde</option>
                <option value="red">Red</option>
                <option value="gray">Gray</option>
                <option value="bald">Bald</option>
                <option value="mixed black & gray"> Mixed black & gray</option>
               </select>
              </label>
            </div>

            


           <div>
            <label htmlFor="placeofbirth">Place of Birth:
              <input
              type="text"
              name="placeofbirth"
              id="placeofbirth"
              value={data.placeofbirth}
              onChange={handleChange}
              className='w-full p-2 rounded-md border-double border-2 border-gray-500 capitalize'
              />
            </label>
           </div>


           <div>
            <label htmlFor="hometown">Hometown:
              <input
              type="text"
              placeholder="hometown:"
              name="hometown"
              id="hometown"
              value={data.hometown}
              onChange={handleChange}
                className='w-full p-2 rounded-md border-double border-2 border-gray-500 capitalize'
              />
            </label>
           </div>


           <div>
            <label htmlFor="nationality">Nationality:
              <input
              type="text"
              placeholder="nationality:"
              name="nationality"
              id="nationality"
              value={data.nationality}
              onChange={handleChange}
              className='w-full p-2 rounded-md border-double border-2 border-gray-500 capitalize'
              />
            </label>
           </div>


           <div>
            <label htmlFor="occupation"><BriefcaseBusiness/>
              <input
              type="text"
              placeholder="occupation:"
              name="occupation"
              id="occupation"
              value={data.occupation}
              onChange={handleChange}
              className='w-full p-2 rounded-md border-double border-2 border-gray-500 capitalize'
              />
            </label>
           </div>


           <div>
            <label htmlFor="phonenumber"><Phone/>
              <input
              type="tel"
              pattern='[0-9]{3}-[0-9]{3}-[0-9]{4}'
              placeholder="tel:"
              name="phonenumber"
              id="phonenumber"
              value={data.phonenumber}
              onChange={handleChange}
              className='w-full p-2 rounded-md border-double border-2 border-gray-500'
              />
            </label>
           </div>


           <div>
            <label htmlFor="email"><Mail/>
              <input
              type="email"
              size={30}
              placeholder="email:"
              name="email"
              id="email"
              value={data.email}
              onChange={handleChange}
              className='w-full p-2 rounded-md border-double border-2 border-gray-500 lowercase'
              />
            </label>
           </div>


            <p className="text-xl">Behavior Characteristics:</p>
           <div className=' flex flex-row w-full p-2 rounded-md
            border-double border-2 border-gray-500 gap-20 items-center
             justify-center'>
            <label htmlFor="smoke"><Cigarette/>
            <span>Yes</span>
              <input
              type="radio"
              value={"Yes"}
              className="size-6"
              name="smoke"
              id="smoke"
              checked={data.smoke=== "Yes"}
              onChange={handleChange}
              />

              <span className="ml-2">No</span>
              <input
              type="radio"
              value={"No"}
              name="smoke"
              id="smoke"
              checked={data.smoke=== "No"}
              onChange={handleChange}
              className="size-6 mr-20"
              />
            </label>

            <label htmlFor="alcohol"><Wine/>

            <span>Yes</span>
              <input
              type="radio"
              value={"Yes"}
              className='size-6'
              name="alcohol"
              id="alcohol"
              checked={data.alcohol === "Yes"}
              onChange={handleChange}
              />

              <span className="ml-2">No</span>
              <input
              type="radio"
              value={"No"}
              className="size-6"
              name="alcohol"
              id="alcohol"
              checked={data.alcohol === "No"}
              onChange={handleChange}
              /> 
                 </label>
           </div>


           <p className="text-xl">Peculiar Marks:</p>
           <div className=' flex flex-row w-full p-2 rounded-md
             border-double border-2 
             gap-20 items-center justify-center'>
            <label htmlFor="tribalmark" className='text-lg'>Tribal?:
              <span>Yes</span>
              <input
              type="radio"
              value={"Yes"}
              name="tribalmark"
              id='tribalmark'
              checked={data.tribalmark === "Yes"}
              onChange={handleChange}
              className="size-6"/>

              <span>No</span>
              <input
              type="radio"
              value={"No"}
              id='tribalmark'
              name="tribalmark"
              checked={data.tribalmark === "No"}
              onChange={handleChange}
              className="size-6"/>
            </label>

            <label htmlFor="scar" className='text-lg'>scar?:
              <span>Yes</span>
              <input
              type="radio"
              name="scar"
              value={"yes"}
              id='scar'
              checked={data.scar === "yes"}
              onChange={handleChange}
              className='size-6'/>

              <span>No</span>
              <input
              type="radio"
              name="scar"
              value={"No"}
              id='scar'
              checked={data.scar === "No"}
              onChange={handleChange}
              className='size-6'/>

            </label>
           </div>

           <div className=' flex flex-row w-full p-2 rounded-md
                  border-double border-2
                   items-center justify-center'>
                    
                <label htmlFor="tattoos"> Tattoos?:
                 <span>Yes</span>
              <input type="radio"
              name="tattoos"
              id="tattoos"
              value={"Yes"}
              className="size-6"
              checked={data.tattoos === "Yes"}
              onChange = {handleChange}
              />
              <input/>

                  <span>No</span>
              <input
              type="radio"
              name="tattoos"
              id="tattoos"
              value={"No"}
              className= "size-6"
              onChange = {handleChange}
              checked={data.tattoos === "No"}
              />
              </label>
                  </div>



           <div>
            <label htmlFor="maritalstatus">Marital Status:
              <select name="maritalstatus" id="maritalstatus"
              value={data.maritalstatus}
              onChange={handleChange}
               className='w-full p-2 rounded-md
                border-double border-2 border-gray-500'>
                  <option value="">Select Status</option>
                  <option value="married">Married</option>
                  <option value="single">Single</option>
                  <option value="divorced">Divorced</option>
              </select>
            </label>
           </div>

           <div>
            <label htmlFor="custus">Custody Status:
              <select name="custus" id="custus"
              value={data.custus}
              onChange={handleChange}
               className='w-full p-2 rounded-md
                border-double border-2 border-gray-500'>
                  <option value="">Select Status</option>
                  <option value="on bail">On Bail</option>
                  <option value="in police custody">In Police Custody</option>
                  <option value="in prison custody">In Prison Custody</option>
              </select>
            </label>
           </div>


           <div>
             <label htmlFor="cell">Cell
               <input
                type="text"
                size={30}
                placeholder="cell:"
                name="cell"
                id="cell"
                value={data.cell}
                onChange={handleChange}
                className='w-full p-2 rounded-md
                 border-double border-2 border-gray-500 lowercase'
                         />
               </label>
             </div>

             <div>
                                  <label htmlFor="fathersname">Father
                                    <input
                                    type="text"
                                    value={data.fathersname}
                                    name="fathersname"
                                    id="fathersname"
                                    onChange={handleChange}
                                    className='w-full p-2 rounded-md
                                     border-double border-2 border-gray-500 
                                     capitalize'
                                    />
                                  </label>
                                 </div>

             <div>
              <label htmlFor="mothersname">Mother
              <input
              type="text"
              value={data.mothersname}
              name="mothersname"
              id="mothersname"
              onChange={handleChange}
              className='w-full p-2 rounded-md
               border-double border-2 border-gray-500 capitalize'
                          />
            </label>
          </div>


         <div>
          <label htmlFor="investigator">Investigator i/c Case:
             <input
              type="text"
              size={30}
              placeholder="name of investigator:"
              name="investigator"
              id="investigator"
              value={data.investigator}
              onChange={handleChange}
              className='w-full p-2 rounded-md
               border-double border-2 border-gray-500
                capitalize'
                  />
            </label>
         </div>


           <div>
            <button className="group mt-4 p-[4px]
             rounded-[12px] bg-gradient-to-b
              from-white to-stone-200/40
               shadow-[0_2px_4px_rgba(0,0,0,0.5)] 
               active:shadow-[0_1px_2px_rgba(0,0,0,0.5)]
                active:scale-[0.995]" 
               type='submit'>Submit</button>
           </div><br/>

        </div>
      </form>
    </div>
  )
}

export default Edit
