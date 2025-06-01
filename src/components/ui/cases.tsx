"use client"

import * as React from 'react'
import {useState, FormEvent, ChangeEvent} from "react";
import {
    collection,
    setDoc,
    doc,
    serverTimestamp  
} from "firebase/firestore";
import {db,} from "../../../firebaseconfig"
import {toast} from 'react-toastify';


interface caseData {
    ro: string;
    brieffacts: string;
    suspects: string[];
    investigator:string;
    datereported:string;
    offence:string[];
    status:string;
    witness:string[];
    exhibits:string[];


}

const Cases = ()=>{
    const [data, setData] = useState<caseData>({
        ro: "",
        brieffacts: "",
        suspects: [""],
        exhibits:[""],
        investigator: "",
        datereported: "",
        offence: [""],
        status: "",
        witness: [""]
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string[]>([]);

    const handleInput = (e:ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> 
    )=> {

        const {name, value} = e.target;
        setData((prevData)=>({...prevData, [name]:value}));
    };

    const handleAddSuspect = (index: number, value:string) => {
        const newSuspects = [...data.suspects];
        newSuspects[index] = value;
        setData((prevSuspect)=> (
            {...prevSuspect, suspects:newSuspects}
        ));
        };

        const addSuspectField = ()=> {
            if(data.suspects.length < 50){
                setData((prevAdd)=>({...prevAdd, 
                suspects:[...prevAdd.suspects, ""]}));
            }else{
                toast.warning("You can only add up to 50 suspects.");
            }
        };

        const removeSuspectField = (index:number)=> {
        const newSuspect = data.suspects.filter((_,i)=> i !== index);
        setData((remove)=>({...remove, suspects:newSuspect}));
        }


        const handleAddExhibit = (index: number, value:string) => {
            const newExhibits = [...data.exhibits];
            newExhibits[index] = value;
            setData((prevExhibit)=> (
                {...prevExhibit, suspects:newExhibits}
            ));
            };

        const addExhibitField = ()=> {
            if(data.exhibits.length < 50){
                setData((prevAd)=>({...prevAd, 
                exhibits:[...prevAd.exhibits, ""]}));
            }else{
                toast.warning("You can only add up to 50 exhibits.");
            }
        };


        const removeExhibitField = (index:number)=> {
            const newExhibit = data.exhibits.filter((_,i)=> i !== index);
            setData((remove)=>({...remove, exhibits:newExhibit}));
            }


            const handleAddWitness = (index: number, value:string) => {
                const newWitnesses = [...data.witness];
                newWitnesses[index] = value;
                setData((prevWitness)=> (
                    {...prevWitness, suspects:newWitnesses}
                ));
                };

                const addWitnessField = ()=> {
                    if(data.witness.length < 50){
                        setData((prevA)=>({...prevA, 
                        witness:[...prevA.witness, ""]}));
                    }else{
                        toast.warning("You can only add up to 50 suspects.");
                    }
                };

                const removeWitnessField = (index:number)=> {
                    const newWitness = data.witness.filter((_,i)=> i !== index);
                    setData((remove)=>({...remove, witness:newWitness}));
                    }

                    const handleAddOffence = (index: number, value:string) => {
                        const newOffences = [...data.offence];
                        newOffences[index] = value;
                        setData((prevOffence)=> (
                            {...prevOffence, offence:newOffences}
                        ));
                        };

                        const addOffenceField = ()=> {
                            if(data.offence.length < 50){
                                setData((prevAdds)=>({...prevAdds, 
                                offence:[...prevAdds.offence, ""]}));
                            }else{
                                toast.warning("You can only add up to 50 offences.");
                            }
                        };

                        const removeOffenceField = (index:number)=> {
                            const newOffence = data.offence.filter((_,i)=> i !== index);
                            setData((remove)=>({...remove, offence:newOffence}));
                            }
    

    const handleSubmit = async (e:FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true)
        try{
            await setDoc(doc(collection(db, "cases")), {
                ro: data.ro,
                brieffacts: data.brieffacts,
                suspects: data.suspects,
                investigator: data.investigator,
                datereported: data.datereported,
                offence: data.offence,
                status: data.status,
                witness: data.witness,
                exhibits: data.exhibits,
                createdAt: serverTimestamp(),
            });
            toast.success("cases successfully registered");
            setTimeout(()=>{
                window.location.reload();
            },3000)
        }catch(err){
            console.error("error submitting data", err);
            setError(["something went wrong, please try again"]);
        }

    };

    return (
        <div className="flex mt-8 items-center justify-center shadow-md">
            {error.length > 0 && (
                <div>
                    <ul>
                        {error.map((err, idx)=>( 
                            <li key={idx}>
                                {err}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
            <div>
            <form onSubmit={handleSubmit} className="w-96">
                <fieldset className="flex flex-col border-green-500 border-2 p-2 w-68">
                <legend className="font-serif text-extrabold text-xl">RO:</legend>
                <input type="text" name="ro" id="ro" onChange={handleInput} 
                className='w-full p-2 rounded-md 
                border-double border-2 border-gray-500' placeholder="RO number" />
            </fieldset>

            <fieldset className="flex flex-col border-green-500 border-2 p-2">
                <legend className="font-serif text-extrabold text-xl">Date Reported:</legend>
                <input type="date" name="datereported" id="datereported" onChange={handleInput} 
                className='w-full p-2 rounded-md 
                border-double border-2 border-gray-500' />
            </fieldset>

            <fieldset className="flex flex-col border-green-500 border-2 p-2">
                <legend className="font-serif text-extrabold text-xl">Offence(s):</legend>
                
                {data.offence.map((offence, index)=>(

                    <div key={index} className="flex items-center space-x-2 mb-2">
                        <input type="text" value={offence} name="suspects" id="suspects" 
                    onChange={(e)=>handleAddOffence(index, e.target.value)} className='w-full p-2 rounded-md  
                    border-double border-2 border-gray-500' placeholder={`offence(s) ${index + 1}`}/>
                    {index > 0 && (
                        <button type="button"
                         onClick={()=> removeOffenceField(index)}
                         className="px-2 py-1 bg-red-500 rounded-md"
                         >
                        -
                        </button>
                    )}
                    <button type="button" 
                    onClick={addOffenceField}
                    className="mt-2 px-3 py-1 bg-blue-500 text-white rounded-md"
                    >
                        +
                    </button>
                    </div>
                ))}
                </fieldset>

            <fieldset className="flex flex-col border-green-500 border-2 p-2 w-96">
                <legend className="font-serif text-extrabold text-xl">Breif Facts:</legend>
                <textarea name="brieffacts" rows={10} id="brieffacts" cols={30}
                 onChange={handleInput} className='w-full p-2 rounded-md 
                 border-double border-2 border-gray-500'></textarea>
            </fieldset>

            <fieldset className="flex flex-col border-green-500 border-2 p-2">
                <legend className="font-serif text-extrabold text-xl">Suspects:</legend>
                
                {data.suspects.map((suspect, index)=>(

                    <div key={index} className="flex items-center space-x-2 mb-2">
                        <input type="text" value={suspect} name="suspects" id="suspects" 
                    onChange={(e)=>handleAddSuspect(index, e.target.value)} className='w-full p-2 rounded-md  
                    border-double border-2 border-gray-500' placeholder={`suspect ${index + 1}`}/>
                    {index > 0 && (
                        <button type="button"
                         onClick={()=> removeSuspectField(index)}
                         className="px-2 py-1 bg-red-500 rounded-md"
                         >
                        -
                        </button>
                    )}
                    <button type="button" 
                    onClick={addSuspectField}
                    className="mt-2 px-3 py-1 bg-blue-500 text-white rounded-md"
                    >
                        +
                    </button>
                    </div>
                ))}
                </fieldset>


                <fieldset className="flex flex-col border-green-500 border-2 p-2">
                <legend className="font-serif text-extrabold text-xl">Exhibits:</legend>
                
                {data.exhibits.map((exhibit, index)=>(

                    <div key={index} className="flex items-center space-x-2 mb-2">
                        <input type="text" value={exhibit} name="suspects" id="suspects" 
                    onChange={(e)=>handleAddExhibit(index, e.target.value)} className='w-full p-2 rounded-md  
                    border-double border-2 border-gray-500' placeholder={`Exhibit ${index + 1}`}/>
                    {index > 0 && (
                        <button type="button"
                         onClick={()=> removeExhibitField(index)}
                         className="px-2 py-1 bg-red-500 rounded-md"
                         >
                        -
                        </button>
                    )}
                    <button type="button" 
                    onClick={addExhibitField}
                    className="mt-2 px-3 py-1 bg-blue-500 text-white rounded-md"
                    >
                        +
                    </button>
                    </div>
                ))}
                </fieldset>


                <fieldset className="flex flex-col border-green-500 border-2 p-2">
                <legend className="font-serif text-extrabold text-xl">Witness:(es)</legend>
                
                {data.witness.map((witness, index)=>(

                    <div key={index} className="flex items-center space-x-2 mb-2">
                        <input type="text" value={witness} name="witness" id="witness" 
                    onChange={(e)=>handleAddWitness(index, e.target.value)} className='w-full p-2 rounded-md  
                    border-double border-2 border-gray-500' placeholder={`witness ${index + 1}`}/>
                    {index > 0 && (
                        <button type="button"
                         onClick={()=> removeWitnessField(index)}
                         className="px-2 py-1 bg-red-500 rounded-md"
                         >
                        -
                        </button>
                    )}
                    <button type="button" 
                    onClick={addWitnessField}
                    className="mt-2 px-3 py-1 bg-blue-500 text-white rounded-md"
                    >
                        +
                    </button>
                    </div>
                ))}
                </fieldset>


                <fieldset className="flex flex-col border-green-500 border-2 p-2">
              <legend className="font-serif text-extrabold text-xl">Docket Movements:</legend>
              <select name="status" id="status"
                         className='w-full p-2 rounded-md border-double border-2 border-gray-500'
                         onChange={handleInput}
                         >
                             <option value="">Select Status</option>
                             <option value="at legal">At Legal And Prosecution</option>
                             <option value="at ag">At AG</option>
                         </select>
                </fieldset>


            <fieldset className="flex flex-col border-green-500 border-2 p-2">
              <legend className="font-serif text-extrabold text-xl">Investigator:</legend>
                <input type="text" name="investigator" id="investigator" 
                onChange={handleInput} className='w-full p-2 rounded-md 
                    border-double border-2 border-gray-500'/>
                </fieldset>


                <div>
            <button 
             type="submit"
            className="group p-[4px] rounded-[12px]
             bg-gradient-to-b from-white to-stone-200/40
              shadow-[0_2px_4px_rgba(0,0,0,0.5)]
               active:shadow-[0_1px_2px_rgba(0,0,0,0.5)]
                active:scale-[0.995] mt-2">Submit</button>
           </div><br/>

            </form>
            </div>
        </div>
    );
}

export default Cases