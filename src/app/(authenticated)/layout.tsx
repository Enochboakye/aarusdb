import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import {ToastContainer} from 'react-toastify';
import {ModeToggle} from '@/components/ui/mode-toggle'
import { ThemeProvider } from '@/components/theme-provider'
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
        <SidebarTrigger />
        <ModeToggle/>
        <ToastContainer />
        {children}
      </main>
    </SidebarProvider>
      </ThemeProvider>
  )
}