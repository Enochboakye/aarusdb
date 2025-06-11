
"use client";

import type { ColumnDef, Row, Table as TanstackTable } from "@tanstack/react-table";
import type { Case } from "@/types/case";
import { ArrowUpDown, MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { deleteCaseAction } from "./actions";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import React from "react";
import { format, parseISO } from "date-fns";
import type { BaseTableMeta } from '@/components/data-table';

export const columns: ColumnDef<Case>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "roNumber",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        R.O. Number <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => String(row.getValue("roNumber")), 
  },
  {
    accessorKey: "offence",
    header: "Offence Type",
    cell: ({ row }) => <div className="truncate max-w-xs">{row.getValue("offence")}</div>,
  },
  {
    accessorKey: "assignedInvestigator",
    header: "Assigned Investigator",
  },
  {
    accessorKey: "dateReported",
    header: "Date Reported",
    cell: ({ row }) => {
      const dateString = row.getValue("dateReported");
      if (!dateString || typeof dateString !== 'string') return 'N/A';
      try {
        return format(parseISO(dateString), "dd/MM/yyyy");
      } catch { return dateString; }
    },
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      return <CaseCellActions row={row} table={table} />;
    },
  },
];

const CaseCellActions = ({ row, table }: { 
  row: Row<Case>; 
  table: TanstackTable<Case> 
}) => {
  const caseRecord = row.original;
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const meta = table.options.meta as BaseTableMeta | undefined;
  const refreshData = meta?.refreshData;

  const handleDelete = async () => {
    const exhibitPaths = caseRecord.exhibits.map(ex => ex.storagePath).filter(Boolean) as string[];
    
    toast({ title: "Processing", description: `Deleting case R.O. ${caseRecord.roNumber}...` });
    try {
      const result = await deleteCaseAction(caseRecord.id, caseRecord.roNumber, exhibitPaths); 
      if (result.success) {
        toast({ title: "Success", description: `Case R.O. ${caseRecord.roNumber} deleted.`, variant: "default" });
        if (refreshData) {
          refreshData();
        }
      } else {
        toast({ title: "Error", description: result.message || "Failed to delete case.", variant: "destructive" });
      }
    } catch (e) {
      const error = e as Error;
      toast({ title: "Error", description: error.message || "An unexpected error occurred.", variant: "destructive" });
      console.error("Delete case error:", e);
    }
    setIsDeleteDialogOpen(false);
  };

  return (
    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
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
          <DropdownMenuSeparator />
           <AlertDialogTrigger asChild>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive-foreground focus:bg-destructive cursor-pointer"
              onSelect={(e) => {
                  e.preventDefault(); 
                  setIsDeleteDialogOpen(true); 
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete Case
            </DropdownMenuItem>
          </AlertDialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This will permanently delete case R.O. <span className="font-semibold">{caseRecord.roNumber}</span> and all its associated exhibits. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className={buttonVariants({ variant: "destructive" })}>
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
