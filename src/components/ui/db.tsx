"use client"
import * as React from 'react'
import { useEffect, useState } from "react";
import {
    collection,
    getDocs,
    deleteDoc,
    doc
} from "firebase/firestore";
import {db,} from "../../../firebaseconfig"
import {useRouter} from 'next/navigation'
import { Button } from '@/components/ui/button';
import {GridFilterModel} from '@mui/x-data-grid';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog"
import ClientDataGrid from '@/components/client-data-grid';



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


const Database = () => {
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
  height: "",
      haircolor: "",
      skintone: "",
      nickname: "",
      tattoos: "",
      mothersname: "",
      fathersname: "",
});

const [loading, setLoading]= useState(false);
const [open,setOpen] = useState(false);
const router = useRouter();
const [filterModel, setFilterModel] = useState<GridFilterModel>()

useEffect(()=>{
  setLoading(true); 
  const fetchData = async () =>{
    const list: suspectData[] = [];
    console.log(list.length)
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





const suspectColumns = [
    {field:"id", headerName:"ID", width:50},
    {field:"img", headerName:"PHOTO", width: 150,
        renderCell:(params:{row:suspectData})=>{
            return(
                <div className='flex justify-center items-center'>
                    {params.row.img ? ((
                        <img src={params.row.img} width={50} height={50} alt="avatar"/>
                    )) : (
                        <div className="w-[50px] h-[50px] bg-gray-200 flex items-center justify-center">
                            <span className="text-gray-900">No Image</span>
                        </div>
                    )}
                </div>
            );
        }
    },
    {field:"name", headerName:"FULL NAME", width: 250}
    
]


const handleModal = (id: string) => {
  const suspectInfo = suspect.find((item) => item.id === id);
  if (suspectInfo) {
    setData(suspectInfo);
    setOpen(true);
  }
};








const actionColumn = [
  {
    field: "action",
    headerName: "Action",
    width: 200,
    renderCell: (params: { row: suspectData }) => (
    
      <div className="cellAction gap-4">
       
        <Button className="text-white
         bg-green-600 mr-2"
         onClick={()=> router.push(`/getcopy/${params.row.id}/print`)}
         >
          Print
        </Button>
        <Button
          className="text-white bg-pink-600"
          onClick={() => handleModal(params.row.id)}
        >
          View
        </Button>
        {open && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTitle>{data.id}</DialogTitle>
            <DialogContent className="justify-center items-center max-h-96 overflow-y-auto">
              <img src={data.img} alt="profile pic" className="w-52 h-52" />
              <DialogHeader className="shadow-md font-extrabold font-xl">
                {data.name}
              </DialogHeader>

              <p className="shadow-md mt-2 font-extrabold">
                <span className="font-bold text-xl">R.O: </span> {data.ro}
              </p>
              <p className="shadow-md m-2 mt-2 font-extrabold">
                Gender: {data.gender}
              </p>
              <p className="shadow-md mt-2 font-extrabold">
                Height: {data.height}
                </p>
                <p className="shadow-md mt-2 font-extrabold">
                  Hair Color: {data.haircolor}
                </p>
              <p className="shadow-md mt-2 font-extrabold">
                Date of Birth: {data.dateofbirth}
              </p>
              <p className="shadow-md mt-2 font-extrabold">
                Place of Birth: {data.placeofbirth}
              </p>
              <p className="shadow-md mt-2 font-extrabold">
                Home Town: {data.hometown}
              </p>
              <p className="shadow-md mt-2 font-extrabold">
                Nationality: {data.nationality}
              </p>
              <p className="shadow-md mt-2 font-extrabold">
                Occupation: {data.occupation}
              </p>
              <p className="shadow-md mt-2 font-extrabold">
                Phone Number: {data.phonenumber}
              </p>
              <p className="shadow-md mt-2 font-extrabold">Email: {data.email}</p>
              <p className="shadow-md mt-2 font-extrabold">
                Address: {data.address}
              </p>
              <p className="shadow-md mt-2 font-extrabold">Smoke: {data.smoke}</p>
              <p className="shadow-md mt-2 font-extrabold">
                Alcohol: {data.alcohol}
              </p>
              <p className="shadow-md mt-2 font-extrabold">
                Tribal Mark: {data.tribalmark}
              </p>
              <p className="shadow-md mt-2 font-extrabold">Scar: {data.scar}</p>
              <p className ="shadow-md mt-2 font-extrabold">Tattoos:{data.tattoos}</p>
              <p className="shadow-md mt-2 font-extrabold">
                Marital Status: {data.maritalstatus}
              </p>
              <p className="shadow-md mt-2 font-extrabold">Mother:{data.mothersname}</p>
              <p className="shadow-md mt-2 font-extrabold">Father:{data.fathersname}</p>
              <p className="shadow-md mt-2 font-extrabold">
                Custody Status: {data.custus}
              </p>
              <p className="shadow-md mt-2 font-extrabold">
                Cell: {data.cell}
              </p>
              <p className="shadow-md mt-2 font-extrabold">
                Investigator: {data.investigator}
              </p>


     <DialogFooter>
     <Button onClick={() => setOpen(false)}>Cancel</Button>
       <div>
        
        <Button onClick={()=> router.push(`/suspect/${data.id}/update`)}>Update</Button>
      
      </div>
        <Button onClick={() => handleDelete(data.id)}>Delete</Button>
      </DialogFooter>
       </DialogContent>
          </Dialog>
        )}
      </div>
      
    ),
  },
];





 

const handleDelete = async(id:string)=> {
  try{
      await deleteDoc(doc(db, "suspects", id));
      setSuspect(suspect.filter((item)=> item.id !==id));
      setOpen(false);
  }catch (err){
      console.log(err);
  }
}






  return (
      <div>
      

      <div className="top-0 p-5 h-full bg-white font-bold bg-cover ml-5">
        <div className=" flex w-full text-2xl mb-3 items-center justify-between text-blue-800">
          SUSPECTS INFORMATION
        </div>

        <div className="float-right">
          <Button className="bg-blue-600
           rounded-md 
           mb-4 text-xl" onClick={()=> router.push("/profile_form")}>ADD NEW SUSPECT</Button>
        </div>

         <div>
          <input
          type="text"
          placeholder="Search"
          onChange={(e)=> setFilterModel({
            items:[
              {
                field: "name",
                operator: "contains",
                value: e.target.value,
              },
            ],
          })}
          className="border p-2 mb-4 w-full rounded-md shadow-md"/>
        </div>

       
      
        <ClientDataGrid 
          className="datagrid" 
          rows={suspect}
          loading={loading}
          columns={suspectColumns.concat(actionColumn)}
          pageSizeOptions={[5,100]} 
          filterModel={filterModel}
          onFilterModelChange={setFilterModel}
          checkboxSelection
        />
      </div>

      </div>
  )
}

export default Database