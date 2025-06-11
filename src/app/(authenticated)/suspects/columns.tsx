"use client"

import type { ColumnDef, Row, Table } from "@tanstack/react-table"
import type { Suspect } from "@/types/suspect"
import { ArrowUpDown, MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { deleteSuspectAction } from "./actions" 
import { toast } from "@/hooks/use-toast"
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
} from "@/components/ui/alert-dialog" 
import React from "react"
import {  parseISO } from "date-fns"
import type { BaseTableMeta } from '@/components/data-table';


export const columns: ColumnDef<Suspect>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
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
    accessorKey: "fullName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Full Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: "nickname",
    header: "Nickname",
  },
  {
    accessorKey: "gender",
    header: "Gender",
  },
  {
    accessorKey: "dateOfBirth",
    header: "Date of Birth",
    cell: ({ row }) => {
      const dateString = row.getValue("dateOfBirth");
      if (!dateString || typeof dateString !== 'string') return 'N/A';
      try {
        const date = parseISO(dateString) 
        return new Intl.DateTimeFormat('en-GB').format(date)
      } catch {
        return dateString; 
      }
    }
  },
  {
    accessorKey: "nationality",
    header: "Nationality",
  },
   {
    accessorKey: "updatedAt",
    header: "Last Updated",
    cell: ({ row }) => {
      const dateString = row.getValue("updatedAt");
      if (!dateString || typeof dateString !== 'string') return 'N/A';
      try {
        const date = parseISO(dateString)
        return new Intl.DateTimeFormat('en-GB', { dateStyle: 'short', timeStyle: 'short' }).format(date)
      } catch {
        return dateString;
      }
    },
    sortingFn: 'datetime', 
  },
  {
    id: "actions",
    cell: ({ row, table }) => {
      return <CellActions row={row} table={table} />;
    },
  },
]

const CellActions = ({ row, table }: { 
  row: Row<Suspect>; 
  table: Table<Suspect> 
}) => {
  const suspect = row.original;
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const meta = table.options.meta as BaseTableMeta | undefined;
  const refreshData = meta?.refreshData;

  const handleDelete = async () => {
    toast({ title: "Processing", description: `Deleting record for ${suspect.fullName}...` });
    try {
      const result = await deleteSuspectAction(suspect.id, suspect.fullName); 
      if (result.success) {
        toast({ title: "Success", description: `Record for ${suspect.fullName} deleted successfully.`, variant: "default" });
         if (refreshData) {
          refreshData();
        }

      } else {
        toast({ title: "Error", description: result.message || "Failed to delete record.", variant: "destructive" });
      }
    } catch (e) {
      const error = e as Error;
      toast({ title: "Error", description: error.message || "An unexpected error occurred.", variant: "destructive" });
      console.error("Delete error:", e);
    }
    setIsDeleteDialogOpen(false);
  };

  return (
    <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link href={`/suspects/${suspect.id}`} className="flex items-center">
              <Eye className="mr-2 h-4 w-4" /> View Details
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href={`/suspects/${suspect.id}/edit`} className="flex items-center">
              <Edit className="mr-2 h-4 w-4" /> Edit Record
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
           <AlertDialogTrigger asChild>
            <DropdownMenuItem
              className="text-destructive focus:text-destructive-foreground focus:bg-destructive"
              onSelect={(e) => {
                  e.preventDefault(); 
                  setIsDeleteDialogOpen(true); 
              }} 
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete Record
            </DropdownMenuItem>
          </AlertDialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the record for 
            <span className="font-semibold"> {suspect.fullName}</span>.
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
  )
}
