
"use client";
import React, { useState, useEffect, useCallback, Suspense } from 'react'; // Added React and Suspense
import { PlusCircle, Loader2, Users } from 'lucide-react';
import { PageContainer } from '@/components/page-container';
import { DataTable } from '@/components/data-table';
import { columns } from './columns'; 
import type { Suspect } from '@/types/suspect';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { toast } from '@/hooks/use-toast';
import { fetchSuspectsAction } from './actions'; 
import { useSearchParams } from 'next/navigation';

function SuspectsPageContent() {
  const searchParams = useSearchParams();
  const initialSearchQuery = searchParams.get('q');

  const [suspects, setSuspects] = useState<Suspect[]>([]);
  const [loading, setLoading] = useState(true); 
  const [filter, setFilter] = useState(initialSearchQuery || '');

  const fetchSuspects = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedSuspects = await fetchSuspectsAction(); 
      
      let filteredSuspects = fetchedSuspects;
      if (filter) { 
        const lowercasedFilter = filter.toLowerCase();
        filteredSuspects = fetchedSuspects.filter(s => 
          (s.fullName && s.fullName.toLowerCase().includes(lowercasedFilter)) ||
          (s.nickname && s.nickname.toLowerCase().includes(lowercasedFilter)) ||
          (s.gender && s.gender.toLowerCase().includes(lowercasedFilter)) ||
          (s.nationality && s.nationality.toLowerCase().includes(lowercasedFilter)) ||
          (s.residentialAddress && s.residentialAddress.toLowerCase().includes(lowercasedFilter)) ||
          (s.occupation && s.occupation.toLowerCase().includes(lowercasedFilter)) ||
          (s.assignedInvestigator && s.assignedInvestigator.toLowerCase().includes(lowercasedFilter)) ||
          (s.offences && s.offences.some(off => off.toLowerCase().includes(lowercasedFilter))) ||
          (s.phoneNumbers && s.phoneNumbers.some(pn => pn.includes(lowercasedFilter))) ||
          (s.custodyStatus && s.custodyStatus.toLowerCase().includes(lowercasedFilter))
        );
      }
      setSuspects(filteredSuspects);
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
  }, [filter]); 

  useEffect(() => {
    fetchSuspects();
  }, [fetchSuspects]); 

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
          <p className="ml-4 text-lg">Loading suspect records...</p>
        </div>
      ) : (
        <DataTable 
          columns={columns} 
          data={suspects}
          filterInputPlaceholder="Search suspects on this page..."
          onFilterChange={setFilter} 
          filterValue={filter}
          meta={{
            refreshData: fetchSuspects
          }}
        />
      )}
    </>
  );
}


export default function SuspectsPage() {
  return (
    <PageContainer title="Suspect Database">
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
        <Button asChild>
          <Link href="/suspects/new">
            <PlusCircle className="mr-2 h-4 w-4" /> Add New Suspect
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
          <SuspectsPageContent />
        </Suspense>
      </div>
    </PageContainer>
  );
}
