import { Database, Home, Briefcase, UserPlus2, FilePlus, ScrollText } from "lucide-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

// Menu items.
const items = [
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
]

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Application</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}