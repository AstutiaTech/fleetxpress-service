"use client"

import { CustomTable, CustomTableColumn } from "@/components/customTable"
import { Edit, Plus } from "lucide-react"
import { useEffect, useState } from "react"

import { ApiService } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { DashboardHeader } from "@/components/dashboard-header"
import { InsideCity } from "@/types/insideCityTypes"
import { InsideCityModal } from "./inside-city-modal"
import { PageTransition } from "@/providers/page-transition"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info } from "lucide-react"
import { observer } from "mobx-react-lite"
import { toastUtils } from "@/utils/toast-utils"

export const InsideCityComp = observer(() => {
    const [insideCities, setInsideCities] = useState<InsideCity[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState<InsideCity | null>(null)

    useEffect(() => {
        loadInsideCities()
    }, [])

    const loadInsideCities = async () => {
        try {
            const response = await ApiService.getAllInsideCity()
            if (response.status && response.data) {
                setInsideCities(response.data)
            }
        } catch {
            toastUtils.error("Failed to Load", "Unable to fetch inside city routes.")
        }
    }

    const handleAdd = () => {
        setSelectedItem(null)
        setIsModalOpen(true)
    }

    const handleEdit = (item: InsideCity) => {
        setSelectedItem(item)
        setIsModalOpen(true)
    }

    const handleModalClose = () => {
        setIsModalOpen(false)
        setSelectedItem(null)
    }

    const handleSuccess = () => {
        loadInsideCities()
        handleModalClose()
    }

    const columns: CustomTableColumn<InsideCity>[] = [
        {
            header: "ID",
            accessor: "id" as keyof InsideCity,
            className: "font-mono text-sm",
        },
        {
            header: "Route Title",
            accessor: "title" as keyof InsideCity,
            className: "font-medium",
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
                    title="Inside City Routes" 
                    rightWidgets={[
                        <Button 
                            key="add" 
                            variant="default" 
                            className="cursor-pointer"
                            onClick={handleAdd}
                        >
                            <Plus className="w-4 h-4 mr-2" /> Add Route
                        </Button>
                    ]} 
                />
                
                <Alert className="mb-4">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                        Routes now only contain route names. Pricing is configured separately in 
                        <a href="/settings/weight-based-pricing" className="text-primary underline ml-1">
                            Weight-Based Pricing
                        </a> settings.
                    </AlertDescription>
                </Alert>

                <section className="w-full max-w-full">
                    <div className="w-full flex">
                        <CustomTable
                            columns={columns}
                            data={insideCities}
                            enableSorting={true}
                            emptyContent={
                                <div className="text-center py-8 text-muted-foreground">
                                    No inside city routes found. Click "Add Route" to create one.
                                </div>
                            }
                        />
                    </div>
                </section>
                
                <InsideCityModal
                    open={isModalOpen}
                    onOpenChange={handleModalClose}
                    item={selectedItem}
                    onSuccess={handleSuccess}
                />
            </div>
        </PageTransition>
    )
})

export default InsideCityComp
