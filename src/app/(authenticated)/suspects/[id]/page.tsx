"use client";

import React, { useEffect, useState } from 'react'; 
import { PageContainer } from '@/components/page-container';
import type { Suspect } from '@/types/suspect';
import { notFound, useRouter, useParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Edit, ArrowLeft, CalendarDays, MapPin, Briefcase, Mail, Phone as PhoneIconLucide, Languages, FileText, User as UserIcon, BookCopy, Gavel, Users, Building, Palette, Sparkles, Eye as EyeIcon, ClipboardList, Landmark, Ruler,  Link2, Loader2, Printer } from 'lucide-react'; 
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { format, parseISO, } from 'date-fns';
import { db } from '@/lib/firebase';
import { doc, getDoc, Timestamp } from 'firebase/firestore';

import { useToast } from '@/hooks/use-toast';
// Removed: import { SuspectPrintLayout } from '@/components/suspect-print-layout'; 
// Removed: import { useReactToPrint } from 'react-to-print'; 

// Helper to check if a value is a Firestore Timestamp
function isFirestoreTimestamp(value: unknown): value is Timestamp {
  return typeof value === 'object' && value !== null && typeof (value as { toDate?: unknown }).toDate === 'function';
}

interface DetailItemProps {
  icon: React.ElementType;
  label: string;
  value?: string | number | boolean | null | string[];
  isBoolean?: boolean;
  isLongText?: boolean;
  isList?: boolean;
}

const DetailItem: React.FC<DetailItemProps> = ({ icon: Icon, label, value, isBoolean = false, isLongText = false, isList = false }) => {
  if (value === null || typeof value === 'undefined' || (Array.isArray(value) && value.length === 0) || (typeof value === 'string' && value.trim() === '')) return null;

  let displayValue: React.ReactNode;
  if (isBoolean) {
    displayValue = value ? 'Yes' : 'No';
  } else if (isList && Array.isArray(value)) {
    displayValue = (
      <ul className="list-disc list-inside space-y-1">
        {value.map((item, index) => (
          <li key={index} className="text-base text-foreground">{item.replace(/\s*\([\w\s]+\)$/, '')}</li>
        ))}
      </ul>
    );
  } else if (Array.isArray(value)) {
    displayValue = value.map(item => item.replace(/\s*\([\w\s]+\)$/, '')).join(', ');
  } else if (typeof value === 'string' && (label.toLowerCase().includes("date of birth") || label.toLowerCase().includes("record created at") || label.toLowerCase().includes("last updated at"))) {
     try {
        const parsedDate = parseISO(value);
        if (label.toLowerCase().includes("date of birth")) {
             displayValue = format(parsedDate, "PPP");
        } else {
            displayValue = format(parsedDate, "PPP p");
        }
     } catch  {
        console.warn(`Could not parse date for ${label}: ${value}`);
        displayValue = value;
     }
  } else {
    displayValue = String(value);
  }

  return (
    <div className="flex items-start space-x-3 py-2">
      <Icon className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
      <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {isLongText || isList || (Array.isArray(value) && value.length > 1) ? (
             <div className="text-base text-foreground whitespace-pre-wrap">{displayValue}</div>
        ) : (
            <p className="text-base text-foreground">{displayValue}</p>
        )}
      </div>
    </div>
  );
};

const ImageDisplayCard: React.FC<{ title: string; imageUrl?: string; hint: string }> = ({ title, imageUrl, hint }) => {
    return (
        <div className="flex flex-col items-center">
            <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
            <Image
                src={imageUrl || "https://placehold.co/150x150.png"}
                alt={title}
                width={150}
                height={150}
                className="rounded-md border shadow-sm object-cover aspect-square"
                data-ai-hint={hint}
            />
        </div>
    );
};


export default function ViewSuspectPage() {
  const router = useRouter();
  const { toast } = useToast();
  const params = useParams();
  const suspectId = params.id as string;

  const [suspect, setSuspect] = useState<Suspect | null>(null);
  const [loading, setLoading] = useState(true);

  // Removed printComponentRef and handlePrint related to useReactToPrint

  useEffect(() => {
    if (!suspectId) {
      setLoading(false);
      notFound();
      return;
    }

    const fetchSuspectData = async () => {
      setLoading(true);
      try {
        const suspectDocRef = doc(db, "suspectdata", suspectId);
        const docSnap = await getDoc(suspectDocRef);

        if (docSnap.exists()) {
          const rawData = docSnap.data();
          
          const processedData: Partial<Suspect> = {
            id: docSnap.id,
            ...rawData,
          };

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
          console.log(`No suspect found with ID: ${suspectId}`);
          notFound();
        }
      } catch (error) {
        console.error("Error fetching suspect data (client-side):", error);
        toast({
          title: "Error",
          description: "Could not load suspect details.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchSuspectData();
  }, [suspectId, toast]);


  if (loading) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </PageContainer>
    );
  }

  if (!suspect) {
    return <PageContainer><p>The requested suspect could not be found.</p></PageContainer>;
  }

  return (
    <>
    <PageContainer
      className="max-w-6xl mx-auto mt-4"
    >
       <div className="flex space-x-2 mb-6 justify-end -mt-16 pt-1 pr-1 sticky top-16 bg-background py-3 z-30">
          <Button asChild>
            <Link href={`/suspects/${suspect.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" /> Edit Record
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/suspects/${suspect.id}/print`} target="_blank" rel="noopener noreferrer">
              <Printer className="mr-2 h-4 w-4" /> Print Record
            </Link>
          </Button>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader className="items-center">
                <CardTitle className="text-2xl font-bold text-primary text-center mt-12">{suspect.fullName}</CardTitle>
                {suspect.nickname && <p className="text-lg text-muted-foreground text-center">&quot;{suspect.nickname}&quot;</p>}
                 <Badge variant={suspect.gender === 'Male' ? 'default' : suspect.gender === 'Female' ? 'secondary' : 'outline'} className="mt-2">
                    {suspect.gender}
                </Badge>
            </CardHeader>
            <CardContent className="pt-2">
                <div className="flex flex-col items-center space-y-4">
                     <ImageDisplayCard title="Suspect Image" imageUrl={suspect.profileImageUrl} hint="person mugshot" />
                </div>
            </CardContent>
          </Card>
           <Card>
            <CardHeader><CardTitle className="text-lg">Contact & Identification</CardTitle></CardHeader>
            <CardContent>
              <DetailItem icon={PhoneIconLucide} label="Phone Numbers" value={suspect.phoneNumbers} isList />
              <DetailItem icon={Mail} label="Email Address" value={suspect.emailAddress} />
              <DetailItem icon={Languages} label="Languages Spoken" value={suspect.languagesSpoken} />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">Personal & Professional Details</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              <DetailItem icon={CalendarDays} label="Date of Birth" value={suspect.dateOfBirth} />
              <DetailItem icon={MapPin} label="Place of Birth" value={suspect.placeOfBirth} />
              <DetailItem icon={Building} label="Hometown" value={suspect.hometown} />
              <DetailItem icon={MapPin} label="Nationality" value={suspect.nationality} />
              <DetailItem icon={BookCopy} label="Level of Education" value={suspect.educationLevel} />
              <DetailItem icon={Users} label="Marital Status" value={suspect.maritalStatus} />
              <DetailItem icon={Briefcase} label="Occupation" value={suspect.occupation} />
  
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Appearance & Lifestyle</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                <DetailItem icon={Ruler} label="Height" value={suspect.height} />
                <DetailItem icon={Palette} label="Skin Tone" value={suspect.skinTone} />
                <DetailItem icon={Sparkles} label="Hair Style" value={suspect.hairStyle} />
                <DetailItem icon={Palette} label="Hair Color" value={suspect.hairColor} />
                <DetailItem icon={EyeIcon} label="Eye Color" value={suspect.eyeColor} />
                <DetailItem icon={FileText} label="Physical Marks" value={suspect.physicalMarks} isList />
              </div>
              <Separator className="my-3" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                <DetailItem icon={UserIcon} label="Smokes" value={suspect.smokes} isBoolean />
                <DetailItem icon={UserIcon} label="Drinks Alcohol" value={suspect.drinksAlcohol} isBoolean />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Address Information</CardTitle></CardHeader>
            <CardContent>
              <DetailItem icon={MapPin} label="Residential Address" value={suspect.residentialAddress} isLongText />
            </CardContent>
          </Card>

          {suspect.offences && suspect.offences.length > 0 && (
             <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Gavel className="mr-2 h-5 w-5 text-destructive" />
                    Nature of Offence(s)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <DetailItem icon={FileText} label="" value={suspect.offences} isList/>
                </CardContent>
              </Card>
          )}

          {suspect.linkedCaseRoNumbers && suspect.linkedCaseRoNumbers.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Link2 className="mr-2 h-5 w-5 text-primary" />
                  Linked Case R.O. Numbers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="list-disc list-inside space-y-1">
                  {suspect.linkedCaseRoNumbers.map((roNum, index) => (
                    <li key={index} className="text-base text-foreground">{roNum}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="text-lg">Custody & Status</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              <DetailItem icon={ClipboardList} label="Custody Status" value={suspect.custodyStatus} />
              <DetailItem icon={Landmark} label="Custody Location (Cell/Unit)" value={suspect.custodyLocation} isLongText />
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Record Administration</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              <DetailItem icon={CalendarDays} label="Record Created At" value={suspect.createdAt} />
              <DetailItem icon={UserIcon} label="Created By (Officer)" value={suspect.createdBy} />
              {suspect.updatedAt && <DetailItem icon={CalendarDays} label="Last Updated At" value={suspect.updatedAt} />}
              {suspect.updatedBy && <DetailItem icon={UserIcon} label="Updated By (Officer)" value={suspect.updatedBy} />}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="mt-8">
        <Button variant="outline" onClick={() => router.push('/dashboard')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
        </Button>
      </div>
      
      {/* Removed hidden SuspectPrintLayout for react-to-print */}
    </PageContainer>
    </>
  );
}
    

    