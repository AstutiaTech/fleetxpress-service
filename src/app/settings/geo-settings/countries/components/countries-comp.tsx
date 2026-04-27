"use client"

import { CustomTable, CustomTableColumn } from "@/components/customTable"
import { Button } from "@/components/ui/button"
import { Edit, Plus } from "lucide-react"
import { Country } from "@/types/geoTypes"
import { observer } from "mobx-react-lite"
import { useEffect, useState } from "react"
import { ApiService } from "@/lib/api"
import { toastUtils } from "@/utils/toast-utils"
import { CountryModal } from "./country-modal"

export const CountriesComp = observer(() => {
    const [countries, setCountries] = useState<Country[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState<Country | null>(null)

    useEffect(() => {
        loadCountries()
    }, [])

    const loadCountries = async () => {
        setIsLoading(true)
        try {
            const response = await ApiService.getCountries()
            if (response.status && response.data) {
                setCountries(response.data)
            }
        } catch (error) {
            toastUtils.error("Failed to Load", "Unable to fetch countries.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleEdit = (item: Country) => {
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
        loadCountries()
        handleModalClose()
    }

    const columns: CustomTableColumn<Country>[] = [
        {
            header: "Name",
            accessor: "name" as keyof Country,
            className: "font-medium",
        },
        {
            header: "Code",
            accessor: "code" as keyof Country,
        },
        {
            header: "ISO Code",
            accessor: "isoCode" as keyof Country,
        },
        {
            header: "Capital",
            accessor: "capital" as keyof Country,
        },
        {
            header: "Coordinates",
            cell: (row) => `${row.latitude.toFixed(4)}, ${row.longitude.toFixed(4)}`,
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
        <div className="flex flex-1 flex-col gap-4 w-full max-w-full">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Countries</h2>
                <Button 
                    variant="default" 
                    className="cursor-pointer"
                    onClick={handleAdd}
                >
                    <Plus className="w-4 h-4" /> Add Country
                </Button>
            </div>
            <div className="w-full flex">
                <CustomTable
                    columns={columns}
                    data={countries}
                    enableSorting={true}
                    emptyContent={
                        <div className="text-center py-8 text-muted-foreground">
                            No countries found
                        </div>
                    }
                />
            </div>
            
            <CountryModal
                open={isModalOpen}
                onOpenChange={handleModalClose}
                item={selectedItem}
                onSuccess={handleSuccess}
            />
        </div>
    )
})

export default CountriesComp

