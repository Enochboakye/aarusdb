"use client"

import { useEffect, useState } from "react";
import {
    collection,
    getDocs,
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

  import {
    Chart as Chartjs,
    Tooltip,
    Legend,
    BarElement,
    CategoryScale,
    LinearScale,
    Title
  } from 'chart.js'

  import { Bar } from 'react-chartjs-2'
  import ChartDataLabels from "chartjs-plugin-datalabels"
  Chartjs.register(BarElement, CategoryScale,LinearScale,Title, Tooltip, Legend, ChartDataLabels
  );

  


const Chart1 = () => {

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
 const TotalSuspects = suspect.length;
 const OnBail = suspect.filter(s => s.custus && s.custus.toLowerCase().includes("on bail")).length;
 const InPoliceCustody = suspect.filter(s => s.custus && s.custus.toLowerCase().includes("in police custody")).length;
 const InPrisonCustody = suspect.filter(s => s.custus && s.custus.toLowerCase().includes("in prison custody")).length;
 const InPoliceCustodyPercentage = (InPoliceCustody / TotalSuspects) * 100;
 const InPrisonCustodyPercentage = (InPrisonCustody/ TotalSuspects) * 100;
 const BailPercent = (OnBail / TotalSuspects)*100;

 console.log(InPoliceCustodyPercentage);
 console.log(InPrisonCustodyPercentage);
 console.log(BailPercent);

            const CurrentYear = new Date().getFullYear();
            const data = {
                labels:[" In Police Custody","In Prisons", "On Bail",
                  
            ],
                datasets:[{
                    label: `Suspects/Accused Data (%) (${CurrentYear})`,
                    data:[
                    
                      InPoliceCustodyPercentage,
                      InPrisonCustodyPercentage,
                      BailPercent,
                    ],
                    backgroundColor: ["#36a2eb", "#ff6384", "#ffce56","#4bc0c0"],
                    borderColor:["#2276b3", "#d32f2f", "#c79a00", "#2a8b88"],
                    borderWidth:1,
                },
            ],
                
            }

            const options = {
              responsive:true,
              plugins:{
                legend:{ display:false },
                title:{display:true, color:"#f8a39b", text:`Suspect stats (${CurrentYear})`},
                datalabels:{
                  anchor:"end",
                  align:"end",
                  color:"#cd4bcd",
                  formatter:(value:number)=> `${value.toFixed(1)}%`,
                  font:{
                    weight:700,
                    size:14,
                  },
                },
              },
              scales:{
                y:{
                  beginAtZero:true,
                  ticks:{
                    callback:(value:number)=>`${value}%`,
                    color:"#f8a39b",
                    font:{
                      weight:700,

                    }
                  },
                  title:{
                    display:true,
                    text:"percentage",
                    color:"#ffda64",
                    font:{
                      weight:700,
                      size:14
                    }
                  },
                },
              },
          };


    return (
        <div className="flex p-3 shadow-md rounded-md shadow-green-500  text-3xl w-76 h-48 items-center justify-center">
            <Bar data={data}
          options={options}
            />
        </div>
    )
}

export default Chart1