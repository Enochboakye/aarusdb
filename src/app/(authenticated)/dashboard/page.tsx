
"use client";

import { useEffect, useState } from 'react';
import { PageContainer } from '@/components/page-container';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where, getCountFromServer } from 'firebase/firestore';
import { Briefcase, Users, UserCheck, ShieldAlert, AlertTriangle, Loader2 } from 'lucide-react'; 
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { CustodyStatus } from '@/types/suspect'; 

interface DashboardStats {
  totalCases: number;
  totalSuspects: number;
  suspectsByGender: { male: number; female: number; other: number };
  activeInvestigations: number; 
  highPriorityCases: number; 
  suspectsInPoliceCustody: number;
  suspectsRemandedPolice: number;
  suspectsRemandedPrison: number;
  suspectsOnCourtBail: number;
  suspectsOnPoliceBail: number;
}

const initialStats: DashboardStats = {
  totalCases: 0,
  totalSuspects: 0,
  suspectsByGender: { male: 0, female: 0, other: 0 },
  activeInvestigations: 0,
  highPriorityCases: 0,
  suspectsInPoliceCustody: 0,
  suspectsRemandedPolice: 0,
  suspectsRemandedPrison: 0,
  suspectsOnCourtBail: 0,
  suspectsOnPoliceBail: 0,
};

interface SuspectForStats {
  gender?: 'Male' | 'Female' | 'Other';
  custodyStatus?: CustodyStatus; 
}


export default function DataAnalysisDashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const casesCollectionRef = collection(db, "cases");
        const suspectsCollectionRef = collection(db, "suspectdata");

        // Fetch Case Statistics
        const totalCasesSnapshot = await getCountFromServer(casesCollectionRef);
        const totalCases = totalCasesSnapshot.data().count;

        const activeInvestigationsQuery = query(casesCollectionRef, where("status", "in", ["Open", "Under Investigation"]));
        const activeInvestigationsSnapshot = await getCountFromServer(activeInvestigationsQuery);
        const activeInvestigations = activeInvestigationsSnapshot.data().count;
        
        const highPriorityCasesQuery = query(casesCollectionRef, where("priority", "==", "High"));
        const highPriorityCasesSnapshot = await getCountFromServer(highPriorityCasesQuery);
        const highPriorityCases = highPriorityCasesSnapshot.data().count;

        // Fetch Suspect Statistics
        const suspectsDocsSnapshot = await getDocs(suspectsCollectionRef);
        const totalSuspects = suspectsDocsSnapshot.size;
        
        const allSuspectsData = suspectsDocsSnapshot.docs.map(doc => doc.data() as SuspectForStats);

        let maleCount = 0;
        let femaleCount = 0;
        let otherGenderCount = 0;
        
        let inPoliceCustodyCount = 0;
        let remandedPoliceCount = 0;
        let remandedPrisonCount = 0;
        let onCourtBailCount = 0;
        let onPoliceBailCount = 0;


        allSuspectsData.forEach(suspect => {
          if (suspect.gender === 'Male') maleCount++;
          else if (suspect.gender === 'Female') femaleCount++;
          else otherGenderCount++;

          switch (suspect.custodyStatus) {
            case 'Police Custody (Active Investigation)':
              inPoliceCustodyCount++;
              break;
            case 'Remanded (Police Custody)':
              remandedPoliceCount++;
              break;
            case 'Remanded (Prison Custody)':
              remandedPrisonCount++;
              break;
            case 'Bail (Court)':
              onCourtBailCount++;
              break;
            case 'Bail (Police Enquiry)':
              onPoliceBailCount++;
              break;
          }
        });
        
        setStats({
          totalCases,
          totalSuspects,
          suspectsByGender: { male: maleCount, female: femaleCount, other: otherGenderCount },
          activeInvestigations,
          highPriorityCases,
          suspectsInPoliceCustody: inPoliceCustodyCount,
          suspectsRemandedPolice: remandedPoliceCount,
          suspectsRemandedPrison: remandedPrisonCount,
          suspectsOnCourtBail: onCourtBailCount,
          suspectsOnPoliceBail: onPoliceBailCount,
        });

      } catch (err) {
        console.error("Error fetching dashboard stats:", err);
        setError("Failed to load dashboard data. Please try again.");
        toast({
          title: "Error Loading Data",
          description: "Could not fetch statistics for the dashboard.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [toast]);


  if (loading) {
    return (
      <PageContainer>
        <div className="flex justify-center items-center h-[calc(100vh-10rem)]">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
          <p className="ml-4 text-xl">Loading Dashboard Data...</p>
        </div>
      </PageContainer>
    );
  }

  if (error) {
    return (
       <PageContainer>
        <div className="flex flex-col items-center justify-center h-64 bg-destructive/10 p-6 rounded-lg border border-destructive">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <p className="text-lg text-destructive font-semibold">Error Loading Dashboard</p>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </PageContainer>
    )
  }
  
  const StatCard = ({ title, value, icon: Icon, description, className, textColorClassName = "text-foreground", mutedColorClassName = "text-muted-foreground", iconColorClassName = "text-primary" }: { title: string, value: string | number, icon: React.ElementType, description?: string, className?: string, textColorClassName?: string, mutedColorClassName?: string, iconColorClassName?: string }) => (
    <Card className={cn("hover:shadow-lg transition-shadow", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4 px-4">
        <CardTitle className={cn("text-xs font-medium", mutedColorClassName)}>{title}</CardTitle>
        <Icon className={cn("h-4 w-4", iconColorClassName)} />
      </CardHeader>
      <CardContent className="pt-1 pb-4 px-4">
        <div className={cn("text-2xl font-bold", textColorClassName)}>{value}</div>
        {description && <p className={cn("text-xs pt-0.5", mutedColorClassName)}>{description}</p>}
      </CardContent>
    </Card>
  );


  return (
    <PageContainer className='justify-items-center items-center mt-4'>
      <div className="space-y-6 max-w-5xl mx-auto">
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          <StatCard 
            title="Total Cases" 
            value={stats.totalCases} 
            icon={Briefcase} 
            description="All registered cases" 
            className="bg-pink-600/30 backdrop-blur-md backdrop-opacity-60 " 
            textColorClassName="text-primary-foreground" 
            mutedColorClassName="text-primary-foreground/80" 
            iconColorClassName="text-primary-foreground" 
          />
          <StatCard 
            title="Total Suspects" 
            value={stats.totalSuspects} 
            icon={Users} 
            description="Individuals in database" 
            className="bg-green-500"
            textColorClassName="text-primary-foreground" 
            mutedColorClassName="text-primary-foreground/80" 
            iconColorClassName="text-primary-foreground"
          />
          <StatCard 
            title="High Priority Cases" 
            value={stats.highPriorityCases} 
            icon={ShieldAlert} 
            description="Urgent cases" 
            className="bg-blue-500" 
            textColorClassName="text-primary-foreground" 
            mutedColorClassName="text-primary-foreground/80" 
            iconColorClassName="text-primary-foreground"
          />
           <StatCard 
            title="Police Custody" 
            value={stats.suspectsInPoliceCustody} 
            icon={UserCheck} 
            description="Active investigation" 
            className="bg-yellow-800" 
            textColorClassName="text-primary-foreground" 
            mutedColorClassName="text-primary-foreground/80" 
            iconColorClassName="text-primary-foreground"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="md:col-span-2">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className=" text-2xl">Key Metrics</CardTitle>
               <CardDescription className="text-xs">At a glance statistics</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1.5 pt-2 px-4 pb-4">
               <div className="flex items-center justify-between py-0.5  font-extrabold">
                <span className="text-xs text-muted-foreground">Male Suspects</span>
                <span className="text-xs font-semibold text-foreground">{stats.suspectsByGender.male}</span>
              </div>
              <div className="flex items-center justify-between py-0.5  font-extrabold">
                <span className="text-xs text-muted-foreground">Female Suspects</span>
                <span className="text-xs font-semibold text-foreground">{stats.suspectsByGender.female}</span>
              </div>
              <div className="flex items-center justify-between py-0.5 font-extrabold">
                <span className="text-xs text-muted-foreground">Other Gender Suspects</span>
                <span className="text-xs font-semibold text-foreground">{stats.suspectsByGender.other}</span>
              </div>
               <div className="border-t border-border my-1.5"></div>
               <div className="flex items-center justify-between py-0.5 font-extrabold">
                <span className="text-xs text-muted-foreground">Remanded (Police)</span>
                 <span className="text-xs font-semibold text-foreground">{stats.suspectsRemandedPolice}</span>
              </div>
               <div className="flex items-center justify-between py-0.5 font-extrabold">
                <span className="text-xs text-muted-foreground">Remanded (Prison)</span>
                 <span className="text-xs font-semibold text-foreground">{stats.suspectsRemandedPrison}</span>
              </div>
              <div className="flex items-center justify-between py-0.5 font-extrabold">
                <span className="text-xs text-muted-foreground">Court Bail</span>
                 <span className="text-xs font-semibold text-foreground">{stats.suspectsOnCourtBail}</span>
              </div>
              <div className="flex items-center justify-between py-0.5 font-extrabold">
                <span className="text-xs text-muted-foreground">Police Enquiry Bail</span>
                 <span className="text-xs font-semibold text-foreground">{stats.suspectsOnPoliceBail}</span>
              </div>
               <div className="border-t border-border my-1.5"></div>
               <div className="flex items-center justify-between py-0.5 font-extrabold">
                <span className="text-xs text-muted-foreground">Active Investigations</span>
                 <span className="text-xs font-semibold text-foreground">{stats.activeInvestigations}</span>
              </div>
            </CardContent>
          </Card>
          
          <Card className="md:col-span-1">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-base">System Alerts</CardTitle>
               <CardDescription className="text-xs">Important notifications</CardDescription>
            </CardHeader>
            <CardContent className="pt-2 px-4 pb-4">
              <p className="text-muted-foreground text-xs">No critical system alerts at this time.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageContainer>
  );
}

    

    
