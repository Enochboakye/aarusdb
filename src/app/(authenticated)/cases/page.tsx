
"use client";
import React, { useState, useEffect, useCallback, Suspense } from 'react'; // Added React and Suspense
import { PlusCircle, Loader2, Briefcase } from 'lucide-react';
import { PageContainer } from '@/components/page-container';
import { DataTable } from '@/components/data-table';
import { columns } from './columns';
import type { Case } from '@/types/case';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import { fetchCasesAction } from './actions'; 
import { useSearchParams } from 'next/navigation';

function CasesPageContent() {
  const searchParams = useSearchParams();
  const initialSearchQuery = searchParams.get('q');

  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true); 
  const [filter, setFilter] = useState(initialSearchQuery || '');

  const fetchCases = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedCases = await fetchCasesAction(); 
      
      let filteredCases = fetchedCases;
      if (filter) { 
        const lowercasedFilter = filter.toLowerCase();


        filteredCases = fetchedCases.filter((c: Case) => {
            const complainant = c.complainant || {};
            const witnesses = c.witnesses || [];
            return (
                String(c.roNumber).toLowerCase().includes(lowercasedFilter) || 
                (c.offence && c.offence.toLowerCase().includes(lowercasedFilter)) ||
                (c.assignedInvestigator && c.assignedInvestigator.toLowerCase().includes(lowercasedFilter)) ||
                (c.year && String(c.year).includes(lowercasedFilter)) || 
                (c.briefFacts && c.briefFacts.toLowerCase().includes(lowercasedFilter)) ||
                (complainant.name && complainant.name.toLowerCase().includes(lowercasedFilter)) ||
                (c.locationOfOffence && c.locationOfOffence.toLowerCase().includes(lowercasedFilter)) ||
                (complainant.contact && complainant.contact.toLowerCase().includes(lowercasedFilter)) ||
                (complainant.address && complainant.address.toLowerCase().includes(lowercasedFilter)) ||
                witnesses.some((w) => 
                    (w.name && w.name.toLowerCase().includes(lowercasedFilter)) ||
                    (w.contact && w.contact.toLowerCase().includes(lowercasedFilter)) ||
                    (w.address && w.address.toLowerCase().includes(lowercasedFilter)) ||
                    (w.statement && w.statement.toLowerCase().includes(lowercasedFilter))
                )
            );
        });
      }
      setCases(filteredCases);
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
  }, [filter]); 

  useEffect(() => {
    fetchCases();
  }, [fetchCases]); 

  useEffect(() => {
    const queryParam = searchParams.get('q');
    if (queryParam !== null) {
      if (queryParam !== filter) {
        setFilter(queryParam);
      }
    }
  }, [searchParams, filter]);

  return (
    <>
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-lg">Loading case records...</p>
        </div>
      ) : (
        <DataTable 
          columns={columns} 
          data={cases}
          filterInputPlaceholder="Search cases on this page..."
          onFilterChange={setFilter} 
          filterValue={filter}
          meta={{
            refreshData: fetchCases
          }}
        />
      )}
    </>
  );
}

export default function CasesPage() {
  return (
    <PageContainer title="Manage Cases">
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
        <Button asChild>
          <Link href="/cases/new">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Case
          </Link>
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
