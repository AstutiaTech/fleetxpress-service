"use client"

import { CustomTable, CustomTableColumn } from "@/components/customTable"
import { Button } from "@/components/ui/button"
import { Edit, Plus } from "lucide-react"
import { State } from "@/types/geoTypes"
import { observer } from "mobx-react-lite"
import { useEffect, useState } from "react"
import { ApiService } from "@/lib/api"
import { toastUtils } from "@/utils/toast-utils"
import { StateModal } from "./state-modal"
import { useStore } from "@/providers/store.provider"

export const StatesComp = observer(() => {
    const { shipmentStore } = useStore()
    const [states, setStates] = useState<State[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState<State | null>(null)
    const [countries, setCountries] = useState<{ id: number; name: string }[]>([])

    useEffect(() => {
        loadStates()
        loadCountries()
    }, [])

    const loadStates = async () => {
        setIsLoading(true)
        try {
            // Load all states - fetch from all countries
            const countriesData = await shipmentStore.fetchCountries({ limit: 200 })
            const allStates: State[] = []
            for (const country of countriesData) {
                const response = await ApiService.getStates(country.id, { limit: 1000 })
                if (response.status && response.data) {
                    allStates.push(...response.data)
                }
            }
            setStates(allStates)
        } catch {
            toastUtils.error("Failed to Load", "Unable to fetch states.")
        } finally {
            setIsLoading(false)
        }
    }

    const loadCountries = async () => {
        try {
            const countriesData = await shipmentStore.fetchCountries({ limit: 200 })
            setCountries(countriesData.map(c => ({ id: c.id, name: c.name })))
        } catch (error) {
            console.error("Failed to load countries:", error)
        }
    }

    const handleEdit = (item: State) => {
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
        loadStates()
        handleModalClose()
    }

    const getCountryName = (countryId: number) => {
        return countries.find(c => c.id === countryId)?.name || `Country ${countryId}`
    }

    const columns: CustomTableColumn<State>[] = [
        {
            header: "Name",
            accessor: "name" as keyof State,
            className: "font-medium",
        },
        {
            header: "Country",
            cell: (row) => getCountryName(row.countryId),
        },
        {
            header: "Capital",
            accessor: "capital" as keyof State,
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
                <h2 className="text-2xl font-bold">States</h2>
                <Button 
                    variant="default" 
                    className="cursor-pointer"
                    onClick={handleAdd}
                >
                    <Plus className="w-4 h-4" /> Add State
                </Button>
            </div>
            <div className="w-full flex">
                <CustomTable
                    columns={columns}
                    data={states}
                    enableSorting={true}
                    emptyContent={
                        <div className="text-center py-8 text-muted-foreground">
                            No states found
                        </div>
                    }
                />
            </div>
            
            <StateModal
                open={isModalOpen}
                onOpenChange={handleModalClose}
                item={selectedItem}
                onSuccess={handleSuccess}
                countries={countries}
            />
        </div>
    )
})

export default StatesComp

