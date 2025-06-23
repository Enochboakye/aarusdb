
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { PageContainer } from '@/components/page-container';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { fetchAnnualReportDataAction, type AnnualReportData } from './actions';
import { toast } from '@/hooks/use-toast';
import { Loader2, BarChart3, FileText, Users, AlertTriangle, PieChart as PieChartIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from "@/components/ui/chart"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";


const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 11 }, (_, i) => String(currentYear - i)); // Current year + 10 previous years

const genderChartConfig = {
  male: { label: "Male", color: "hsl(var(--chart-3))" },
  female: { label: "Female", color: "hsl(var(--chart-5))" },
  other: { label: "Other", color: "hsl(var(--muted))" },
} satisfies ChartConfig;

const priorityChartConfig = {
  high: { label: "High", color: "hsl(var(--destructive))" },
  medium: { label: "Medium", color: "hsl(var(--accent))" },
  low: { label: "Low", color: "hsl(var(--chart-2))" },
  unknown: { label: "Unknown", color: "hsl(var(--muted))" },
} satisfies ChartConfig;

const custodyStatusChartConfig = {
  wanted: { label: 'Wanted', color: 'hsl(var(--destructive))' },
  'police-custody-active-investigation': {
    label: 'Police Custody (Active)',
    color: '#ff0000',
  },
  'remanded-police-custody': {
    label: 'Remanded (Police)',
    color: '#014fe8',
  },
  'remanded-prison-custody': {
    label: 'Remanded (Prison)',
    color: '#ff9900',
  },
  'bail-court': { label: 'Bail (Court)', color: 'hsl(var(--chart-2))' },
  'bail-police-enquiry': {
    label: 'Bail (Police)',
    color: '#059f2d',
  },
  released: { label: 'Released', color: 'hsl(210 30% 95%)' },
  deceased: { label: 'Deceased', color: '#9101a1' },
  other: { label: 'Other', color: 'hsl(var(--muted))' },
  unknown: { label: 'Unknown', color: '#fffe13' },
} satisfies ChartConfig;


export default function ReportsPage() {
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear));
  const [reportData, setReportData] = useState<AnnualReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!selectedYear) return;
      setLoading(true);
      setError(null);
      setReportData(null);
      try {
        const yearNum = parseInt(selectedYear, 10);
        const data = await fetchAnnualReportDataAction(yearNum);
        setReportData(data);
      } catch (err) {
        console.error("Failed to fetch report data:", err);
        const errorMessage = err instanceof Error ? err.message : "An unknown error occurred.";
        setError(errorMessage);
        toast({
          title: "Error",
          description: `Could not load report data for ${selectedYear}. ${errorMessage}`,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedYear]);

  const genderData = useMemo(() => {
    if (!reportData?.suspectsByGender) return [];
    const { male, female, other } = reportData.suspectsByGender;
    const total = male + female + other;
    if (total === 0) return [];
    return [
      { name: "male", value: male, fill: "#00ccff" },
      { name: "female", value: female, fill: "#ff00cc" },
      { name: "other", value: other, fill: "#ffcc00" },
    ].filter(item => item.value > 0);
  }, [reportData?.suspectsByGender]);

  const priorityData = useMemo(() => {
    if (!reportData?.casesByPriority) return [];
    const { low, medium, high, unknown } = reportData.casesByPriority;
    const total = low + medium + high + unknown;
    if (total === 0) return [];
    return [
      { name: "high", value: high, fill: "#ff0000" },
      { name: "medium", value: medium, fill: "#ffcc00" },
      { name: "low", value: low, fill: "#00ff00" },
      { name: "unknown", value: unknown, fill: "#000000" },
    ].filter(item => item.value > 0);
  }, [reportData?.casesByPriority]);

  const custodyStatusData = useMemo(() => {
    if (!reportData?.suspectsByCustodyStatus) return [];
    return Object.entries(reportData.suspectsByCustodyStatus)
      .map(([status, count]) => {
        const slug = status.toLowerCase().replace(/\s+/g, '-').replace(/[()]/g, '');
        return {
          status: (custodyStatusChartConfig[slug as keyof typeof custodyStatusChartConfig] as {label: string})?.label || status,
          count,
          fill: `var(--color-${slug})`
        }
      })
      .filter(item => item.count > 0)
      .sort((a,b) => a.count - b.count);
  }, [reportData?.suspectsByCustodyStatus]);


  const StatCard = ({ title, value, icon: Icon, description, className, valueClassName, titleClassName, iconClassName }: { title: string, value: string | number, icon: React.ElementType, description?: string, className?: string, valueClassName?: string, titleClassName?: string, iconClassName?: string }) => (
    <Card className={cn("hover:shadow-md transition-shadow", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className={cn("text-sm font-medium", titleClassName || "text-muted-foreground")}>{title}</CardTitle>
        <Icon className={cn("h-5 w-5", iconClassName || "text-primary")} />
      </CardHeader>
      <CardContent>
        <div className={cn("text-3xl font-bold", valueClassName || "text-foreground")}>{loading ? <Loader2 className="h-7 w-7 animate-spin" /> : value}</div>
        {description && <p className={cn("text-xs pt-1", titleClassName || "text-muted-foreground")}>{description}</p>}
      </CardContent>
    </Card>
  );

  return (
    <PageContainer >
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-card rounded-lg shadow">
            <div className="flex items-center">
                 <BarChart3 className="h-7 w-7 mr-3 text-primary" />
                <div>
                    <h2 className="text-2xl font-semibold tracking-tight text-foreground">Yearly Activity Summary</h2>
                    <p className="text-sm text-muted-foreground">Select a year to view key statistics.</p>
                </div>
            </div>
          <div className="flex items-center space-x-2">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {error && !loading && (
          <Card className="border-destructive bg-destructive/10">
            <CardHeader className="flex-row items-center space-x-3 space-y-0">
              <AlertTriangle className="h-6 w-6 text-destructive" />
              <CardTitle className="text-destructive">Failed to Load Report</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-destructive/90">{error}</p>
              <p className="text-sm text-muted-foreground mt-1">
                Please try selecting a different year or try again later.
              </p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2">
          <StatCard
            title={`Cases Reported in ${selectedYear}`}
            value={reportData?.casesReported ?? (loading ? '' : 'N/A')}
            icon={FileText}
            description="Total new cases filed during the selected year."
            className="bg-red-600 text-xl"
            valueClassName="text-primary-foreground  text-xl"
            titleClassName="text-primary-foreground/80"
            iconClassName="text-primary-foreground"
          />
          <StatCard
            title={`Suspects Recorded in ${selectedYear}`}
            value={reportData?.suspectsRecorded ?? (loading ? '' : 'N/A')}
            icon={Users}
            description="Total new suspect records created during the year."
            className="bg-pink-600 text-xl"
            valueClassName="text-primary-foreground text-xl"
            titleClassName="text-primary-foreground/80"
            iconClassName="text-primary-foreground"
          />
        </div>

        {reportData && !loading && (
          <>
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center"><PieChartIcon className="mr-2 h-5 w-5 text-primary" />Suspect Demographics (Gender)</CardTitle>
                <CardDescription>Gender distribution of suspects recorded in {selectedYear}.</CardDescription>
              </CardHeader>
              <CardContent className="min-h-[250px] flex items-center justify-center">
                {loading ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> :
                 genderData.length > 0 ? (
                    <ChartContainer config={genderChartConfig} className="aspect-square h-full w-full max-h-[250px] text-2xl">
                      <PieChart>
                        <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                        <Pie data={genderData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                            const RADIAN = Math.PI / 180;
                            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                            const x = cx + radius * Math.cos(-midAngle * RADIAN);
                            const y = cy + radius * Math.sin(-midAngle * RADIAN);
                            return (percent * 100) > 5 ? (<text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="10px"> {`${(percent * 100).toFixed(0)}%`}</text>) : null;
                          }}
                        >
                           {genderData.map((entry) => (
                            <Cell key={`cell-${entry.name}`} fill={entry.fill} className='text-xl'/>
                          ))}
                        </Pie>
                        <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                      </PieChart>
                    </ChartContainer>
                  ) : (<p className="text-muted-foreground text-xl">No suspect gender data for {selectedYear}.</p>)
                }
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center"><PieChartIcon className="mr-2 h-5 w-5 text-primary" />Case Priority Distribution</CardTitle>
                <CardDescription>Priority levels of cases reported in {selectedYear}.</CardDescription>
              </CardHeader>
              <CardContent className="min-h-[250px] flex items-center justify-center">
                 {loading ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> :
                  priorityData.length > 0 ? (
                    <ChartContainer config={priorityChartConfig} className="aspect-square h-full w-full max-h-[250px] text-2xl">
                      <PieChart>
                        <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
                        <Pie data={priorityData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} labelLine={false} label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
                            const RADIAN = Math.PI / 180;
                            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                            const x = cx + radius * Math.cos(-midAngle * RADIAN);
                            const y = cy + radius * Math.sin(-midAngle * RADIAN);
                            return (percent * 100) > 5 ? (<text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize="10px">{`${(percent * 100).toFixed(0)}%`}</text>) : null;
                          }}
                        >
                          {priorityData.map((entry) => (
                            <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                          ))}
                        </Pie>
                         <ChartLegend content={<ChartLegendContent nameKey="name" />} />
                      </PieChart>
                    </ChartContainer>
                  ) : (<p className="text-muted-foreground text-xl">No case priority data for {selectedYear}.</p>)
                }
              </CardContent>
            </Card>
          </div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center"><BarChart3 className="mr-2 h-5 w-5 text-primary" />Suspect Custody Status Breakdown</CardTitle>
                <CardDescription>Custody status of suspects recorded in {selectedYear}.</CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? <div className="flex justify-center items-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> :
                 custodyStatusData.length > 0 ? (
                    <ChartContainer config={custodyStatusChartConfig} className="h-[250px] w-full">
                      <BarChart data={custodyStatusData} layout="vertical" margin={{ left: 100 }}>
                        <CartesianGrid horizontal={false} />
                        <YAxis dataKey="status" type="category" tickLine={false} axisLine={false} tick={{ fontSize: 12 }} />
                        <XAxis dataKey="count" type="number" hide />
                        <ChartTooltip
                            cursor={false}
                            content={<ChartTooltipContent indicator="line" />}
                        />
                        <Bar dataKey="count" radius={4}>
                           {custodyStatusData.map((entry) => (
                              <Cell key={`cell-${entry.status}`} fill={entry.fill} />
                            ))}
                        </Bar>
                      </BarChart>
                    </ChartContainer>
                 ) : <p className="text-muted-foreground text-center py-10">No suspect custody status data for {selectedYear}.</p>
                }
              </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle>Notes on Report Data</CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-1">
                    <p>
                        - &quot;Cases Reported&quot; are counted based on the <span className="font-semibold text-foreground">Date Reported</span> field of the case falling within the selected calendar year.
                    </p>
                     <p>
                        - &quot;Case Priority Distribution&quot; is based on the <span className="font-semibold text-foreground">Priority</span> field of cases reported within the selected calendar year.
                    </p>
                    <p>
                        - &quot;Suspects Recorded&quot; are counted based on the <span className="font-semibold text-foreground">Record Created At</span> timestamp of the suspect profile falling within the selected calendar year.
                    </p>
                    <p>
                        - &quot;Suspect Demographics (Gender)&quot; & &quot;Custody Status&quot; are based on the respective fields of suspects recorded within the selected calendar year.
                    </p>
                    <p>
                        - All data is based on records available in the system at the time of report generation.
                    </p>
                </CardContent>
            </Card>
          </>
        )}
      </div>
    </PageContainer>
  );
}
