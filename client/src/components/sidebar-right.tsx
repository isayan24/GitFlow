"use client"

import * as React from "react"
import { Calendars } from "@/components/calendars"
import { DatePicker } from "@/components/date-picker"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar"
import { PlusIcon, PanelRightClose, CalendarDays } from "lucide-react"

// This is sample data.
const data = {
  calendars: [
    {
      name: "My Calendars",
      items: ["Personal", "Work", "Family"],
    },
    {
      name: "Favorites",
      items: ["Holidays", "Birthdays"],
    },
    {
      name: "Other",
      items: ["Travel", "Reminders", "Deadlines"],
    },
  ],
}

import { useAppStore } from "@/store/useAppStore"

interface SidebarRightProps extends React.ComponentProps<typeof Sidebar> {}

export function SidebarRight({
  ...props
}: SidebarRightProps) {
  const setShowRightSidebar = useAppStore((state) => state.setShowRightSidebar)

  return (
    <Sidebar
      collapsible="none"
      className="sticky top-0 hidden h-svh border-l border-sidebar-border bg-sidebar lg:flex w-80"
      {...props}
    >
      <SidebarHeader className="h-14 border-b border-sidebar-border px-4 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2 text-sidebar-foreground">
          <CalendarDays size={16} className="text-primary" />
          <span className="font-bold text-sm">Schedule</span>
        </div>
        <button 
          onClick={() => setShowRightSidebar(false)}
          className="p-1 rounded-md text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent transition duration-150 cursor-pointer"
          title="Hide Calendar"
        >
          <PanelRightClose size={16} />
        </button>
      </SidebarHeader>
      <SidebarContent className="bg-sidebar">
        <DatePicker />
        <SidebarSeparator className="mx-0 bg-sidebar-border" />
        <Calendars calendars={data.calendars} />
      </SidebarContent>
      <SidebarFooter className="bg-sidebar border-t border-sidebar-border p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <PlusIcon />
              <span>New Calendar</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  )
}
