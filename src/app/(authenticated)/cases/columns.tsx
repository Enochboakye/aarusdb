"use client";

import type { Case } from "@/types/case";
import { MoreHorizontal, Eye, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import React from "react";
import { type MRT_ColumnDef } from 'material-react-table';
export const caseActionColumn: MRT_ColumnDef<Case, unknown>[] = [
  {
    id: 'actions',
    header: 'Actions', // ✅ Add this to fix the error
    size: 200,
    enableSorting: false,
    enableColumnFilter: false,
    Cell: ({ row }) => (
      <div className="cellAction gap-4">
        <CaseCellActions caseData={row.original} />
      </div>
    ),
  },
];


const CaseCellActions = ({ caseData }: { 
  refreshData?: () => void;
  caseData: Case;
}) => {
  const caseRecord = caseData;


  return (
     <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span><MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href={`/cases/${caseRecord.id}`} className="flex items-center">
            <Eye className="mr-2 h-4 w-4" /> View Details
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/cases/${caseRecord.id}/edit`} className="flex items-center">
            <Edit className="mr-2 h-4 w-4" /> Edit Case
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

