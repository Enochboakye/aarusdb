
"use client"

import type { ColumnDef } from "@tanstack/react-table"
import type { Suspect } from "@/types/suspect"
import { ArrowUpDown, MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
// Removed Link import as it's no longer used for these actions
import { deleteSuspectAction } from "../suspects/actions" 
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
import { parseISO } from "date-fns"
import type { BaseTableMeta } from '@/components/data-table';
import { useRouter } from 'next/navigation'; // Added useRouter

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
      } catch  {
        return dateString;
      }
    },
    sortingFn: 'datetime', 
  },
{
  id: "actions",
  cell: ({ row, table }) => (
    <SuspectActionsCell row={row} table={table} />
  ),
},
]

// Define SuspectActionsCell component
import type { Row, Table } from "@tanstack/react-table";

type SuspectActionsCellProps = {
  row: Row<Suspect>;
  table: Table<Suspect>;
};

const SuspectActionsCell: React.FC<SuspectActionsCellProps> = ({ row, table }) => {
  const router = useRouter();
  const suspect = row.original as Suspect;
  const [open, setOpen] = React.useState(false);

  const handleDelete = async () => {
    setOpen(false);
    const result = await deleteSuspectAction(suspect.id, suspect.fullName);
    toast({
      title: result.success ? "Deleted" : "Error",
      description: result.message || (result.success ? "Suspect deleted." : "Failed to delete suspect."),
      variant: result.success ? "default" : "destructive",
    });
    // Optionally refresh table data
    (table.options.meta as BaseTableMeta)?.refreshData?.();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => router.push(`/suspects/${suspect.id}`)}
        >
          <Eye className="mr-2 h-4 w-4" /> View
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => router.push(`/suspects/${suspect.id}/edit`)}
        >
          <Edit className="mr-2 h-4 w-4" /> Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <AlertDialog open={open} onOpenChange={setOpen}>
          <AlertDialogTrigger asChild>
            <DropdownMenuItem
              onSelect={e => {
                e.preventDefault();
                setOpen(true);
              }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </DropdownMenuItem>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Are you sure you want to delete this suspect?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
