"use client"

import { CustomTable, CustomTableColumn } from "@/components/customTable"
import { Button } from "@/components/ui/button"
import { DashboardHeader } from "@/components/dashboard-header"
import { Edit, Plus } from "lucide-react"
import { Currency } from "@/types/currencyTypes"
import { PageTransition } from "@/providers/page-transition"
import { observer } from "mobx-react-lite"
import { useEffect, useState } from "react"
import { ApiService } from "@/lib/api"
import { toastUtils } from "@/utils/toast-utils"
import { CurrencyModal } from "./currency-modal"

export const CurrenciesComp = observer(() => {
    const [currencies, setCurrencies] = useState<Currency[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState<Currency | null>(null)

    useEffect(() => {
        loadCurrencies()
    }, [])

    const loadCurrencies = async () => {
        setIsLoading(true)
        try {
            const response = await ApiService.getAllCurrencies()
            if (response.status && response.data) {
                setCurrencies(response.data)
            }
        } catch (error) {
            toastUtils.error("Failed to Load", "Unable to fetch currencies.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleEdit = (item: Currency) => {
        setSelectedItem(item)
        setIsModalOpen(true)
    }

    const handleAdd = () => {
        setSelectedItem(null)
        setIsModalOpen(true)
    }

    const handleModalClose = () => {
        setIsModalOpen(false)
        setSelectedItem(null)
    }

    const handleSuccess = () => {
        loadCurrencies()
        handleModalClose()
    }

    const columns: CustomTableColumn<Currency>[] = [
        {
            header: "Name",
            accessor: "name" as keyof Currency,
            className: "font-medium",
        },
        {
            header: "Symbol",
            accessor: "symbol" as keyof Currency,
        },
        {
            header: "Exchange Rate",
            cell: (row) => row.exchangeRate.toFixed(4),
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
                    title="Currencies Settings" 
                    rightWidgets={[
                        <Button 
                            key="add" 
                            variant="default" 
                            className="cursor-pointer"
                            onClick={handleAdd}
                        >
                            <Plus className="w-4 h-4" /> Add Currency
                        </Button>
                    ]} 
                />
                <section className="w-full max-w-full">
                    <div className="w-full flex">
                        <CustomTable
                            columns={columns}
                            data={currencies}
                            enableSorting={true}
                            emptyContent={
                                <div className="text-center py-8 text-muted-foreground">
                                    No currencies found
                                </div>
                            }
                        />
                    </div>
                </section>
                
                <CurrencyModal
                    open={isModalOpen}
                    onOpenChange={handleModalClose}
                    item={selectedItem}
                    onSuccess={handleSuccess}
                />
            </div>
        </PageTransition>
    )
})

export default CurrenciesComp

