"use client"

import { CustomTable, CustomTableColumn } from "@/components/customTable"
import { Button } from "@/components/ui/button"
import { DashboardHeader } from "@/components/dashboard-header"
import { Edit, Plus } from "lucide-react"
import { CostingRate } from "@/types/costingTypes"
import { PageTransition } from "@/providers/page-transition"
import { formatPrice } from "@/handlers/formatters"
import { observer } from "mobx-react-lite"
import { useEffect, useState } from "react"
import { ApiService } from "@/lib/api"
import { toastUtils } from "@/utils/toast-utils"
import { CostingModal } from "./costing-modal"

export const CostingsComp = observer(() => {
    const [costings, setCostings] = useState<CostingRate[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState<CostingRate | null>(null)

    useEffect(() => {
        loadCostings()
    }, [])

    const loadCostings = async () => {
        setIsLoading(true)
        try {
            const response = await ApiService.getAllCostings()
            if (response.status && response.data) {
                setCostings(response.data)
            }
        } catch (error) {
            toastUtils.error("Failed to Load", "Unable to fetch costings settings.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleEdit = (item: CostingRate) => {
        setSelectedItem(item)
        setIsModalOpen(true)
    }

    const handleModalClose = () => {
        setIsModalOpen(false)
        setSelectedItem(null)
    }

    const handleSuccess = () => {
        loadCostings()
        handleModalClose()
    }

    const columns: CustomTableColumn<CostingRate>[] = [
        {
            header: "Name",
            accessor: "name" as keyof CostingRate,
            className: "font-medium",
        },
        {
            header: "Slug",
            accessor: "slug" as keyof CostingRate,
        },
        {
            header: "Inside Charge (₦)",
            cell: (row) => formatPrice(row.insideCharge),
        },
        {
            header: "Outside Charge (₦)",
            cell: (row) => formatPrice(row.outsideCharge),
        },
        {
            header: "Status",
            cell: (row) => (
                <span className={row.status === 1 ? "text-green-600" : "text-gray-500"}>
                    {row.status === 1 ? "Active" : "Inactive"}
                </span>
            ),
        },
        {
            header: "Actions",
            cell: (row) => (
                <Button variant="ghost" size="sm" onClick={() => handleEdit(row)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                </Button>
            ),
        },
    ]

    return (
        <PageTransition>
            <div className="flex flex-1 flex-col gap-4 w-full max-w-full min-h-screen pb-14">
                <DashboardHeader 
                    title="Costings Settings" 
                    rightWidgets={[
                        <Button 
                            key="add" 
                            variant="default" 
                            className="cursor-pointer"
                            onClick={() => setIsModalOpen(true)}
                        >
                            <Plus className="w-4 h-4" /> Add Costing
                        </Button>
                    ]} 
                />
                <section className="w-full max-w-full">
                    <div className="w-full flex">
                        <CustomTable
                            columns={columns}
                            data={costings}
                            enableSorting={true}
                            emptyContent={
                                <div className="text-center py-8 text-muted-foreground">
                                    No costings settings found
                                </div>
                            }
                        />
                    </div>
                </section>
                
                <CostingModal
                    open={isModalOpen}
                    onOpenChange={handleModalClose}
                    item={selectedItem}
                    onSuccess={handleSuccess}
                />
            </div>
        </PageTransition>
    )
})

export default CostingsComp

