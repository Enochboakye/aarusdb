
"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter } from "next/navigation";
import { PlusCircle, Loader2, Users } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { fetchSuspectsAction } from "./actions";
import { PageContainer } from "@/components/page-container";
import { Button } from "@/components/ui/button";
import { Suspect } from "@/types/suspect";
import { MaterialReactTable, type MRT_ColumnDef } from "material-react-table";
import { Box, TextField } from "@mui/material";
import actionColumn from "./columns";
const SuspectsPageContent = () => {
  const [suspects, setSuspects] = useState<Suspect[]>([]);
  const [loading, setLoading] = useState(true);
  const [globalFilter, setGlobalFilter] = useState("");

  const fetchSuspects = useCallback(async () => {
    try {
      const fetchedSuspects = await fetchSuspectsAction();
      setSuspects(fetchedSuspects);
    } catch (error) {
      console.error("Error fetching suspects:", error);
      toast({
        title: "Error",
        description: "Failed to load suspect records. Please try again.",
        variant: "destructive",
      });
      setSuspects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchSuspects();
  }, [fetchSuspects]);

  // Define MRT columns
  const columns: MRT_ColumnDef<Suspect>[] = [
    {
      accessorKey: "fullName",
      header: "Full Name",
      size: 300,
    },
    {
      accessorKey: "nickname",
      header: "Nick Name",
      size: 200,
    },
    {
      accessorKey: "gender",
      header: "Gender",
      size: 100,
    },
    {
      accessorKey: "nationality",
      header: "Nationality",
      size: 150,
    },
  ];

  return (
    <>
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg">Loading suspect records...</p>
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
              columns={[...columns, ...actionColumn]}
              data={suspects}
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
};

export default function SuspectsPage() {
  const router = useRouter();
  return (
    <PageContainer className="mt-8">
      <div className="flex justify-between items-center mb-6 -mt-4">
        <div>
          <div className="flex items-center mb-1">
            <Users className="h-6 w-6 mr-2 text-primary" />
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Suspect Records
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            View, add, and manage suspect information. Use the search to filter
            records.
          </p>
        </div>
        <Button asChild onClick={() => router.push("/suspects/new")}>
          <div className="flex items-center">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Suspect
          </div>
        </Button>
      </div>
      <div className="space-y-6">
        <Suspense
          fallback={
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="ml-4 text-lg">Loading records...</p>
            </div>
          }
        >
          <SuspectsPageContent />
        </Suspense>
      </div>
    </PageContainer>
  );
}



