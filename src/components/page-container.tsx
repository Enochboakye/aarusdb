
"use client"; 

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/components/ui/sidebar'; 
// Removed Input, Button, Select, SearchIcon, useRouter, useSearchParams, usePathname, useToast imports as they are no longer needed

interface PageContainerProps {
  title: string;
  children: ReactNode;
  className?: string;
}

export function PageContainer({ title, children, className }: PageContainerProps) {
  useSidebar(); 
  // Removed router, searchParams, pathname, toast state and effects for global search

  return (
    <div className={cn("flex flex-col flex-1 overflow-auto", className)}>
      <header className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-40 w-full border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8 gap-4">
          <div className="flex items-center flex-shrink-0">
          
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-primary whitespace-nowrap overflow-hidden text-ellipsis" title={title}>{title}</h1>
          </div>
          {/* Global Search UI and logic removed from here */}
        </div>
      </header>
      <main className="flex-1 p-4 sm:p-6 lg:p-8">
        {children}
      </main>
    </div>
  );
}
