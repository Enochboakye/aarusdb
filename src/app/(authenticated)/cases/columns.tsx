"use client";

import type { Case } from "@/types/case";
import { MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
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


const CaseCellActions = ({ refreshData, caseData }: { 
  refreshData?: () => void;
  caseData: Case;
}) => {
  const caseRecord = caseData;
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);

  const handleDelete = async () => {
    toast({ title: "Processing", description: `Deleting case R.O. ${caseRecord.roNumber}...` });
    try {
      const result = await deleteCaseAction(caseRecord.id); 
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
            This will permanently delete case R.O. <span className="font-semibold">{caseRecord.roNumber}</span>, all its associated exhibits, and remove its link from any associated suspects. This action cannot be undone.
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

