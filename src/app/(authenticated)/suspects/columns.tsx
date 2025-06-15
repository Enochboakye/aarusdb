"use client"
import { useRouter } from "next/navigation"
import type { Suspect } from "@/types/suspect"
import { MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
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
import type { GridColDef, GridRenderCellParams } from '@mui/x-data-grid';

const actionColumn: GridColDef[] = [
  {
    field: "action",
    headerName: "Action",
    width: 200,
    type: 'actions',
    renderCell: (params: GridRenderCellParams<Suspect>) => (
      <div className="cellAction gap-4">
        <CellActions suspect={params.row} />
      </div>
    ),
  },
];

const CellActions = ({ suspect }: { suspect: Suspect }) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
 const router = useRouter();
  const handleDelete = async () => {
    toast({ title: "Processing", description: `Deleting record for ${suspect.fullName}...` });
    try {
      const result = await deleteSuspectAction(suspect.id, suspect.fullName); 
      if (result.success) {
        toast({ title: "Success", description: `Record for ${suspect.fullName} deleted successfully.`, variant: "default" });
      } else {
        toast({ title: "Error", description: result.message || "Failed to delete record.", variant: "destructive" });
      }
    } catch (e) {
      const error = e as Error;
      toast({ title: "Error", description: error.message || "An unexpected error occurred.", variant: "destructive" });
      console.error("Delete error:", e);
    }
    setIsDeleteDialogOpen(false);
    await router.refresh()
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

export default actionColumn