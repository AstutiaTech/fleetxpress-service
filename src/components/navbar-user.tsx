"use client"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  IconCreditCard,
  IconDotsVertical,
  IconLogout,
  IconNotification,
  IconSettings,
  IconUserCircle,
} from "@tabler/icons-react"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

import { useStore } from "@/providers/store.provider"

export function NavUser() {
  const { isMobile } = useSidebar()

  const { authStore } = useStore()
  const auth = authStore;
  // const { user, logout } = authStore

  if (!auth.user) {
    return null
  }

  const handleLogout = async () => {
    const res = await auth.logout()
    if (res.success) {
      window.location.href = "/login"
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg grayscale">
                <AvatarImage src={auth.profile?.profilePicture || "/placeholder.svg"} alt={`${auth.profile?.firstName} ${auth.profile?.lastName}`} />
                <AvatarFallback className="rounded-lg">{getInitials(`${auth.profile?.firstName} ${auth.profile?.lastName}`)}</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">{`${auth.profile?.firstName} ${auth.profile?.lastName}`}</span>
                <span className="text-muted-foreground truncate text-xs">
                  {auth.user?.email}
                </span>
              </div>
              <IconDotsVertical className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={auth.profile?.profilePicture || "/placeholder.svg"} alt={`${auth.profile?.firstName} ${auth.profile?.lastName}`} />
                  <AvatarFallback className="rounded-lg">{getInitials(`${auth.profile?.firstName} ${auth.profile?.lastName}`)}</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{`${auth.profile?.firstName} ${auth.profile?.lastName}`}</span>
                  <span className="text-muted-foreground truncate text-xs">
                    {auth.user?.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <IconUserCircle />
                Account
              </DropdownMenuItem>
              <DropdownMenuItem>
                <IconSettings />
                Settings
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <IconLogout />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
