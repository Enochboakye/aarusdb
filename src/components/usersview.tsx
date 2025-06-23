"use client"
import * as React from 'react'
import { useEffect, useState, } from "react";
import {
    collection,
    getDocs,
    deleteDoc,
    doc
} from "firebase/firestore";
import {db,} from "@/lib/firebase"
import { Button } from '@/components/ui/button';
import {GridFilterModel} from '@mui/x-data-grid';
import ClientDataGrid from '@/components/client-data-grid';
import {User} from '@/types/preauth'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog"

export default function GetUsers(){
    const [users, setUsers] = useState<User[]>([]);
    const [data, setData] = useState<User>({
        id:'',
        fullName: '',
        rank: '',
        serviceNumber: 0,
    });
    const[filterModel, setFilterModel] = useState<GridFilterModel>()
    
    const [loading, setLoading]= useState(false);
    const [open,setOpen] = useState(false);


    useEffect(()=>{
      setLoading(true)
        const fetchUsers = async ()=>{
            const list: User[] = [];

            try{
                const querySnapshot = await getDocs(collection(db, 'preauth'))
                querySnapshot.forEach((doc)=> {
                    list.push({ ...doc.data()as User, id: doc.id})
                });
                setUsers(list);
                setLoading(false);
            }
            catch(err) {
        console.log(err)
    }

        }
        fetchUsers()
    }, [])



    const handleDelete = async(id:string)=> {
  try{
      await deleteDoc(doc(db, "suspects", id));
      setUsers(users.filter((item)=> item.id !==id));
  }catch (err){
      console.log(err);
  }
}



const handleModal = (id: string) => {
  const UserInfo = users.find((item) => item.id === id);
  if (UserInfo) {
    setData(UserInfo);
    setOpen(true);
  }
};

const suspectColumns = [
    {field:"id", headerName:"ID", width:50},
    {field:'serviceNumber', headerName:"S.N", width:100},
    {field:'rank', headerName:'Rank', width:200},
    {field:"fullName", headerName:"FULL NAME", width: 250}
]


const actionColumn = [
  {
    field: "action",
    headerName: "Action",
    width: 100,
    renderCell: (params: { row: User }) => (
    
      <div className="cellAction gap-4">
       
        
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
        
              <DialogHeader className="shadow-md font-extrabold font-xl">
               Service Number: {data.serviceNumber}
              </DialogHeader>
              <p className="shadow-md m-2 mt-2 font-extrabold">
                Rank: {data.rank}
              </p>
              <p className="shadow-md mt-2 font-extrabold">
                Full Name: {data.fullName}
                </p>
               

     <DialogFooter>
     <Button onClick={() => setOpen(false)}>Cancel</Button>
       <div>
        
      
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


return(

    <div className="top-0 p-5  bg-white font-bold bg-cover ml-5">
        <div className=" flex w-full text-2xl mb-3 items-center justify-between text-blue-800">
          Officers Information
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
          rows={users}
          loading={loading}
          columns={[...suspectColumns,...actionColumn]}
          pageSizeOptions={[2,3,5,100]} 
          filterModel={filterModel}
          onFilterModelChange={setFilterModel}
          checkboxSelection
        />
      </div>

)

}