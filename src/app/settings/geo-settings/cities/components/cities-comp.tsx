"use client"

import { CustomTable, CustomTableColumn } from "@/components/customTable"
import { Button } from "@/components/ui/button"
import { Edit, Plus } from "lucide-react"
import { City } from "@/types/geoTypes"
import { observer } from "mobx-react-lite"
import { useEffect, useState } from "react"
import { ApiService } from "@/lib/api"
import { toastUtils } from "@/utils/toast-utils"
import { CityModal } from "./city-modal"
import { useStore } from "@/providers/store.provider"

export const CitiesComp = observer(() => {
    const { shipmentStore } = useStore()
    const [cities, setCities] = useState<City[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState<City | null>(null)
    const [states, setStates] = useState<{ id: number; name: string }[]>([])

    useEffect(() => {
        loadCities()
        loadStates()
    }, [])

    const loadCities = async () => {
        setIsLoading(true)
        try {
            // Load all cities - fetch from all states
            const statesData = await shipmentStore.fetchStates(0, { limit: 200 })
            const allCities: City[] = []
            for (const state of statesData) {
                const response = await ApiService.getCities(state.id, { limit: 1000 })
                if (response.status && response.data) {
                    allCities.push(...response.data)
                }
            }
            setCities(allCities)
        } catch {
            toastUtils.error("Failed to Load", "Unable to fetch cities.")
        } finally {
            setIsLoading(false)
        }
    }

    const loadStates = async () => {
        try {
            const statesData = await shipmentStore.fetchStates(0, { limit: 200 })
            setStates(statesData.map(s => ({ id: s.id, name: s.name })))
        } catch (error) {
            console.error("Failed to load states:", error)
        }
    }

    const handleEdit = (item: City) => {
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
        loadCities()
        handleModalClose()
    }

    const getStateName = (stateId: number) => {
        return states.find(s => s.id === stateId)?.name || `State ${stateId}`
    }

    const columns: CustomTableColumn<City>[] = [
        {
            header: "Name",
            accessor: "name" as keyof City,
            className: "font-medium",
        },
        {
            header: "State",
            cell: (row) => getStateName(row.stateId),
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
                <h2 className="text-2xl font-bold">Cities</h2>
                <Button 
                    variant="default" 
                    className="cursor-pointer"
                    onClick={handleAdd}
                >
                    <Plus className="w-4 h-4" /> Add City
                </Button>
            </div>
            <div className="w-full flex">
                <CustomTable
                    columns={columns}
                    data={cities}
                    enableSorting={true}
                    emptyContent={
                        <div className="text-center py-8 text-muted-foreground">
                            No cities found
                        </div>
                    }
                />
            </div>
            
            <CityModal
                open={isModalOpen}
                onOpenChange={handleModalClose}
                item={selectedItem}
                onSuccess={handleSuccess}
                states={states}
            />
        </div>
    )
})

export default CitiesComp

