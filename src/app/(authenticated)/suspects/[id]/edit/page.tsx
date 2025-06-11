
"use client";
import { PageContainer } from '@/components/page-container';
import { SuspectForm, type SuspectFormValues } from '@/components/suspect-form';
import type { Suspect } from '@/types/suspect';
import { Edit3, Loader2 } from 'lucide-react';
import { notFound, useParams } from 'next/navigation';
import React from 'react';
import { updateSuspectAction } from '../../actions';
import { db } from '@/lib/firebase';
import { doc, getDoc, type Timestamp } from 'firebase/firestore'; // Import Timestamp type
import { toast } from '@/hooks/use-toast';

// Helper to check if a value is a Firestore Timestamp
function isFirestoreTimestamp(value: unknown): value is Timestamp {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { toDate?: unknown }).toDate === 'function'
  );
}

async function fetchSuspectClientSide(id: string): Promise<Suspect | null> {
  try {
    const suspectDocRef = doc(db, "suspectdata", id);
    const docSnap = await getDoc(suspectDocRef);
    if (docSnap.exists()) {
      const rawData = docSnap.data();
      
      const processedData: Partial<Suspect> & { id: string } = {
        id: docSnap.id,
        ...rawData,
      };

      // Convert Timestamps to ISO strings
      if (isFirestoreTimestamp(rawData.createdAt)) {
        processedData.createdAt = rawData.createdAt.toDate().toISOString();
      } else if (typeof rawData.createdAt === 'string') {
        processedData.createdAt = rawData.createdAt;
      }

      if (isFirestoreTimestamp(rawData.updatedAt)) {
        processedData.updatedAt = rawData.updatedAt.toDate().toISOString();
      } else if (typeof rawData.updatedAt === 'string') {
        processedData.updatedAt = rawData.updatedAt;
      }
      
      if (isFirestoreTimestamp(rawData.dateOfBirth)) {
        processedData.dateOfBirth = rawData.dateOfBirth.toDate().toISOString();
      } else if (typeof rawData.dateOfBirth === 'string') {
        processedData.dateOfBirth = rawData.dateOfBirth;
      }

      // Ensure array fields are initialized and handle legacy single string fields
      processedData.phoneNumbers = Array.isArray(rawData.phoneNumbers) ? rawData.phoneNumbers : 
                                   (typeof rawData.phoneNumber === 'string' ? [rawData.phoneNumber] : []);
      processedData.offences = Array.isArray(rawData.offences) ? rawData.offences : 
                               (typeof rawData.offence === 'string' ? [rawData.offence] : []);
      processedData.physicalMarks = Array.isArray(rawData.physicalMarks) ? rawData.physicalMarks : [];
      processedData.linkedCaseRoNumbers = Array.isArray(rawData.linkedCaseRoNumbers) ? rawData.linkedCaseRoNumbers : [];
      processedData.documentUrls = Array.isArray(rawData.documentUrls) ? rawData.documentUrls : [];


      // Remove legacy single fields if they were part of rawData
      delete (processedData as Record<string, unknown>).phoneNumber;
      delete (processedData as Record<string, unknown>).offence;

      return processedData as Suspect;
    }
    return null;
  } catch (error) {
    console.error("Error fetching suspect data (client-side):", error);
    toast({
      title: "Error",
      description: "Could not load suspect data for editing.",
      variant: "destructive",
    });
    return null;
  }
}

export default function EditSuspectPage() {
  const params = useParams(); 
  const suspectId = params.id as string; 

  const [suspectData, setSuspectData] = React.useState<Suspect | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (suspectId) {
      fetchSuspectClientSide(suspectId).then(data => {
        if (data) {
          setSuspectData(data);
        } else {
          notFound(); 
        }
        setLoading(false);
      });
    } else {
      setLoading(false); 
      notFound(); 
    }
  }, [suspectId]);

  if (loading) {
    return (
        <PageContainer title="Loading Suspect Data..." className="max-w-5xl mx-auto">
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
        </PageContainer>
    );
  }

  if (!suspectData) {
    notFound();
  }
  
  const handleSubmit = async (data: SuspectFormValues) => {
    return updateSuspectAction(suspectId, data);
  };

  return (
    <PageContainer title={`Edit Suspect: ${suspectData.fullName}`} className="max-w-5xl mx-auto">
       <div className="bg-card p-6 md:p-8 rounded-lg shadow-lg">
        <div className="flex items-center mb-6">
          <Edit3 className="h-8 w-8 mr-3 text-primary" />
          <h2 className="text-2xl font-semibold">Update Suspect Information</h2>
        </div>
         <p className="text-muted-foreground mb-6">
          Modify the details for suspect <span className="font-semibold text-primary">{suspectData.fullName}</span>. Ensure all information is current and accurate.
        </p>
        <SuspectForm 
            initialData={suspectData} 
            onSubmitForm={handleSubmit} 
            isEditMode={true} 
        />
      </div>
    </PageContainer>
  );
}
