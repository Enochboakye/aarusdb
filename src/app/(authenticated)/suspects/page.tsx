"use client"
import React, { useState, useEffect, useCallback, Suspense } from 'react';
import type { Suspect } from '@/types/suspect';
import { Button } from '@/components/ui/button';
import { PlusCircle, Loader2, Users } from 'lucide-react';
import { PageContainer } from '@/components/page-container';
import { toast } from '@/hooks/use-toast';
import { fetchSuspectsAction } from './actions';
import {useRouter} from 'next/navigation'
import ClientDataGrid from '@/components/client-data-grid';
import {GridFilterModel, GridColDef} from '@mui/x-data-grid';
import actionColumn from './columns';
// Convert TanStack columns to MUI columns
const muiColumns: GridColDef[] = [
  {
    field: 'id',
    headerName: 'ID',
    width: 50,
    hideable: true, // Hide the ID column but keep it for internal use
  },
  {
    field: 'fullName',
    headerName: 'Full Name',
    width: 300
  },
  {
    field: 'gender',
    headerName: 'Gender',
    width:100
  },
  {
    field: 'nationality',
    headerName: 'Nationality',
    width: 150
  }
];

const SuspectsPageContent = ()=> {
    const [suspects, setSuspects] = useState<Suspect[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterModel, setFilterModel] = useState<GridFilterModel>()

    const fetchSuspects = useCallback(async()=>{
        try {
            const fetchedSuspects = await fetchSuspectsAction();
            setSuspects(fetchedSuspects)
        } catch (error) {
            console.error("Error fetching suspects:", error);
            toast({
                title: "Error",
                description: "Failed to load suspect records. Please try again.",
                variant: "destructive",
            }); 
            setSuspects([])
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(()=> {
        setLoading(true);
        fetchSuspects();
    }, [fetchSuspects]);

    return (
    <>
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg">Loading suspect records...</p>
        </div>
      ) : (
        <>
          <div>
            <input
              type="text"
              placeholder="Search"
              onChange={(e)=> setFilterModel({
                items:[
                  {
                    field: "fullName",
                    operator: "contains",
                    value: e.target.value,
                  },
                ],
              })}
              className="border p-2 mb-4 w-full rounded-md shadow-md"
            />
          </div>
          <ClientDataGrid 
            className="datagrid" 
            rows={suspects}
            loading={loading}
            columns={[...muiColumns, ...actionColumn]}
            pageSizeOptions={[2, 3,4,5,10,100]} 
            filterModel={filterModel}
            onFilterModelChange={setFilterModel}
            checkboxSelection
          />
        </>
      )}
    </>
  );
}

export default function SuspectsPage() {
 const router = useRouter()
  return (
    <PageContainer className='mt-8'>
      <div className="flex justify-between items-center mb-6 -mt-4">
        <div>
            <div className="flex items-center mb-1">
                <Users className="h-6 w-6 mr-2 text-primary" />
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">Suspect Records</h2>
            </div>
          <p className="text-sm text-muted-foreground">
            View, add, and manage suspect information. Use the search to filter records.
          </p>
        </div>
        <Button asChild onClick={()=> router.push("/suspects/new")}>
          <div className="flex items-center">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Suspect
          </div>
        </Button>
      </div>
      <div className="space-y-6">
        <Suspense fallback={
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-lg">Loading records...</p>
          </div>
        }>
          <SuspectsPageContent />
        </Suspense>
      </div>
    </PageContainer>
  );
}


