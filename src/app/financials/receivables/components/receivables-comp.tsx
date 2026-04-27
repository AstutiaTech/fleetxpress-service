"use client"

import { useEffect } from "react"
import { observer } from "mobx-react-lite"
import { useStore } from "@/providers/store.provider"
import { Button } from "@/components/ui/button"
import { DashboardHeader } from "@/components/dashboard-header"
import { ReceivablesTable } from "./receivables-table"
import { ReceivableModal } from "./receivable-modal"
import { PageTransition } from "@/providers/page-transition"
import { PlusIcon } from "lucide-react"
import { useState } from "react"
import { Receivable } from "@/types/financialsTypes"

export const ReceivablesComp = observer(() => {
    const { receivablesStore } = useStore()
    const [modalOpen, setModalOpen] = useState(false)
    const [selectedReceivable, setSelectedReceivable] = useState<Receivable | null>(null)

    useEffect(() => {
        receivablesStore.fetchAllReceivables()
    }, [])

    const handleCreate = () => {
        setSelectedReceivable(null)
        setModalOpen(true)
    }

    const handleEdit = (receivable: Receivable) => {
        setSelectedReceivable(receivable)
        setModalOpen(true)
    }

    const handleSuccess = () => {
        setModalOpen(false)
        setSelectedReceivable(null)
        receivablesStore.fetchAllReceivables()
    }

    return (
        <PageTransition>
            <div className="flex flex-1 flex-col gap-4 w-full max-w-full min-h-screen">
                <DashboardHeader 
                    title="Invoices (Receivables)" 
                    rightWidgets={[
                        <Button key="create" variant="default" onClick={handleCreate}>
                            <PlusIcon className="w-4 h-4" /> Create Invoice
                        </Button>
                    ]} 
                />
                <section className="w-full max-w-full">
                    <div className="w-full flex">
                        <ReceivablesTable onEdit={handleEdit} />
                    </div>
                </section>
                <ReceivableModal
                    open={modalOpen}
                    onOpenChange={setModalOpen}
                    item={selectedReceivable}
                    onSuccess={handleSuccess}
                />
            </div>
        </PageTransition>
    )
})

