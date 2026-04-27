"use client"

import { Sheet, SheetContent, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"

import { Badge } from "@/components/ui/badge"
import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Notification } from "@/stores/notifications-store"
import { formatDistanceToNow } from "date-fns"
import { observer } from "mobx-react-lite"
import { useEffect } from "react"
import { useStore } from "@/providers/store.provider"

// Icons for different notification types
const NotificationIcon = ({ type }: { type: Notification["type"] }) => {
  switch (type) {
    case "transaction":
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </div>
      )
    case "security":
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 text-red-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
      )
    case "system":
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
            <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
            <line x1="6" y1="6" x2="6.01" y2="6" />
            <line x1="6" y1="18" x2="6.01" y2="18" />
          </svg>
        </div>
      )
    case "account":
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
      )
    case "loan":
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="2" y="6" width="20" height="12" rx="2" />
            <circle cx="12" cy="12" r="2" />
            <path d="M6 12h.01M18 12h.01" />
          </svg>
        </div>
      )
    case "deposit":
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100 text-yellow-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2h0V5z" />
            <path d="M2 9v1c0 1.1.9 2 2 2h1" />
            <path d="M16 11h0" />
          </svg>
        </div>
      )
    default:
      return (
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-500">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
          </svg>
        </div>
      )
  }
}

// Individual notification item
const NotificationItem = observer(
  ({
    notification,
    onRead,
    onRemove,
  }: {
    notification: Notification
    onRead: (id: string) => void
    onRemove: (id: string) => void
  }) => {
    return (
      <div
        className={`flex gap-4 p-4 border-b transition-colors ${
          notification.isRead ? "bg-background" : "bg-primary-50"
        }`}
      >
        <NotificationIcon type={notification.type} />
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <h4 className="font-medium text-sm">{notification.title}</h4>
            <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
              {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
          <div className="flex gap-2 mt-2">
            {!notification.isRead && (
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => onRead(notification.id)}>
                Mark as read
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted-foreground"
              onClick={() => onRemove(notification.id)}
            >
              Dismiss
            </Button>
          </div>
        </div>
      </div>
    )
  },
)

// Empty state when no notifications
const EmptyNotifications = () => (
  <div className="flex flex-col items-center justify-center py-12 px-4">
    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
      <Bell className="h-8 w-8 text-muted-foreground" />
    </div>
    <h3 className="text-lg font-medium">No notifications</h3>
    <p className="text-sm text-muted-foreground text-center mt-1">
      When you receive notifications, they will appear here.
    </p>
  </div>
)

// Main notifications component
export const Notifications = observer(() => {
  const { notificationsStore } = useStore()
  const { notifications, unreadCount, isOpen, isLoading } = notificationsStore

  // Fetch notifications when component mounts
  useEffect(() => {
    notificationsStore.fetchNotifications()
  }, [notificationsStore])

  return (
    <Sheet open={isOpen} onOpenChange={(open) => notificationsStore.setOpen(open)}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-9 w-9 rounded-full">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 min-w-[1.25rem] px-1 bg-primary-500 text-black dark:text-white" variant="default">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <SheetTitle>Notifications</SheetTitle>
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => notificationsStore.markAllAsRead()}
                disabled={unreadCount === 0}
              >
                Mark all as read
              </Button>
            )}
          </div>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin h-6 w-6 border-2 border-primary-500 border-t-transparent rounded-full"></div>
            </div>
          ) : notifications.length === 0 ? (
            <EmptyNotifications />
          ) : (
            <div>
              {notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={(id) => notificationsStore.markAsRead(id)}
                  onRemove={(id) => notificationsStore.removeNotification(id)}
                />
              ))}
            </div>
          )}
        </div>

        {notifications.length > 0 && (
          <SheetFooter className="p-4 border-t mt-auto">
            <Button variant="outline" className="w-full" onClick={() => notificationsStore.clearAllNotifications()}>
              Clear all notifications
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
})
