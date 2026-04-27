"use client"

import { observer } from "mobx-react-lite"
import { DashboardHeader } from "@/components/dashboard-header"
import { BackupsTable } from "./backups-table"
import { PageTransition } from "@/providers/page-transition"

export const BackupsComp = observer(() => {
    return (
        <PageTransition>
            <div className="flex flex-1 flex-col gap-4 w-full max-w-full min-h-screen">
                <DashboardHeader 
                    title="Database Backups" 
                    description="Create and manage database backups. Backups are stored in the public directory and can be downloaded directly."
                />
                <section className="w-full max-w-full">
                    <div className="w-full flex">
                        <BackupsTable />
                    </div>
                </section>
            </div>
        </PageTransition>
    )
})

