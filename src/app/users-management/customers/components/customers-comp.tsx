"use client"

import { CustomTable, CustomTableColumn } from "@/components/customTable"
import { useEffect, useState } from "react"

import { Button } from "@/components/ui/button"
import { Country } from "@/types/geoTypes"
import { CustomerModal } from "./customer-modal"
import { CustomerUser } from "@/types/auth"
import { DashboardHeader } from "@/components/dashboard-header"
import { PageTransition } from "@/providers/page-transition"
import { PlusIcon } from "lucide-react"
import { motion } from "framer-motion"
import { observer } from "mobx-react-lite"
import { useStore } from "@/providers/store.provider"

export const CustomersComp = observer(() => {
    const { userStore, shipmentStore } = useStore()
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [page, setPage] = useState(1)
    const [rowsPerPage, setRowsPerPage] = useState(10)
    const [countries, setCountries] = useState<Country[]>([])
    const [countriesLoading, setCountriesLoading] = useState(false)
    const [totalRows, setTotalRows] = useState(0)

    useEffect(() => {
        const loadCustomers = async () => {
            try {
                const response = await userStore.fetchCustomers({ page, limit: rowsPerPage })
                setTotalRows(response.meta?.total || 0)
            } catch (error) {
                console.error("Failed to fetch customers:", error)
            }
        }
        loadCustomers()
    }, [userStore, page, rowsPerPage])

    useEffect(() => {
        const loadCountries = async () => {
            setCountriesLoading(true)
            try {
                const response = await shipmentStore.fetchCountries({ limit: 200 })
                setCountries(response || [])
            } catch (error) {
                console.error("Failed to load countries:", error)
            } finally {
                setCountriesLoading(false)
            }
        }
        loadCountries()
    }, [shipmentStore])

    const handleCustomerCreated = () => {
        setIsModalOpen(false)
        // Refresh the customers list
        userStore.fetchCustomers({ page, limit: rowsPerPage }).then(response => {
            setTotalRows(response.meta?.total || 0)
        })
    }

    const handleRefresh = () => {
        userStore.fetchCustomers({ page, limit: rowsPerPage }).then(response => {
            setTotalRows(response.meta?.total || 0)
        })
    }

    const columns: CustomTableColumn<CustomerUser>[] = [
        {
            header: "Name",
            cell: (row) => `${row.profile?.firstName || ""} ${row.profile?.lastName || ""}`.trim() || "N/A",
        },
        {
            header: "Email",
            cell: (row) => row.email || "N/A",
        },
        {
            header: "Phone",
            cell: (row) => row.profile?.phone || "N/A",
        },
        {
            header: "Address",
            cell: (row) => row.profile?.address || "N/A",
        },
        {
            header: "City",
            cell: (row) => row.profile?.city || "N/A",
        },
        {
            header: "State",
            cell: (row) => row.profile?.state || "N/A",
        },
        {
            header: "Country",
            cell: (row) => row.profile?.country || "N/A",
        },
    ]

    return (
        <PageTransition>
            <div className="flex flex-1 flex-col gap-4 w-full max-w-full min-h-screen">
                <DashboardHeader 
                    title="Customers" 
                    rightWidgets={[
                        <Button 
                            key="add-customer" 
                            variant="default" 
                            className="cursor-pointer"
                            onClick={() => setIsModalOpen(true)}
                        >
                            <PlusIcon className="w-4 h-4" /> Add Customer
                        </Button>
                    ]} 
                />
                <section className="w-full max-w-full">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="w-full"
                    >
                        <div className="w-full flex">
                            <CustomTable
                                columns={columns}
                                data={userStore.customers}
                                usePagination={true}
                                page={page}
                                onPageChange={setPage}
                                rowsPerPage={rowsPerPage}
                                onRowsPerPageChange={setRowsPerPage}
                                totalRows={totalRows}
                                emptyContent={
                                    <div className="text-center py-8 text-muted-foreground">
                                        No customers found
                                    </div>
                                }
                            />
                        </div>
                    </motion.div>
                </section>
                
                <CustomerModal
                    open={isModalOpen}
                    onOpenChange={setIsModalOpen}
                    onCustomerCreated={handleCustomerCreated}
                    userStore={userStore}
                    shipmentStore={shipmentStore}
                    onRefresh={handleRefresh}
                    countries={countries}
                    countriesLoading={countriesLoading}
                />
            </div>
        </PageTransition>
    )
})

export default CustomersComp

