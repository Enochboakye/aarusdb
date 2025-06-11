
"use client";

import { PageContainer } from '@/components/page-container';
import { CaseForm, type CaseFormValues } from '@/components/case-form';
import type { Case } from '@/types/case';
import { Edit3, Loader2 } from 'lucide-react'; 
import { notFound, useParams } from 'next/navigation'; 
import React from 'react';
import { updateCaseAction, fetchCaseAction } from '../../actions';
import { toast } from '@/hooks/use-toast';

export default function EditCasePage() {
  const params = useParams(); 
  const caseId = params.id as string; 

  const [caseData, setCaseData] = React.useState<Case | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (caseId) {
      fetchCaseAction(caseId).then(data => {
        if (data) {
          setCaseData(data);
        } else {
          notFound(); 
        }
        setLoading(false);
      }).catch(err => {
        console.error("Failed to fetch case data for editing:", err);
        toast({ title: "Error", description: "Could not load case data.", variant: "destructive" });
        setLoading(false);
        notFound();
      });
    } else {
      setLoading(false); 
      notFound(); 
    }
  }, [caseId]); 

  if (loading) {
    return (
        <PageContainer title="Loading Case Data..." className="max-w-5xl mx-auto">
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        </PageContainer>
    );
  }

  if (!caseData) {
    notFound(); 
  }
  
  const handleSubmit = async (data: CaseFormValues) => {
    return updateCaseAction(caseId, data);
  };

  return (
    <PageContainer title={`Edit Case: ${caseData.roNumber}`} className="max-w-5xl mx-auto">
       <div className="bg-card p-6 md:p-8 rounded-lg shadow-lg">
        <div className="flex items-center mb-6">
          <Edit3 className="h-8 w-8 mr-3 text-primary" />
          <h2 className="text-2xl font-semibold">Update Case Information</h2>
        </div>
         <p className="text-muted-foreground mb-6">
          Modify the details for case <span className="font-semibold text-primary">{caseData.roNumber}</span>. Ensure all information is current and accurate.
        </p>
        <CaseForm 
            initialData={caseData} 
            onSubmitForm={handleSubmit} 
            isEditMode={true} 
        />
      </div>
    </PageContainer>
  );
}
