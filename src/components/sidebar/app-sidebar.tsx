"use client"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
} from "@/components/ui/sidebar"
import { mainMenu, secondaryMenu } from "@/config/menu"

import { BrandLogo } from "../brand-logo"
import { Footer } from "../footer"
import { NavUser } from "../navbar-user"
import { SidebarMenuItemComponent } from "@/components/sidebar/sidebar-menu-item"
import { UserProfileMenu } from "../user-profile-menu"
import { observer } from "mobx-react-lite"
import { useStore } from "@/providers/store.provider"

export const AppSidebar = observer(() => {
  const { authStore } = useStore()
  const { user } = authStore

  if (!user) {
    return null
  }

  // Get allowed resources for the user's role
  const allowedResources = authStore.permissions.map((perm) => perm.resource)

  // Filter menu items based on allowed resources
  const filteredMainMenu = mainMenu.filter((item) =>
    allowedResources.includes(item.resource)
  )
  const filteredSecondaryMenu = secondaryMenu.filter((item) =>
    allowedResources.includes(item.resource)
  )

  return (
    <Sidebar className="transition-colors duration-200">
      <SidebarContent className="px-1.5 flex flex-col justify-between bg-sidebar text-sidebar-foreground">
        <div className="overflow-y-auto">
          {filteredMainMenu.length > 0 && (
            <SidebarGroup>
              <SidebarGroupLabel className="h-auto py-6 flex justify-center">
                <BrandLogo />
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {filteredMainMenu.map((item) => (
                    <SidebarMenuItemComponent key={item.id} item={item} />
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          )}

          <SidebarGroup>
            {filteredSecondaryMenu.length > 0 && <SidebarGroupLabel className="text-sidebar-foreground">System</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredSecondaryMenu.map((item) => (
                  <SidebarMenuItemComponent key={item.id} item={item} />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </div>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
    </Sidebar>
  )
})
