"use client"

import { CustomTable, CustomTableColumn } from "@/components/customTable"
import { Button } from "@/components/ui/button"
import { DashboardHeader } from "@/components/dashboard-header"
import { Edit, Plus } from "lucide-react"
import { Packaging } from "@/types/packagingType"
import { PageTransition } from "@/providers/page-transition"
import { formatPrice } from "@/handlers/formatters"
import { observer } from "mobx-react-lite"
import { useEffect, useState } from "react"
import { ApiService } from "@/lib/api"
import { toastUtils } from "@/utils/toast-utils"
import { PackageModal } from "./package-modal"

export const PackagesComp = observer(() => {
    const [packages, setPackages] = useState<Packaging[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState<Packaging | null>(null)

    useEffect(() => {
        loadPackages()
    }, [])

    const loadPackages = async () => {
        setIsLoading(true)
        try {
            const response = await ApiService.getAllPackages()
            if (response.status && response.data) {
                setPackages(response.data)
            }
        } catch (error) {
            toastUtils.error("Failed to Load", "Unable to fetch packages settings.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleEdit = (item: Packaging) => {
        setSelectedItem(item)
        setIsModalOpen(true)
    }

    const handleModalClose = () => {
        setIsModalOpen(false)
        setSelectedItem(null)
    }

    const handleSuccess = () => {
        loadPackages()
        handleModalClose()
    }

    const columns: CustomTableColumn<Packaging>[] = [
        {
            header: "Name",
            accessor: "name" as keyof Packaging,
            className: "font-medium",
        },
        {
            header: "Price (₦)",
            cell: (row) => formatPrice(row.price),
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
            header: "Image",
            cell: (row) => (
                row.image ? (
                    <img src={row.image} alt={row.name} className="h-10 w-10 object-cover rounded" />
                ) : (
                    <span className="text-muted-foreground">No image</span>
                )
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
                    title="Packages Settings" 
                    rightWidgets={[
                        <Button 
                            key="add" 
                            variant="default" 
                            className="cursor-pointer"
                            onClick={() => setIsModalOpen(true)}
                        >
                            <Plus className="w-4 h-4" /> Add Package
                        </Button>
                    ]} 
                />
                <section className="w-full max-w-full">
                    <div className="w-full flex">
                        <CustomTable
                            columns={columns}
                            data={packages}
                            enableSorting={true}
                            emptyContent={
                                <div className="text-center py-8 text-muted-foreground">
                                    No packages found
                                </div>
                            }
                        />
                    </div>
                </section>
                
                <PackageModal
                    open={isModalOpen}
                    onOpenChange={handleModalClose}
                    item={selectedItem}
                    onSuccess={handleSuccess}
                />
            </div>
        </PageTransition>
    )
})

export default PackagesComp

