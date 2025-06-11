
"use client"

import type { ColumnDef } from "@tanstack/react-table"
import type { AuditLogEntry } from "@/types/audit" 
import { ArrowUpDown, Eye, FileSearch } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { format, parseISO } from 'date-fns'
import Link from "next/link"

export const columns: ColumnDef<AuditLogEntry>[] = [
  {
    accessorKey: "timestamp",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Timestamp <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => {
      const dateString = row.getValue("timestamp");
      if (!dateString || typeof dateString !== 'string') return 'N/A';
      try {
        return <div className="whitespace-nowrap">{format(parseISO(dateString), "dd/MM/yyyy HH:mm:ss")}</div>;
      } catch  { return <div className="whitespace-nowrap">{dateString}</div>; }
    }
  },
  {
    accessorKey: "userName",
    header: "Officer Name",
  },
  {
    accessorKey: "entityType", 
    header: "Entity Type",
    cell: ({ row }) => {
      const entityType = row.original.entityType || "SUSPECT"; 
      return <Badge variant={entityType === "CASE" ? "secondary" : "default"}>{entityType}</Badge>;
    }
  },
  {
    accessorKey: "entityIdentifier", 
    header: "Entity Identifier (Name/R.O.)",
    cell: ({ row }) => row.original.entityIdentifier || row.original.suspectFullName || 'N/A'
  },
  {
    accessorKey: "action",
    header: "Action",
    cell: ({ row }) => {
      const action: AuditLogEntry["action"] = row.getValue("action");
      let variant: "default" | "secondary" | "destructive" | "outline" = "outline";
      if (action === "CREATE") variant = "default";
      else if (action === "UPDATE") variant = "secondary";
      else if (action === "DELETE") variant = "destructive";
      else if (action === "VIEW") variant = "outline";
      return <Badge variant={variant} className="capitalize">{action.toLowerCase()}</Badge>
    }
  },
  {
    accessorKey: "details",
    header: "Details",
    cell: ({row}) => <div className="truncate max-w-xs">{row.getValue("details")}</div>
  },
  {
    accessorKey: "ipAddress",
    header: "IP Address",
  },
  {
    id: "actions", 
    cell: ({ row }) => {
      const auditEntry = row.original;

      const canView = auditEntry.action !== "DELETE" && (auditEntry.suspectId || auditEntry.entityId);
      let viewLink: React.ReactNode = null;
      if (canView) {
        const isCase = auditEntry.entityType === "CASE";
        const targetId = isCase ? auditEntry.entityId : auditEntry.suspectId;
        const linkPath = isCase ? `/cases/${targetId}` : `/suspects/${targetId}`;
        const linkText = isCase ? "View Case" : "View Suspect";
        const Icon = isCase ? FileSearch : Eye;

        if (targetId) {
          viewLink = (
            <Button variant="outline" size="sm" asChild>
              <Link href={linkPath} target="_blank" rel="noopener noreferrer">
                <Icon className="mr-2 h-4 w-4" /> {linkText}
              </Link>
            </Button>
          );
        }
      }

      if (!viewLink) {
        return <div className="text-center">-</div>; 
      }

      return (
        <div className="flex items-center space-x-2">
          {viewLink}
        </div>
      );
    }
  }
]
