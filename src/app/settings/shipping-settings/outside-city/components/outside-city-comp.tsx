"use client"

import { CustomTable, CustomTableColumn } from "@/components/customTable"
import { Edit, Plus } from "lucide-react"
import { useEffect, useState } from "react"

import { ApiService } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { DashboardHeader } from "@/components/dashboard-header"
import { OutsideCity } from "@/types/outsideCityTypes"
import { OutsideCityModal } from "./outside-city-modal"
import { PageTransition } from "@/providers/page-transition"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Info } from "lucide-react"
import { observer } from "mobx-react-lite"
import { toastUtils } from "@/utils/toast-utils"

export const OutsideCityComp = observer(() => {
    const [outsideCities, setOutsideCities] = useState<OutsideCity[]>([])
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState<OutsideCity | null>(null)

    useEffect(() => {
        loadOutsideCities()
    }, [])

    const loadOutsideCities = async () => {
        try {
            const response = await ApiService.getAllOutsideCity()
            if (response.status && response.data) {
                setOutsideCities(response.data)
            }
        } catch {
            toastUtils.error("Failed to Load", "Unable to fetch outside city routes.")
        }
    }

    const handleAdd = () => {
        setSelectedItem(null)
        setIsModalOpen(true)
    }

    const handleEdit = (item: OutsideCity) => {
        setSelectedItem(item)
        setIsModalOpen(true)
    }

    const handleModalClose = () => {
        setIsModalOpen(false)
        setSelectedItem(null)
    }

    const handleSuccess = () => {
        loadOutsideCities()
        handleModalClose()
    }

    const columns: CustomTableColumn<OutsideCity>[] = [
        {
            header: "ID",
            accessor: "id" as keyof OutsideCity,
            className: "font-mono text-sm",
        },
        {
            header: "Route Title",
            accessor: "title" as keyof OutsideCity,
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
                    title="Outside City Routes" 
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
                            data={outsideCities}
                            enableSorting={true}
                            emptyContent={
                                <div className="text-center py-8 text-muted-foreground">
                                    No outside city routes found. Click "Add Route" to create one.
                                </div>
                            }
                        />
                    </div>
                </section>
                
                <OutsideCityModal
                    open={isModalOpen}
                    onOpenChange={handleModalClose}
                    item={selectedItem}
                    onSuccess={handleSuccess}
                />
            </div>
        </PageTransition>
    )
})

export default OutsideCityComp
