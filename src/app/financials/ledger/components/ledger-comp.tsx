"use client"

import { useEffect } from "react"
import { observer } from "mobx-react-lite"
import { useStore } from "@/providers/store.provider"
import { DashboardHeader } from "@/components/dashboard-header"
import { LedgerTable } from "./ledger-table"
import { PageTransition } from "@/providers/page-transition"
import { ApiService } from "@/lib/api"
import { useState } from "react"

export const LedgerComp = observer(() => {
    const [ledgerEntries, setLedgerEntries] = useState<any[]>([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        loadLedgerEntries()
    }, [])

    const loadLedgerEntries = async () => {
        setLoading(true)
        try {
            const response = await ApiService.getAllLedgerEntries({ page: 1, limit: 50 })
            if (response.status && response.data) {
                setLedgerEntries(response.data)
            } else {
                setLedgerEntries([])
            }
        } catch (error) {
            console.error("Failed to load ledger entries:", error)
            setLedgerEntries([])
        } finally {
            setLoading(false)
        }
    }

    return (
        <PageTransition>
            <div className="flex flex-1 flex-col gap-4 w-full max-w-full min-h-screen">
                <DashboardHeader title="General Ledger" />
                <section className="w-full max-w-full">
                    <div className="w-full flex">
                        <LedgerTable entries={ledgerEntries} loading={loading} />
                    </div>
                </section>
            </div>
        </PageTransition>
    )
})

