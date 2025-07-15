
"use client";

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { PlusCircle, Loader2, Briefcase } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PageContainer } from '@/components/page-container';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { fetchCasesAction } from './actions';
import type { Case } from '@/types/case';
import { caseActionColumn } from './columns';

import { MaterialReactTable, type MRT_ColumnDef } from 'material-react-table';
import { Box, TextField } from '@mui/material';

function CasesPageContent() {
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState('');

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

  const columns: MRT_ColumnDef<Case>[] = [
    {
      accessorKey: 'roNumber',
      header: 'R.O Number',
      size: 100,
    },
    {
      accessorKey: 'priority',
      header: 'Priority',
      size: 100,
    },
    {
      accessorKey: 'complainant',
      header: 'Complainant',
      size: 200,
    },
    {
      accessorKey: 'assignedInvestigator',
      header: 'Investigator',
      size: 200,
    },
  ];

  return (
    <>
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg">Loading case records...</p>
        </div>
      ) : (
        <>
          <TextField
            label="Search"
            variant="outlined"
            size="small"
            fullWidth
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            sx={{ mb: 2 }}
          />

          <Box className="datagrid">
            <MaterialReactTable
              columns={[...columns, ...caseActionColumn]}
              data={cases}
              state={{ isLoading: loading, globalFilter }}
              onGlobalFilterChange={setGlobalFilter}
              enableRowSelection
              enableColumnActions
              enableColumnFilters
              enableSorting
              enablePagination
              paginationDisplayMode="pages"
              muiTablePaperProps={{
                elevation: 0,
                sx: { borderRadius: "12px", overflow: "hidden" },
              }}
            />
          </Box>
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
