"use client"

import { useEffect } from "react"
import { observer } from "mobx-react-lite"
import { useStore } from "@/providers/store.provider"
import { Button } from "@/components/ui/button"
import { DashboardHeader } from "@/components/dashboard-header"
import { PayablesTable } from "./payables-table"
import { PayableModal } from "./payable-modal"
import { PageTransition } from "@/providers/page-transition"
import { PlusIcon } from "lucide-react"
import { useState } from "react"
import { Payable } from "@/types/financialsTypes"

export const PayablesComp = observer(() => {
    const { payablesStore } = useStore()
    const [modalOpen, setModalOpen] = useState(false)
    const [selectedPayable, setSelectedPayable] = useState<Payable | null>(null)

    useEffect(() => {
        payablesStore.fetchAllPayables()
    }, [])

    const handleCreate = () => {
        setSelectedPayable(null)
        setModalOpen(true)
    }

    const handleEdit = (payable: Payable) => {
        setSelectedPayable(payable)
        setModalOpen(true)
    }

    const handleSuccess = () => {
        setModalOpen(false)
        setSelectedPayable(null)
        payablesStore.fetchAllPayables()
    }

    return (
        <PageTransition>
            <div className="flex flex-1 flex-col gap-4 w-full max-w-full min-h-screen">
                <DashboardHeader 
                    title="Bills (Payables)" 
                    rightWidgets={[
                        <Button key="create" variant="default" onClick={handleCreate}>
                            <PlusIcon className="w-4 h-4" /> Create Bill
                        </Button>
                    ]} 
                />
                <section className="w-full max-w-full">
                    <div className="w-full flex">
                        <PayablesTable onEdit={handleEdit} />
                    </div>
                </section>
                <PayableModal
                    open={modalOpen}
                    onOpenChange={setModalOpen}
                    item={selectedPayable}
                    onSuccess={handleSuccess}
                />
            </div>
        </PageTransition>
    )
})

