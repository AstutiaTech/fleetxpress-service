"use client"

import { useEffect } from "react"
import { observer } from "mobx-react-lite"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useStore } from "@/providers/store.provider"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import type { DatabaseMode } from "@/types/databaseModeTypes"

interface DatabaseModeToggleProps {
  onModeChange?: (mode: DatabaseMode) => void
  showLabel?: boolean
  size?: 'sm' | 'default' | 'lg'
  className?: string
}

export const DatabaseModeToggle = observer<DatabaseModeToggleProps>(({
  onModeChange,
  showLabel = true,
  size = 'default',
  className,
}) => {
  const { databaseModeStore } = useStore()
  const { mode, testDatabaseAvailable, isLoading, isSwitching, error } = databaseModeStore

  useEffect(() => {
    databaseModeStore.fetchDatabaseMode()
  }, [databaseModeStore])

  const handleToggle = async () => {
    if (isSwitching || isLoading) return

    const newMode: DatabaseMode = mode === 'live' ? 'sandbox' : 'live'

    if (newMode === 'sandbox' && !testDatabaseAvailable) {
      return
    }

    const result = await databaseModeStore.switchMode(newMode)
    if (result.success && onModeChange) {
      onModeChange(result.data!.mode)
    }
  }

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {showLabel && <span className="text-sm text-muted-foreground">Database Mode:</span>}
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    )
  }

  const sizeClasses = {
    sm: 'h-8 px-3 text-xs',
    default: 'h-9 px-4 text-sm',
    lg: 'h-10 px-6 text-base',
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {showLabel && (
        <span className="text-sm text-muted-foreground">Database Mode:</span>
      )}

      <Button
        variant={mode === 'live' ? 'default' : 'secondary'}
        size={size}
        onClick={handleToggle}
        disabled={isSwitching || (mode === 'sandbox' && !testDatabaseAvailable)}
        className={cn(
          "relative",
          sizeClasses[size],
          mode === 'live' && "bg-green-600 hover:bg-green-700",
          mode === 'sandbox' && "bg-yellow-600 hover:bg-yellow-700",
        )}
      >
        {isSwitching ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Switching...
          </>
        ) : (
          <>
            <span className="mr-2">
              {mode === 'live' ? '🟢' : '🟡'}
            </span>
            {mode.toUpperCase()}
          </>
        )}
      </Button>

      {error && (
        <span className="text-xs text-destructive" role="alert">
          {error}
        </span>
      )}

      {!testDatabaseAvailable && mode === 'live' && (
        <Badge variant="outline" className="text-xs">
          ⚠️ Test DB Unavailable
        </Badge>
      )}
    </div>
  )
})

