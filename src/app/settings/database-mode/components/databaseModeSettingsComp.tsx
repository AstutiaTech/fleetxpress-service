"use client"

import { useEffect } from "react"
import { observer } from "mobx-react-lite"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { DashboardHeader } from "@/components/dashboard-header"
import { useStore } from "@/providers/store.provider"
import { Loader2, Database, AlertTriangle, CheckCircle2 } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export const DatabaseModeSettingsComp = observer(() => {
  const { databaseModeStore } = useStore()
  const { mode, testDatabaseAvailable, isLoading, isSwitching, error } = databaseModeStore

  useEffect(() => {
    databaseModeStore.fetchDatabaseMode()
  }, [databaseModeStore])

  const handleModeChange = async (newMode: 'live' | 'sandbox') => {
    if (isSwitching) return

    if (newMode === 'sandbox' && !testDatabaseAvailable) {
      return
    }

    await databaseModeStore.switchMode(newMode)
    
    // Optionally reload the page after mode change
    // setTimeout(() => {
    //   window.location.reload()
    // }, 2000)
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <DashboardHeader title="Database Mode Settings" />
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <DashboardHeader title="Database Mode Settings" />
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Current Database Mode
          </CardTitle>
          <CardDescription>
            Switch between live and sandbox database modes. In sandbox mode, all operations (including authentication) will use the test database.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Mode Display */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${mode === 'live' ? 'bg-green-100 dark:bg-green-900/30' : 'bg-yellow-100 dark:bg-yellow-900/30'}`}>
                {mode === 'live' ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                )}
              </div>
              <div>
                <p className="font-medium">Current Mode</p>
                <p className="text-sm text-muted-foreground">
                  {mode === 'live' ? 'Live Database' : 'Sandbox Database'}
                </p>
              </div>
            </div>
            <Badge 
              variant={mode === 'live' ? 'default' : 'secondary'}
              className={mode === 'live' ? 'bg-green-600' : 'bg-yellow-600'}
            >
              {mode.toUpperCase()}
            </Badge>
          </div>

          {/* Test Database Availability */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Test Database Available</p>
              <p className="text-sm text-muted-foreground">
                Status of the sandbox/test database
              </p>
            </div>
            {testDatabaseAvailable ? (
              <Badge variant="default" className="bg-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Available
              </Badge>
            ) : (
              <Badge variant="destructive">
                <AlertTriangle className="h-3 w-3 mr-1" />
                Unavailable
              </Badge>
            )}
          </div>

          <Separator />

          {/* Mode Switching */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Switch Mode</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button
                variant={mode === 'live' ? 'default' : 'outline'}
                className={`h-auto p-6 flex flex-col items-center gap-3 ${mode === 'live' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                onClick={() => handleModeChange('live')}
                disabled={isSwitching || mode === 'live'}
              >
                <div className="p-3 rounded-full bg-white/20">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <p className="font-semibold">Switch to Live</p>
                  <p className="text-xs opacity-80 mt-1">
                    Use production database
                  </p>
                </div>
              </Button>

              <Button
                variant={mode === 'sandbox' ? 'default' : 'outline'}
                className={`h-auto p-6 flex flex-col items-center gap-3 ${mode === 'sandbox' ? 'bg-yellow-600 hover:bg-yellow-700' : ''}`}
                onClick={() => handleModeChange('sandbox')}
                disabled={isSwitching || mode === 'sandbox' || !testDatabaseAvailable}
              >
                <div className="p-3 rounded-full bg-white/20">
                  <AlertTriangle className="h-6 w-6" />
                </div>
                <div className="text-center">
                  <p className="font-semibold">Switch to Sandbox</p>
                  <p className="text-xs opacity-80 mt-1">
                    Use test database
                  </p>
                </div>
              </Button>
            </div>

            {!testDatabaseAvailable && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  Test database is not available. You cannot switch to sandbox mode until the test database is configured.
                </AlertDescription>
              </Alert>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isSwitching && (
              <div className="flex items-center justify-center gap-2 p-4 bg-muted rounded-lg">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">
                  Switching database mode...
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
})

