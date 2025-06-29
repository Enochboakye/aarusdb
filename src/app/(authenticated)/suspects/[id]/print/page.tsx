"use client";

import { useEffect, useRef, useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import type { Suspect } from '@/types/suspect';
import { db } from '@/lib/firebase';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { SuspectPrintLayout } from '@/components/suspect-print-layout';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useReactToPrint } from 'react-to-print';

// Helper to check if a value is a Firestore Timestamp
function isFirestoreTimestamp(value: unknown): value is Timestamp {
  return typeof value === 'object' && value !== null && typeof (value as { toDate?: unknown }).toDate === 'function';
}

export default function SuspectPrintPage() {
  const params = useParams();
  const suspectId = params.id as string;
  const { toast } = useToast();

  const [suspect, setSuspect] = useState<Suspect | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const contentRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
     contentRef,
    documentTitle: suspect ? `Suspect Profile - ${suspect.fullName}` : "Suspect Profile",
  });

  useEffect(() => {
    if (!suspectId) {
      setError("Suspect ID is missing.");
      setLoading(false);
      notFound();
      return;
    }

    const fetchSuspectData = async () => {
      setLoading(true);
      setError(null);
      try {
        const suspectDocRef = doc(db, "suspectdata", suspectId);
        const docSnap = await getDoc(suspectDocRef);

        if (docSnap.exists()) {
          const rawData = docSnap.data();
          const processedData: Partial<Suspect> = { id: docSnap.id, ...rawData };

          if (isFirestoreTimestamp(rawData.createdAt)) processedData.createdAt = rawData.createdAt.toDate().toISOString();
          else if (typeof rawData.createdAt === 'string') processedData.createdAt = rawData.createdAt;

          if (isFirestoreTimestamp(rawData.updatedAt)) processedData.updatedAt = rawData.updatedAt.toDate().toISOString();
          else if (typeof rawData.updatedAt === 'string') processedData.updatedAt = rawData.updatedAt;
          
          if (isFirestoreTimestamp(rawData.dateOfBirth)) processedData.dateOfBirth = rawData.dateOfBirth.toDate().toISOString();
          else if (typeof rawData.dateOfBirth === 'string') processedData.dateOfBirth = rawData.dateOfBirth;

          processedData.phoneNumbers = Array.isArray(rawData.phoneNumbers) ? rawData.phoneNumbers : 
                                       (typeof rawData.phoneNumber === 'string' ? [rawData.phoneNumber] : []);
          processedData.offences = Array.isArray(rawData.offences) ? rawData.offences : 
                                   (typeof rawData.offence === 'string' ? [rawData.offence] : []);
          processedData.physicalMarks = Array.isArray(rawData.physicalMarks) ? rawData.physicalMarks : [];
          processedData.linkedCaseRoNumbers = Array.isArray(rawData.linkedCaseRoNumbers) ? rawData.linkedCaseRoNumbers : [];
          processedData.documentUrls = Array.isArray(rawData.documentUrls) ? rawData.documentUrls : [];

          delete (processedData as Record<string, unknown>).phoneNumber;
          delete (processedData as Record<string, unknown>).offence;

          setSuspect(processedData as Suspect);
        } else {
          setError(`No suspect found with ID: ${suspectId}`);
          notFound();
        }
      } catch (fetchError) {
        console.error("Error fetching suspect data for print:", fetchError);
        setError("Could not load suspect details for printing.");
        toast({ title: "Error", description: "Failed to load data for printing.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };

    fetchSuspectData();
  }, [suspectId, toast]);

  useEffect(() => {
    if (suspect && !loading && !error) {
      document.title = `Suspect Profile - ${suspect.fullName}`;
      const timer = setTimeout(() => {
        handlePrint?.();
      }, 500);
      return () => clearTimeout(timer);
    } else if (!loading && (error || !suspect)) {
      document.title = "Error Printing Suspect Profile";
    } else if (loading) {
      document.title = "Loading Suspect Profile for Print...";
    }
  }, [suspect, loading, error, handlePrint]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-lg">Loading suspect details for printing...</p>
        <p className="text-sm text-muted-foreground">Please wait.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-destructive p-4">
        <h1 className="text-xl font-semibold mb-2">Error Preparing Print</h1>
        <p>{error}</p>
        <p className="mt-4 text-sm text-muted-foreground">You can close this window.</p>
      </div>
    );
  }

  if (!suspect) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground p-4">
        <h1 className="text-xl font-semibold">Suspect Not Found</h1>
        <p className="mt-4 text-sm text-muted-foreground">The requested suspect could not be found.</p>
        <p className="text-sm text-muted-foreground">You can close this window.</p>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          body {
            background-color: #fff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print { 
            display: none !important;
          }
        }
        body {
          background-color: hsl(var(--background));
          color: hsl(var(--foreground));
        }
      `}</style>
      <div className="print-preview-container bg-background text-foreground p-4 md:p-8">
        <p className="text-center text-muted-foreground mb-4 no-print">
          Preparing print preview... The print dialog should appear automatically. If it doesn&#39;t, please use your browser&#39;s print function (Ctrl/Cmd + P).
        </p>
        <div ref={contentRef} className='p-4'>
          <SuspectPrintLayout suspect={suspect} />
        </div>
      </div>
    </>
  );
}
