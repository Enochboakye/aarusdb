
"use client"; 

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react'; 
import { PageContainer } from '@/components/page-container';
import type { Case } from '@/types/case';
import type { Suspect } from '@/types/suspect';
import { notFound, useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Edit, ArrowLeft, CalendarDays, MapPin, Phone,  FileText,
    User as UserIcon, Gavel, Users, ShieldCheck, ShieldAlert,
   ShieldQuestion, Paperclip, UserSquare, Users2, ExternalLink} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { format, parseISO } from 'date-fns';
import { fetchCaseAction } from '../actions';
import { db } from '@/lib/firebase'; 
import { doc, getDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils'; 

interface DetailItemProps {
  icon: React.ElementType;
  label: string;
  value?: string | number | boolean | null | ReactNode;
  isBoolean?: boolean;
  isLongText?: boolean;
  className?: string;
}

const DetailItem: React.FC<DetailItemProps> = ({ icon: Icon, label, value, isBoolean = false, isLongText = false, className }) => {
  if (value === null || typeof value === 'undefined' || (typeof value === 'string' && value.trim() === '')) return null;
  
  let displayValue: ReactNode = value;
  if (isBoolean) {
    displayValue = value ? 'Yes' : 'No';
  } else if (typeof value === 'string' && (label.toLowerCase().includes("date") || label.toLowerCase().includes("created at") || label.toLowerCase().includes("updated at"))) {
     try {
        const parsedDate = parseISO(value); 
        displayValue = format(parsedDate, "PPP p"); 
        if (label.toLowerCase().includes("date of birth") || label === "Date Reported" || label === "Date Occurred") {
             displayValue = format(parsedDate, "PPP"); 
        }
     } catch { /* ignore */ }
  } else if (typeof value === 'number' && label === "Year") {
    displayValue = String(value);
  }


  return (
    <div className={cn("flex items-start space-x-3 py-2", className)}>
      <Icon className="h-5 w-5 text-primary mt-1 flex-shrink-0" />
      <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        {isLongText ? (
             <div className="text-base text-foreground whitespace-pre-wrap">{displayValue}</div>
        ) : (
            <div className="text-base text-foreground">{displayValue}</div>
        )}
      </div>
    </div>
  );
};


const getStatusBadgeVariant = (status?: Case['status']) => {
  if (!status) return 'outline';
  switch (status) {
    case 'Open': return 'default';
    case 'Under Investigation': return 'secondary';
    case 'Pending': return 'outline';
    case 'Closed': return 'destructive';
    case 'Cold Case': return 'outline';
    default: return 'outline';
  }
};

const getPriorityIcon = (priority?: Case['priority']) => {
    if (!priority) return null;
    switch(priority) {
        case 'High': return <ShieldAlert className="h-5 w-5 text-destructive" />;
        case 'Medium': return <ShieldCheck className="h-5 w-5 text-yellow-500" />;
        case 'Low': return <ShieldQuestion className="h-5 w-5 text-green-600" />;
        default: return null;
    }
};

interface LinkedSuspectItemProps {
  suspectId: string;
}

const LinkedSuspectItem: React.FC<LinkedSuspectItemProps> = ({ suspectId }) => {
  const [suspectName, setSuspectName] = useState<string | null>(null);
  const [loadingName, setLoadingName] = useState(true); 

  useEffect(() => {
    const fetchSuspectName = async () => {
      setLoadingName(true);
      try {
        const suspectDocRef = doc(db, "suspectdata", suspectId);
        const docSnap = await getDoc(suspectDocRef);
        if (docSnap.exists()) {
          setSuspectName((docSnap.data() as Suspect).fullName);
        } else {
          setSuspectName("Unknown Suspect");
        }
      } catch (error) {
        console.error("Error fetching suspect name:", error);
        setSuspectName("Error loading name");
      } finally {
        setLoadingName(false);
      }
    };
    fetchSuspectName();
  }, [suspectId]);

  if (loadingName) {
    return <div className="flex items-center space-x-2 text-sm"><Loader2 className="h-4 w-4 animate-spin" /> <span>Loading suspect...</span></div>;
  }

  return (
    <Link href={`/suspects/${suspectId}`} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-primary hover:underline">
      <span>{suspectName || `ID: ${suspectId.substring(0,8)}...`}</span>
      <ExternalLink className="h-4 w-4" />
    </Link>
  );
};


export default function ViewCasePage() {
  const params = useParams();
  const caseId = params.id as string;
  const router = useRouter();
  const { toast } = useToast();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (caseId) {
      const loadCaseData = async () => {
        setLoading(true);
        try {
          const data = await fetchCaseAction(caseId);
          if (data) {
            setCaseData(data);
          } else {
            notFound();
          }
        } catch (error) {
          console.error("Error fetching case data:", error);
          toast({ title: "Error", description: "Could not load case details.", variant: "destructive" });
        } finally {
          setLoading(false);
        }
      };
      loadCaseData();
    } else {
      notFound();
    }
  }, [caseId, toast]);


  if (loading) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </PageContainer>
    );
  }

  if (!caseData) {
    return <PageContainer><p>The requested case could not be found.</p></PageContainer>;
  }

  return (
    <PageContainer  className="max-w-6xl mx-auto    ">
       <div className="flex space-x-2 mb-6 justify-end mt-16 pt-1 pr-1 sticky top-16 bg-background py-3 z-30">
          <Button variant="outline" onClick={() => router.push('/cases')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Cases
          </Button>
          <Button asChild>
            <Link href={`/cases/${caseData.id}/edit`}>
              <Edit className="mr-2 h-4 w-4" /> Edit Case
            </Link>
          </Button>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader>
                <CardTitle className="text-xl flex items-center justify-between">
                    <span>R.O. Number: {caseData.roNumber}</span>
                    {getPriorityIcon(caseData.priority)}
                </CardTitle>
                <CardDescription>Year: {caseData.year}</CardDescription>
            </CardHeader>
            <CardContent>
              <Badge variant={getStatusBadgeVariant(caseData.status)} className="text-sm mb-4">{caseData.status}</Badge>
              <DetailItem icon={Gavel} label="Offence Type" value={caseData.offence} />
              <DetailItem icon={UserIcon} label="Assigned Investigator" value={caseData.assignedInvestigator} />
              <DetailItem icon={CalendarDays} label="Date Reported" value={caseData.dateReported} />
              {caseData.dateOccurred && <DetailItem icon={CalendarDays} label="Date Occurred" value={caseData.dateOccurred} />}
              {caseData.locationOfOffence && <DetailItem icon={MapPin} label="Location of Offence" value={caseData.locationOfOffence} />}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-lg flex items-center"><UserSquare className="mr-2 h-5 w-5"/>Complainant</CardTitle></CardHeader>
            <CardContent>
                <DetailItem icon={UserIcon} label="Name" value={caseData.complainant}/>
               
                {/* Statement Summary is not available on complainant */}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">Brief Facts of Case</CardTitle></CardHeader>
            <CardContent>
              <p className="text-foreground whitespace-pre-wrap">{caseData.briefFacts}</p>
            </CardContent>
          </Card>

          {caseData.suspectLinks && caseData.suspectLinks.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center"><Users className="mr-2 h-5 w-5"/>Linked Suspects</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {caseData.suspectLinks.map(link => (
                    <li key={link.id} className="text-base">
                      <LinkedSuspectItem suspectId={link.id} />
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {caseData.witnesses && caseData.witnesses.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center"><Users2 className="mr-2 h-5 w-5"/>Witnesses</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {caseData.witnesses.map((witness, index) => (
                  <div key={witness.id || index}>
                    <p className="font-semibold text-md">{witness.name}</p>
                    {witness.contact && <DetailItem icon={Phone} label="Contact" value={witness.contact} className="py-0.5"/>}
                    {witness.address && <DetailItem icon={MapPin} label="Address" value={witness.address} isLongText className="py-0.5"/>}
                    {index < caseData.witnesses.length - 1 && <Separator className="my-3"/>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          
          {caseData.exhibits && caseData.exhibits.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-lg flex items-center"><Paperclip className="mr-2 h-5 w-5"/>Exhibits</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {caseData.exhibits.map(exhibit => (
                  <div key={exhibit.id} className="group block">
                    <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full flex flex-col">
                      <a href={exhibit.url} target="_blank" rel="noopener noreferrer" className="block">
                        {exhibit.type.startsWith("image/") ? (
                          <Image src={exhibit.url} alt={exhibit.name} width={200} height={150} className="w-full h-32 object-cover" data-ai-hint="evidence document" />
                        ) : (
                          <div className="h-32 flex flex-col items-center justify-center bg-muted">
                            <FileText className="h-12 w-12 text-muted-foreground" />
                          </div>
                        )}
                      </a>
                      <CardContent className="p-3 flex-grow flex flex-col justify-between">
                        <div>
                          <a href={exhibit.url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium truncate group-hover:underline" title={exhibit.name}>{exhibit.name}</a>
                          <p className="text-xs text-muted-foreground">{exhibit.type}</p>
                        </div>
                        {exhibit.description && (
                          <p className="text-xs text-muted-foreground mt-1 pt-1 border-t border-border">
                            <span className="font-medium text-foreground">Desc: </span>{exhibit.description}
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}


          <Card>
            <CardHeader><CardTitle className="text-lg">Record Administration</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
              <DetailItem icon={CalendarDays} label="Record Created At" value={caseData.createdAt} />
              <DetailItem icon={UserIcon} label="Created By" value={caseData.createdBy} />
              {caseData.updatedAt && <DetailItem icon={CalendarDays} label="Last Updated At" value={caseData.updatedAt} />}
              {caseData.updatedBy && <DetailItem icon={UserIcon} label="Updated By" value={caseData.updatedBy} />}
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}

