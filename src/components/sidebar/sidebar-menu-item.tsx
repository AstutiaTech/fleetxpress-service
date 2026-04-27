"use client"

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"
import { useEffect, useState } from "react"

import { ChevronDown } from "lucide-react"
import Link from "next/link"
import { MenuItem } from "@/config/menu"
import { PermissionGuard } from "@/guards/permission-guard"
import { observer } from "mobx-react-lite"
import { usePathname } from "next/navigation"
import { useStore } from "@/providers/store.provider"

interface SidebarMenuItemProps {
  item: MenuItem
  level?: number
}

export const SidebarMenuItemComponent = observer(({ item, level = 0 }: SidebarMenuItemProps) => {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const { authStore } = useStore()
  const { user } = authStore

  if (!user) {
    return null
  }

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/"
    }
    return pathname.startsWith(path)
  }

  const active = isActive(item.path)

  // Get allowed resources for the user's role
  const allowedResources = authStore.permissions.map((perm) => perm.resource)

  // If the item has children, we need to render a collapsible menu
  if (item.children && item.children.length > 0) {
    const visibleChildren = item.children.filter(child => allowedResources.includes(child.resource))
    if (visibleChildren.length > 0) {
      // At least one child is allowed, render the Collapsible block
      return (
        <PermissionGuard resource={item.resource} action={item.action}>
          <Collapsible open={open} onOpenChange={setOpen} className={`group/collapsible ${level > 0 ? "ml-4" : ""}`}>
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton isActive={active}>
                  {item.icon && <item.icon className="h-4 w-4" />}
                  <span>{item.label}</span>
                  <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]/collapsible:rotate-180" />
                </SidebarMenuButton>
              </CollapsibleTrigger>
            </SidebarMenuItem>
            <CollapsibleContent>
              {level === 0 ? (
                <SidebarMenuSub>
                  {visibleChildren.map((child) => {
                    if (child.children && child.children.length > 0) {
                      const childVisibleChildren = child.children.filter(childItem => allowedResources.includes(childItem.resource))
                      if (childVisibleChildren.length > 0) {
                        return (
                          <SidebarMenuItemComponent key={child.id} item={child} level={level + 1} />
                        )
                      }
                    }
                    return (
                      <SidebarMenuSubItem key={child.id}>
                        <PermissionGuard resource={child.resource} action={child.action}>
                          <SidebarMenuSubButton asChild isActive={isActive(child.path)} className="min-h-8 h-auto">
                            <Link href={child.path}>
                              {child.icon && <child.icon className="h-4 w-4 mr-2" />}
                              {child.label}
                            </Link>
                          </SidebarMenuSubButton>
                        </PermissionGuard>
                      </SidebarMenuSubItem>
                    )
                  })}
                </SidebarMenuSub>
              ) : (
                <SidebarMenu className="ml-4">
                  {visibleChildren.map((child) => (
                    <SidebarMenuItemComponent key={child.id} item={child} level={level + 1} />
                  ))}
                </SidebarMenu>
              )}
            </CollapsibleContent>
          </Collapsible>
        </PermissionGuard>
      )
    }
    // If no children are allowed, fall through to single block below
  }
  // Single block for parent item if no children are allowed or no children exist
  return (
    <PermissionGuard resource={item.resource} action={item.action}>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={active}>
          <Link href={item.path}>
            {item.icon && <item.icon className="h-4 w-4" />}
            <span>{item.label}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </PermissionGuard>
  )
})
