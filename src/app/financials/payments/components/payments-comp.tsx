"use client"

import { useEffect, useState } from "react"
import { observer } from "mobx-react-lite"
import { useStore } from "@/providers/store.provider"
import { DashboardHeader } from "@/components/dashboard-header"
import { PaymentsTable } from "./payments-table"
import { PageTransition } from "@/providers/page-transition"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { CreatePaymentModal } from "./create-payment-modal"

export const PaymentsComp = observer(() => {
    const { paymentsStore } = useStore()
    const [createModalOpen, setCreateModalOpen] = useState(false)

    useEffect(() => {
        paymentsStore.fetchAllPayments({ page: 1, limit: 10 })
    }, [])

    return (
        <PageTransition>
            <div className="flex flex-1 flex-col gap-4 w-full max-w-full min-h-screen pb-14">
                <div className="flex items-center justify-between">
                    <DashboardHeader title="Payments" />
                    <Button onClick={() => setCreateModalOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Record Payment
                    </Button>
                </div>
                <section className="w-full max-w-full">
                    <div className="w-full flex">
                        <PaymentsTable />
                    </div>
                </section>
                <CreatePaymentModal
                    open={createModalOpen}
                    onOpenChange={setCreateModalOpen}
                    onSuccess={() => {
                        paymentsStore.fetchAllPayments({ page: 1, limit: 10 })
                    }}
                />
            </div>
        </PageTransition>
    )
})

