import {User, Database, Home, Briefcase, UserPlus2, FilePlus, ScrollText,LayoutDashboard } from "lucide-react"
import {SignOutButton} from '@/components/SignOutButton'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar"

// Menu items.
const items = [
  {
    title: "Dashboard",
    url: "/admin",
    icon: LayoutDashboard,
  },
  {
    title: "Home",
    url: "/dashboard",
    icon: Home,
  },
  {
    title: "Add New Suspect",
    url: "/suspects/new",
    icon: UserPlus2,
  },
  {
    title: "Suspect Database",
    url: "/suspects",
    icon: Database,
  },
  {
    title: "Add New Case",
    url: "/cases/new",
    icon: FilePlus,
  },
  {
    title: "Case Records",
    url: "/cases",
    icon: Briefcase,
  },
  {
    title: "Audit Log",
    url: "/audit-log",
    icon: ScrollText,
  },
  {
    title: "Account",
    url: "/user-profile",
    icon: User,
  },
]

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel><span className="text-blue-600 text-xl font-extrabold mb-4">AARU</span></SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title} className="mb-4">
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon className="text-xl text-pink-700"/>
                      <span className="text-xl font-bold">{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SignOutButton />
      </SidebarFooter>
    </Sidebar>
  )
}