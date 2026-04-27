"use client"

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { observer } from "mobx-react-lite"
import { useEffect } from "react"
import { useStore } from "@/providers/store.provider"

interface DatabaseModeBadgeProps {
  showTooltip?: boolean
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  className?: string
}

export const DatabaseModeBadge = observer<DatabaseModeBadgeProps>(({
  showTooltip = true,
  position = 'top-right',
  className,
}) => {
  const { databaseModeStore } = useStore()
  const { mode, isLoading } = databaseModeStore

  useEffect(() => {
    databaseModeStore.fetchDatabaseMode()

    // Refresh mode every 30 seconds
    const interval = setInterval(() => {
      databaseModeStore.fetchDatabaseMode(true, true)
    }, 30000)

    return () => clearInterval(interval)
  }, [databaseModeStore])

  if (isLoading) return null

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  }

  const badgeContent = (
    <Badge
      variant={mode === 'live' ? 'default' : 'secondary'}
      className={cn(
        "fixed z-50 pointer-events-auto cursor-pointer",
        positionClasses[position],
        mode === 'live' && "bg-green-600 hover:bg-green-700",
        mode === 'sandbox' && "bg-yellow-600 hover:bg-yellow-700 text-white",
        className
      )}
    >
      <span className="mr-1.5">
        {mode === 'live' ? '🟢' : '🟡'}
      </span>
      <span className="font-semibold">{mode.toUpperCase()}</span>
    </Badge>
  )

  if (!showTooltip) {
    return badgeContent
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild className="mr-28 mt-1">
        {badgeContent}
      </TooltipTrigger>
      <TooltipContent>
        <p className="text-black">
          {mode === 'live' 
            ? 'Using live database' 
            : 'Using sandbox/test database'}
        </p>
      </TooltipContent>
    </Tooltip>
  )
})

