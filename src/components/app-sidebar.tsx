import { Plus, Home,
   CircleUser,Database, LogOut, Book } from "lucide-react"



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
    url: "/",
    icon: Home,
  },
  
  {
    title: " Suspect Profile Form",
    url: "/profile_form",
    icon: Plus,
  },
  {
    title:"Register of Cases",
    url:"/cases",
    icon:Book,
  },
  {title:"Database",
    url:"/database",
    icon: Database,
  },
  {title: "Account",
    url: "/user",
    icon: CircleUser,
  },
  {
    title:"Sign Out",
    url:"/logout",
    icon:LogOut,
  },
]

export default function AppSidebar() {
  return (
    <Sidebar className="bg-blue-600 shadow-md">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="font-extabold text-3xl text-yellow-500 rounded-full justify-center items-center shadow-md mt-4 mb-10 ml-2">aaru</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <a href={item.url} className="text-xl">
                      <item.icon size={18} className="text-red-600 2text-xl font-extrabold shadow-md rounded-md"/>
                      <span className="text-xl text-blue-600">{item.title}</span>
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
