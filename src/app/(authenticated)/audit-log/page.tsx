
"use client";
import React, { useState, useEffect, useCallback, Suspense } from 'react'; // Added React and Suspense
import { PageContainer } from '@/components/page-container';
import { DataTable } from '@/components/data-table';
import { columns } from './columns';
import type { AuditLogEntry } from '@/types/audit';
import { FileText, Loader2 } from 'lucide-react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query } from 'firebase/firestore';
import { toast } from '@/hooks/use-toast';
import { useSearchParams } from 'next/navigation';
import { parseISO } from 'date-fns';

const serializeAuditLogEntry = (docData: Record<string, unknown>, id: string): AuditLogEntry => {
  const data = { ...docData };
  if (
    data.timestamp &&
    typeof data.timestamp === 'object' &&
    data.timestamp !== null &&
    'toDate' in data.timestamp &&
    typeof (data.timestamp as { toDate?: () => Date }).toDate === 'function'
  ) {
    data.timestamp = (data.timestamp as { toDate: () => Date }).toDate().toISOString();
  } else if (typeof data.timestamp === 'string') {
    try {
      parseISO(data.timestamp); 
    } catch {
      console.warn(`Invalid timestamp format for audit log ${id}: ${data.timestamp}`);
    }
  }
  return { id, ...data } as AuditLogEntry;
};

function AuditLogPageContent() {
  const searchParams = useSearchParams();
  const initialSearchQuery = searchParams.get('q');

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true); 
  const [filter, setFilter] = useState(initialSearchQuery || '');

  const fetchAuditLogs = useCallback(async () => {
    setLoading(true);
    try {
      const auditLogsCollectionRef = collection(db, "auditLogs");
      const q = query(auditLogsCollectionRef); 
      
      const querySnapshot = await getDocs(q);
      const fetchedLogs: AuditLogEntry[] = querySnapshot.docs.map(doc => 
        serializeAuditLogEntry(doc.data(), doc.id)
      );

      fetchedLogs.sort((a, b) => {
        try {
          return parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime();
        } catch  {
          return 0; 
        }
      });
      
      let filteredLogs = fetchedLogs;
      if (filter) { 
        const lowerFilter = filter.toLowerCase();
        filteredLogs = fetchedLogs.filter(log => 
          (log.userName && log.userName.toLowerCase().includes(lowerFilter)) ||
          (log.suspectFullName && log.suspectFullName.toLowerCase().includes(lowerFilter)) ||
          (log.action && log.action.toLowerCase().includes(lowerFilter)) ||
          (log.details && log.details.toLowerCase().includes(lowerFilter)) ||
          (log.entityIdentifier && log.entityIdentifier.toLowerCase().includes(lowerFilter)) ||
          (log.ipAddress && log.ipAddress.toLowerCase().includes(lowerFilter)) ||
          (log.entityType && log.entityType.toLowerCase().includes(lowerFilter)) ||
          (log.userId && log.userId.toLowerCase().includes(lowerFilter))
        );
      }
      setAuditLogs(filteredLogs);

    } catch (error) {
      console.error("Error fetching audit logs:", error);
      toast({
        title: "Error",
        description: "Failed to load audit logs. Please try again.",
        variant: "destructive",
      });
      setAuditLogs([]);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

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
          <p className="ml-4 text-lg">Loading audit logs...</p>
        </div>
      ) : (
          <DataTable 
              columns={columns} 
              data={auditLogs}
              meta={{
                refreshData: fetchAuditLogs
              }}
          />
      )}
    </>
  );
}

export default function AuditLogPage() {
  return (
    <PageContainer title="System Audit Log">
      <div className="space-y-6">
        <div>
          <div className="flex items-center mb-1">
            <FileText className="h-6 w-6 mr-2 text-primary" />
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Activity Records</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Track all system activities, changes to records, and user actions. Use the search to filter logs.
          </p>
        </div>
        <Suspense fallback={
          <div className="flex justify-center items-center h-64">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-lg">Loading logs...</p>
          </div>
        }>
          <AuditLogPageContent />
        </Suspense>
      </div>
    </PageContainer>
  );
}
