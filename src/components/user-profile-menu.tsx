"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { LogOut, Settings, User } from "lucide-react"

import { Button } from "@/components/ui/button"
import { observer } from "mobx-react-lite"
import { useRouter } from "next/navigation"
import { useStore } from "@/providers/store.provider"

export const UserProfileMenu = observer(() => {
  const router = useRouter()
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="relative h-10 w-10 rounded-full border border-blue-500 border-double flex justify-center items-center">
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-8 w-8">
              <AvatarImage src={auth.profile?.profilePicture || "/placeholder.svg"} alt={`${auth.profile?.firstName} ${auth.profile?.lastName}`} />
              <AvatarFallback className="bg-white text-black">{getInitials(`${auth.profile?.firstName} ${auth.profile?.lastName}`)}</AvatarFallback>
            </Avatar>
          </Button>
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{`${auth.profile?.firstName} ${auth.profile?.lastName}`}</p>
            <p className="text-xs leading-none text-muted-foreground">{auth.user?.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            <span>Profile</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings className="mr-2 h-4 w-4" />
            <span>Settings</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
})
