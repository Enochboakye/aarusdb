
"use client"
import { SidebarProvider} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import {ToastContainer} from 'react-toastify';
import { ThemeProvider } from '@/components/theme-provider'
import Topbar from '@/components/ui/topbar'
import { usePathname } from "next/navigation";

export default function Layout({ children }: { children: React.ReactNode }) {
 
  const pathname = usePathname();

  const hideTopBarRoutes = ['/suspects/[id]/print']
  const showTopBar = !hideTopBarRoutes.includes(pathname);

  return (
    <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
            >
    <SidebarProvider>
      <AppSidebar />
      <main>
        {showTopBar && <Topbar />}
        <ToastContainer />
        {children}
      </main>
    </SidebarProvider>
      </ThemeProvider>
  )
}