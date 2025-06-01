"use client"
import React, { useState, useEffect, ChangeEvent,FormEvent, useRef } from 'react'
import { Cigarette, Wine, Mail,Phone, BriefcaseBusiness} from 'lucide-react'
import {db, storage} from "../../../firebaseconfig"
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import {toast} from 'react-toastify'
import { collection, setDoc, serverTimestamp,doc} from "firebase/firestore"; 
import Webcam from 'react-webcam'
import Image from 'next/image'

interface  suspectData {
  // define the shape of the suspectData object here
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
  investigator:string;
  height: string;
  haircolor: string;
  skintone: string;
  nickname: string;
  tattoos: string;
  mothersname: string;
  fathersname: string;
};


const Form = () => {
    const [image, setImage] = useState<string | null>(null);
    const [per, setPer] = useState<number | null>(null);
    const webcamRef = useRef<Webcam>(null)
    const [data,setData] = useState<suspectData>({
      ro: "",
      img: "",
      name: "",
      dateofbirth:"",
      gender: "",
      placeofbirth: "",
      hometown: "",
      nationality: "",
      occupation: "",
      phonenumber:"",
      email:"",
      address:"",
      smoke:"",
      alcohol:"",
      tribalmark:"",
      scar:"",
      maritalstatus:"",
      custus: "",
      cell: "",
      investigator: "",
      height: "",
      haircolor: "",
      skintone: "",
      nickname: "",
      tattoos: "",
      mothersname: "",
      fathersname: "",
    });
    const [error, setError] = useState<string[]>([]);
    const [isCameraOpen, setIsCameraOpen] = useState(false);



    

    const OpenCamera = () => {
      setIsCameraOpen(true);
    };

    const capture = async ()=> {
      if(webcamRef.current) {
        const imageSrc = webcamRef.current.getScreenshot();
        if(imageSrc){
          setImage(imageSrc);

          setIsCameraOpen(false);
        }
      }
    };

    useEffect(()=>{
      if(image){
        const uploadImage  = async () =>{
        const response = await fetch(image);
        const blob = await response.blob();
        const fileName = `webcam_${new Date().getTime()}.jpg`;
        const storageRef = ref(storage, fileName);
        const uploadTask = uploadBytesResumable(storageRef, blob);

        uploadTask.on("state_changed", (snapshot) => {
          const progress = (snapshot.bytesTransferred/ snapshot.totalBytes) * 100;

          setPer(progress);
        },
        (error) => {
          console.error("upload error",error);
          toast.error("Image upload failde");
          
        },  async ()=> {
            const downloadURL  = await getDownloadURL(uploadTask.snapshot.ref);
            setData((prev)=> ({...prev, img:downloadURL}));
            toast.success("Image uploaded successfully");
        }
      );
                  };
                uploadImage();
                }
              }, [image]);



    const handleInput = (e:ChangeEvent<HTMLInputElement |HTMLSelectElement>
    )=>{
      const {name, value}= e.target;
      setData((prevData)=>({...prevData, [name]: value}));
    };

    const handleSubmit = async (e:FormEvent<HTMLFormElement>)=>{
      e.preventDefault();
      try{
          await setDoc(doc(collection(db,'suspects')), {
            ro:data.ro,
            name:data.name,
            img:data.img,
            dateofbirth:data.dateofbirth,
            gender:data.gender,
            placeofbirth:data.placeofbirth,
            hometown:data.hometown,
            occupation:data.occupation,
            phonenumber:data.phonenumber,
            email:data.email,
            address:data.address,
            smoke:data.smoke,
            alcohol:data.alcohol,
            tribalmark:data.tribalmark,
            scar:data.scar,
            maritalstatus:data.maritalstatus,
            custus:data.custus,
            cell:data.cell,
            investigator:data.investigator,
            height:data.height,
            haircolor:data.haircolor,
            skintone:data.skintone,
            nickname:data.nickname,
            mothersname:data.mothersname,
            fathersname:data.fathersname,
            tattoos:data.tattoos,
            timeStamp: serverTimestamp()
          });
          toast.success('suspect suscessfully added!');
      
          setTimeout(() => {
            window.location.reload();
          },3000);
          
        }catch (err){
          console.error('Error submitting data:',err);
          toast.error('something went wrong.please try again.');
        }
    };
    
  
  return (
    <div className="flex  mt-10 ml-10 items-center justify-center shadow-md">
      
      {error.length > 0 && (
        <div>
          <ul>
            {error.map((err, idx)=>(
              <li key={idx} className="text-red-700">
                {err}
              </li>
            ))}
          </ul>
        </div>
      )}

      <br/>
      

      <form className='w-full' onSubmit={handleSubmit}>
      <br/>
        <h1 className="text-3xl font-bold shadow-md text-wine-500 ml-10">  Suspect Profile Form</h1>
        <br/>
        <div className="flex flex-col gap-y-4">
    
           <div>
                <label className='block' htmlFor='ro'>
                    RO_No
                </label>
                <input type="text"
                name="ro"
                id="ro"
                placeholder="12/2025"
                onChange={handleInput}
                required
                className='w-full p-2 rounded-md  border-double border-2 border-gray-500'
                 />
            </div>

                {!isCameraOpen && (
                  <button className="bg-blue-600
                   text-white w-40 h-10
                    rounded-md" onClick={OpenCamera}>Open Camera</button>
                )}

           {isCameraOpen && ( <div className=' flex flex-row'>
                <Webcam 
                ref={webcamRef}
                screenshotFormat = "image/jpeg"
                width = {150} height={100}
                />
                <button type="button" onClick={capture}
                className="mt-2 bg-blue-500
                 text-white p-2 rounded h-20">capture</button>

          </div>)}

          <div>
                    {image && (
                        <Image src={image} alt="captured" width={150} height={70} className="mt-2"/>
                    )}
            </div>


            <div>
              <label htmlFor="name">Name: 
              <input type="text"
                name="name"
                id="name"
                placeholder=" Full Name:"
                className='w-full p-2 rounded-md  border-double border-2 border-gray-500  capitalize'
                 autoCapitalize="words"
                 onChange={handleInput}/>
              </label>
            </div>


            <div>
              <label htmlFor="nickname">NickName: 
              <input type="text"
                name="nickname"
                id="nickname"
                placeholder=" NickName:"
                className='w-full p-2 rounded-md  border-double border-2 border-gray-500  capitalize'
                 autoCapitalize="words"
                 onChange={handleInput}/>
              </label>
            </div>

            <div>
              <label htmlFor="height">Height: 
              <input type="number"
                name="height"
                id="height"
                placeholder="Enter Height in Metres:"
                className='w-full p-2 rounded-md  
                border-double border-2 border-gray-500  capitalize'
                 onChange={handleInput} required/>
              </label>
            </div>


            <div>
              <label htmlFor="dateofbirth">Date of Birth:
                <input
                type="date"
                name="dateofbirth"
                id="dateofbirth"
                onChange={handleInput}
                className='w-full p-2 rounded-md  border-double border-2 border-gray-500'
                />
              </label>
            </div>


            <div>
              <label htmlFor="gender">Gender:
               <select name="gender" id="gender"
               onChange={handleInput}
                className='w-full p-2 rounded-md 
                 border-double border-2 border-gray-500' required>
                <option value=" ">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
               </select>
              </label>
            </div>


            <div>
              <label htmlFor="haircolor">Hair Color:
               <select name="haircolor" id="haircolor"
               onChange={handleInput} required
                className='w-full p-2 rounded-md  border-double border-2 border-gray-500'>
                <option value=" ">Select Hair Color</option>
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
              <label htmlFor="skintone"> Skin Tone:
               <select name="skintone" id="skintone"
               onChange={handleInput} required
                className='w-full p-2 rounded-md border-double border-2 border-gray-500'>
                <option value=" ">Select Skin Tone</option>
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
            <label htmlFor="placeofbirth">Place of Birth:
              <input
              type="text"
              placeholder="place of birth:"
              name="placeofbirth"
              id="placeofbirth"
              onChange={handleInput}
              className='w-full p-2 rounded-md  border-double border-2 border-gray-500 capitalize'
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
              onChange={handleInput}
                className='w-full p-2 rounded-md  border-double border-2 border-gray-500 capitalize'
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
              className='w-full p-2 rounded-md  border-double border-2 border-gray-500 capitalize'
             onChange={handleInput} />
            </label>
           </div>

           <div>
            <label htmlFor="address">Residential Address:
              <input
              type="text"
              placeholder="Residential Address"
              name="address"
              id="address"
              onChange={handleInput}
              className='w-full p-2 rounded-md  border-double border-2 border-gray-500 capitalize'/>
            </label>
           </div>


           <div>
            <label htmlFor="occupation"><BriefcaseBusiness/>
              <input
              type="text"
              placeholder="occupation:"
              name="occupation"
              id="occupation"
              onChange={handleInput}
              className='w-full p-2 rounded-md border-double border-2 border-gray-500 capitalize'
              />
            </label>
           </div>


           <div>
            <label htmlFor="phonenumber"><Phone/>
              <input
              type="tel"
              pattern='[0-9]{3}-[0-9]{3}-[0-9]{4}'
              placeholder="050-491-4053:"
              name="phonenumber"
              id="phonenumber"
              onChange={handleInput}
              className='w-full p-2 rounded-md border-double border-2 border-gray-500'
              />
            </label>
           </div>


           <div>
            <label htmlFor="email"><Mail/>
              <input
              type="email"
              size={30}
              placeholder="enockboakye@example.com:"
              name="email"
              id="email"
              className='w-full p-2 rounded-md border-double border-2 border-gray-500 lowercase'
              onChange={handleInput}/>
            </label>
           </div>


            <p className="text-xl">Behavior Characteristics:</p>
           <div className=' flex flex-row w-full p-2 rounded-md border-double border-2
            border-gray-500 gap-20 items-center justify-center'>
            <label htmlFor="smoke"><Cigarette/>
              <span>Yes</span>
              <input
              type="radio"
              value={"Yes"}
              className="size-6"
              name="smoke"
              checked={data.smoke === "Yes"}
              onChange={handleInput} required/>

              <span className="ml-2">No</span>
              <input 
              type="radio"
              value={"No"}
              name="smoke"
              className="size-6 mr-20"
              checked={data.smoke=== "No"}
              onChange={handleInput} required
              />
            </label>

            <label htmlFor="alcohol"><Wine/>
            <span>Yes</span>
              <input
              type="radio"
              value={"Yes"}
              className='size-6 mr-2'
              name="alcohol"
              checked={data.alcohol=== "Yes"}
              onChange={handleInput} required
              />

              <span>No</span>
              <input
              type="radio"
              value="No"
              className="size-6"
              name="alcohol"
              checked={data.alcohol === 'No'}
              onChange={handleInput} required
              />
            </label>
           </div>


           <p className="text-xl">Peculiar Marks:</p>
           <div className=' flex flex-row w-full p-2 rounded-md  border-double border-2 border-gray-500 gap-20 items-center justify-center'>
            <label htmlFor="tribalmark" className='text-lg'>Tribal mark?: 
              
              <span>Yes</span>
              <input
              type="radio"
              value={"Yes"}
              name="tribalmark"
              className="size-6"
              id="tribalmark"
              checked={data.tribalmark === "Yes"}
              onChange={handleInput} required
              />

              <span className="ml-2">No</span>
              <input
              type="radio"
              value={"No"}
              name="tribalmark"
              className="size-6"
              checked={data.tribalmark === "No"}
              onChange={handleInput} required
              />
            </label>

            <label htmlFor="scar" className='text-lg' >scar?:
              <span>Yes</span>
              <input
              type="radio"
              name='scar'
              id="scar"
              value={"Yes"}
              className='size-6'
              checked={data.scar === "Yes"}
              onChange={handleInput} required
              />

              <span className="ml-2">No</span>
              <input
              type="radio"
              value={"No"}
              name="scar"
              id="scar"
              className="size-6"
              checked={data.scar === "No"}
              onChange={handleInput} required
              />
            </label>
           </div>

                <div className=' flex flex-row w-full p-2 rounded-md
                  border-double border-2 border-gray-500
                   items-center justify-center'>

                <label htmlFor="tattoos"> Tattoos?:
                 <span>Yes</span>
              <input type="radio"
              name="tattoos"
              id="tattoos"
              value={"Yes"}
              className="size-6"
              checked={data.tattoos === "Yes"}
              onChange = {handleInput} required
              />
              <input/>

                  <span>No</span>
              <input
              type="radio"
              name="tattoos"
              id="tattoos"
              value={"No"}
              className= "size-6"
              checked={data.tattoos === "No"}
              onChange = {handleInput} required
              />
              </label>
                  </div>

           <div>
            <label htmlFor="maritalstatus">Marital Status:
              <select name="maritalstatus" id="maritalstatus"
              className='w-full p-2 rounded-md  border-double border-2 border-gray-500'
              onChange={handleInput}
              >
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
                         className='w-full p-2 rounded-md  border-double border-2 border-gray-500'
                         onChange={handleInput}
                         >
                             <option value="">Select Status</option>
                             <option value="in police custody"> In Police Custody</option>
                             <option value="on bail">On Bail</option>
                             <option value="in prison custody">In Prison Custody</option>
                         </select>
                       </label>
                      </div>

                      <div>
                       <label htmlFor="fathersname">Father
                         <input
                          type="text"
                          placeholder="Father's Name:"
                          name="fathersname"
                         id="fathersname"
                          onChange={handleInput}
                            className='w-full p-2 rounded-md  border-double border-2 border-gray-500 capitalize'
                                    />
                                  </label>
                                 </div>


                                 <div>
                                  <label htmlFor="investigator">Mother
                                    <input
                                    type="text"
                                    placeholder="Mother's Name:"
                                    name="mothersname"
                                    id="mothersname"
                                    onChange={handleInput}
                                    className='w-full p-2 rounded-md  border-double border-2 border-gray-500 capitalize'
                                    />
                                  </label>
                                 </div>

                                 <div>
                                  <label htmlFor="investigator">Investigator
                                    <input
                                    type="text"
                                    placeholder="name of investigator:"
                                    name="investigator"
                                    id="investigator"
                                    onChange={handleInput}
                                    className='w-full p-2 rounded-md  border-double border-2 border-gray-500 capitalize'
                                    />
                                  </label>
                                 </div>
           


           <div>
            <button 
            disabled={per !== null && per < 100} type="submit"
            className="group p-[4px] rounded-[12px] bg-gradient-to-b from-white to-stone-200/40 shadow-[0_2px_4px_rgba(0,0,0,0.5)] active:shadow-[0_1px_2px_rgba(0,0,0,0.5)] active:scale-[0.995]">Submit</button>
           </div><br/>

        </div>
      </form>

          
    </div>
  )
}

export default Form


