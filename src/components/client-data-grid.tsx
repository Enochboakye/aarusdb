'use client';

import { DataGrid, DataGridProps } from '@mui/x-data-grid';
import { useEffect, useState } from 'react';

export default function ClientDataGrid(props: DataGridProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return <DataGrid {...props} />;
} 