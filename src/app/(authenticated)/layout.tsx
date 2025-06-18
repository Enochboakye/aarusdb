import { SidebarProvider} from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import {ToastContainer} from 'react-toastify';
import { ThemeProvider } from '@/components/theme-provider'
import Topbar from '@/components/ui/topbar'

export default function Layout({ children }: { children: React.ReactNode }) {
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
         <Topbar />
        <ToastContainer />
        {children}
      </main>
    </SidebarProvider>
      </ThemeProvider>
  )
}