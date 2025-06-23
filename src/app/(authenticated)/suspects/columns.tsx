"use client"
import type { Suspect } from "@/types/suspect"
import { MoreHorizontal, Eye, Edit } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"

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
              {/* Delete DropdownMenuItem and AlertDialogTrigger removed */}
            </DropdownMenuContent>
          </DropdownMenu>
  )
}

export default actionColumn