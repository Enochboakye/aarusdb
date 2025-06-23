"use client";
import React, { useState, useEffect, useCallback, Suspense } from 'react'; // Added React and Suspense
import { PlusCircle, Loader2, Briefcase } from 'lucide-react';
import { PageContainer } from '@/components/page-container';
import {useRouter} from 'next/navigation'
import type { Case } from '@/types/case';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { fetchCasesAction } from './actions'; 
import ClientDataGrid from '@/components/client-data-grid';
import {GridFilterModel, GridColDef} from '@mui/x-data-grid';
import {caseActionColumn} from './columns'


function CasesPageContent() {
  

  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true); 
  const [filterModel, setFilterModel] = useState<GridFilterModel>();
  const [searchValue, setSearchValue] = useState('');

  const muiColumns: GridColDef[] = [
    {
      field: 'id',
      headerName: 'ID',
      width: 50,
      hideable: true, // Hide the ID column but keep it for internal use
    },
    {
      field: 'roNumber',
      headerName: 'R.O Number',
      width: 100
    },
    {
      field: 'priority',
      headerName: 'Priority',
      width:100
    },
    {
      field: 'complainant',
      headerName: 'Complainant',
      width: 200,
     
    },
    {
      field: 'dateOccurred',
      headerName: 'D.O.O',
      width: 100
    }
  ];

  const fetchCases = useCallback(async () => {
    setLoading(true);

    try {
      const fetchedCases = await fetchCasesAction(); 
      
      
      setCases(fetchedCases);
    } catch (error) {
      console.error("Error fetching cases:", error);
      toast({
        title: "Error",
        description: "Failed to load case records. Please try again.",
        variant: "destructive",
      });
      setCases([]); 
    } finally {
      setLoading(false);
    }
  }, []); 

  useEffect(() => {
    fetchCases();
  }, [fetchCases]); 

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setFilterModel({
        items: [
          {id:1, field: "roNumber", operator: "contains", value: searchValue},
          
        ],
      });
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchValue]);

  return (
    <>
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg">Loading case records...</p>
        </div>
      ) : (
        <>
          <div>
            <input
              type="text"
              placeholder="Search"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className="border p-2 mb-4 w-full rounded-md shadow-md"
            />
          </div>
          <ClientDataGrid 
            columns={[...muiColumns,...caseActionColumn]} 
            rows={cases}
            loading={loading}
            filterModel={filterModel}
            onFilterModelChange={setFilterModel}
            disableMultipleRowSelection={false}
            checkboxSelection
          />
        </>
      )}
    </>
  );
}

export default function CasesPage() {
  const router = useRouter();
  return (
    <PageContainer className="mt-8">
      <div className="flex justify-between items-center mb-6 -mt-4">
        <div>
            <div className="flex items-center mb-1">
                <Briefcase className="h-6 w-6 mr-2 text-primary" />
                <h2 className="text-2xl font-semibold tracking-tight text-foreground">Case Records</h2>
            </div>
          <p className="text-sm text-muted-foreground">
            View, add, and manage criminal case information. Use the search to filter records.
          </p>
        </div>
        <Button onClick={()=> router.push("/cases/new")}>
          <div className="flex items-center">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Case
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
          <CasesPageContent />
        </Suspense>
      </div>
    </PageContainer>
  );
}
