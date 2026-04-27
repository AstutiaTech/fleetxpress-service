"use client"

import { Button } from "@/components/ui/button"
import { DashboardHeader } from "@/components/dashboard-header"
import Link from "next/link"
import { PageTransition } from "@/providers/page-transition"
import { PlusIcon } from "lucide-react"
import { ShipmentOverviewCards } from "./shipment-overview-cards"
import { ShipmentsTable } from "./shipments-table"
import { ShipmentFiltersComponent } from "./shipment-filters"
import { motion } from "framer-motion"
import { observer } from "mobx-react-lite"
import { useEffect, useState } from "react"
import { useStore } from "@/providers/store.provider"
import { ShipmentFilters } from "@/types/shipmentTypes"

export const ShipmentComp = observer(() => {
    const { shipmentStore } = useStore()
    const [filters, setFilters] = useState<ShipmentFilters>({})

    useEffect(() => {
        shipmentStore.fetchAllShipments({ page: 1, limit: 10, ...filters })
    }, [shipmentStore])

    const handleFiltersChange = (newFilters: ShipmentFilters) => {
        setFilters(newFilters)
        shipmentStore.setFilters(newFilters)
    }

    const handleResetFilters = () => {
        setFilters({})
        shipmentStore.clearFilters()
        shipmentStore.setPage(1)
        shipmentStore.fetchAllShipments({ page: 1, limit: shipmentStore.pagination.limit })
    }

    const handleApplyFilters = () => {
        shipmentStore.setPage(1)
        shipmentStore.setFilters(filters)
        shipmentStore.fetchAllShipments({ page: 1, limit: shipmentStore.pagination.limit, ...filters })
    }

    return (
        <PageTransition>
            <div className="flex flex-1 flex-col gap-4 w-full max-w-full min-h-screen pb-14">
                <DashboardHeader title="Shipment Management" rightWidgets={[
                    <Link key="add-shipment" href="/shipment-management/shipments/create">
                        <Button variant="default" className="cursor-pointer"><PlusIcon className="w-4 h-4" /> Add Shipment</Button>
                    </Link>
                ]} />
                <section className="w-full max-w-full">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="w-full"
                    >
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 py-4 mb-4">
                            <ShipmentOverviewCards />
                        </div>
                        <ShipmentFiltersComponent
                            filters={filters}
                            onFiltersChange={handleFiltersChange}
                            onReset={handleResetFilters}
                            onApply={handleApplyFilters}
                        />
                        <div className="w-full flex">
                            <ShipmentsTable />
                        </div>
                    </motion.div>
                </section>
            </div>
        </PageTransition>
    )
})

export default ShipmentComp