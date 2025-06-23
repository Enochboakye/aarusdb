"use client";
import React from 'react'; // Import React for Suspense
import { PageContainer } from '@/components/page-container';
import { SuspectForm, } from '@/components/suspect-form';
import {SuspectFormValues } from '@/types/suspect'
import { UserPlus, Loader2 } from 'lucide-react'; // Import Loader2
import { createSuspectAction } from '../actions';

export default function NewSuspectPage() {
  
  const handleSubmit = async (data: SuspectFormValues) => {
    return createSuspectAction(data);
  };

  return (
    <React.Suspense fallback={
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading page...</p>
      </div>
    }>
      <PageContainer className="max-w-5xl mx-auto">
        <div className="bg-card p-6 md:p-8 rounded-lg shadow-lg">
          <div className="flex items-center mb-6">
            <UserPlus className="h-8 w-8 mr-3 text-primary" />
            <h2 className="text-2xl font-semibold">Suspect Information Form</h2>
          </div>
          <p className="text-muted-foreground mb-6">
            Please fill in all required fields (*) accurately. This information is critical for investigations.
          </p>
          <React.Suspense fallback={
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <p className="ml-4 text-lg">Loading form...</p>
            </div>
          }>
            <SuspectForm onSubmitForm={handleSubmit} isEditMode={false} />
          </React.Suspense>
        </div>
      </PageContainer>
    </React.Suspense>
  );
}
