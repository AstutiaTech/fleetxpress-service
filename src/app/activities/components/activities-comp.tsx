"use client"

import { ActivitiesTable } from "./activities-table"
import { Button } from "@/components/ui/button"
import { DashboardHeader } from "@/components/dashboard-header"
import { PageTransition } from "@/providers/page-transition"
import { RefreshCw } from "lucide-react"
import { observer } from "mobx-react-lite"
import { useEffect } from "react"
import { useStore } from "@/providers/store.provider"

export const ActivitiesComp = observer(() => {
    const { activityStore } = useStore()

    useEffect(() => {
        activityStore.fetchAllActivities({ page: 1, limit: 10 })
    }, [])

    const handleRefresh = () => {
        activityStore.fetchAllActivities({ 
            page: activityStore.pagination.page, 
            limit: activityStore.pagination.limit 
        })
    }

    return (
        <PageTransition>
            <div className="flex flex-1 flex-col gap-4 w-full max-w-full min-h-screen">
                <DashboardHeader 
                    title="Activity Log" 
                    rightWidgets={[
                        <Button key="refresh" variant="outline" onClick={handleRefresh}>
                            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                        </Button>
                    ]} 
                />
                <section className="w-full max-w-full">
                    <div className="w-full">
                        <ActivitiesTable />
                    </div>
                </section>
            </div>
        </PageTransition>
    )
})

