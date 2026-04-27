"use client"

import { Badge, Download } from "lucide-react"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"

import { AccountsOverview } from "@/components/app/accounts-overview"
import { Button } from "@/components/ui/button"
import { DatePickerWithRange } from "@/components/date-range-picker"
import { OverviewCards } from "./overview-cards"
import { PaymentTooltipChart } from "./PaymentTooltipChart"
import { PieOfShipmentByLocation } from "./PieOfShipmentByLocation"
import { RecentTransactions } from "@/components/app/recent-transactions"
import { RevenueAreaChart } from "./revenue-chart"
import { ShipmentBarChart } from "./ShipmentBarChart"
import { ShipmentsTable } from "@/app/shipment-management/components/shipments-table"
import { motion } from "framer-motion"
import { observer } from "mobx-react-lite"
import { useAuth } from "@/hooks/use-auth"
import { useStore } from "@/providers/store.provider"

export default observer(function DashboardComp() {
    const { appStore, authStore } = useStore()
    const { hasRole } = useAuth()
    
    // Role-based visibility checks
    const isSuperadmin = hasRole("superadmin")
    const isAdmin = hasRole("admin")
    const isManager = hasRole("manager")
    const isAgent = hasRole("agent")
    const isCustomer = hasRole("customer")
    
    // Show all components for superadmin and admin
    const showAll = isSuperadmin || isAdmin
    
    // Manager sees: welcome box with all contents, Revenue & Expenses, Shipment Table
    const showManagerComponents = isManager
    
    // Agent and Customers see: welcome box but without the chart cards, Shipments table
    const showAgentCustomerComponents = isAgent || isCustomer
    
    // Determine what to show
    const showChartCards = showAll || showManagerComponents
    const showRevenueExpenses = showAll || showManagerComponents
    const showThreeCharts = showAll
    const showShipmentsTable = showAll || showManagerComponents || showAgentCustomerComponents
    const showAccountsOverview = showAll
    const showTransactions = showAll

    return (
        <div className="flex flex-1 flex-col gap-4 w-full max-w-full overflow-x-hidden pb-10">
            {/* Welcome Section */}
            {!showAgentCustomerComponents && (
                <div className="flex items-center space-x-2">
                    <DatePickerWithRange />
                    <Button onClick={() => { }} className="flex items-center gap-2">
                        <Download className="h-4 w-4" />
                        Export Data
                    </Button>
                </div>
            )}
            <section className="w-full max-w-full overflow-x-hidden">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="overflow-hidden rounded-3xl bg-linear-to-r from-primary via-primary to-blue-600 p-8 text-white w-full max-w-full"
                >
                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between w-full max-w-full">
                        <div className="space-y-4 w-full max-w-full overflow-x-hidden">
                            <Badge className="bg-white/20 text-white hover:bg-white/30 rounded-xl">Analytics</Badge>
                            <h2 className="text-3xl font-bold">Welcome back, {authStore.profile?.firstName} {authStore.profile?.lastName}!</h2>
                            <p className="max-w-[600px] text-white/80">
                                Here&apos;s what&apos;s happening with {appStore.appFullName} today.
                            </p>
                            {showChartCards && (
                                <div className="w-full max-w-full">
                                    <ScrollArea className="w-4xl rounded-md">
                                        <div className="flex space-x-4 py-4">
                                            <OverviewCards />
                                        </div>
                                        <ScrollBar orientation="horizontal" />
                                    </ScrollArea>
                                    <p className="text-white/80 text-xs">Swipe to see more</p>
                                </div>
                            )}
                        </div>
                        <div className="hidden lg:block">
                            <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ duration: 50, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                                className="relative h-40 w-40"
                            >
                                <div className="absolute inset-0 rounded-full bg-white/10 backdrop-blur-md" />
                                <div className="absolute inset-4 rounded-full bg-white/20" />
                                <div className="absolute inset-8 rounded-full bg-white/30" />
                                <div className="absolute inset-12 rounded-full bg-white/40" />
                                <div className="absolute inset-16 rounded-full bg-white/50" />
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </section>
            {showRevenueExpenses && (
                <section className="w-full max-w-full overflow-x-hidden mt-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="overflow-hidden w-full max-w-full"
                    >
                        <RevenueAreaChart />
                    </motion.div>
                </section>
            )}
            {showThreeCharts && (
                <section className="w-full max-w-full overflow-x-hidden mt-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="overflow-hidden w-full max-w-full"
                    >
                        <div className="grid grid-cols-3 gap-4">
                            <div className="col-span-1">
                                <ShipmentBarChart />
                            </div>
                            <div className="col-span-1">
                                <PaymentTooltipChart />
                            </div>
                            <div className="col-span-1">
                                <PieOfShipmentByLocation />
                            </div>
                        </div>
                    </motion.div>
                </section>
            )}
            {showShipmentsTable && (
                <section className="w-full max-w-full overflow-x-hidden mt-8">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                        className="overflow-hidden w-full max-w-full"
                    >
                        <div className={`grid grid-cols-12 gap-4`}>
                            <div className={showAccountsOverview || showTransactions ? "col-span-12 h-full" : "col-span-12"}>
                                <ShipmentsTable />
                            </div>
                            {/* {(showAccountsOverview || showTransactions) && (
                                <div className="col-span-4 flex flex-col gap-4">
                                    {showAccountsOverview && <AccountsOverview />}
                                    {showTransactions && <RecentTransactions />}
                                </div>
                            )} */}
                        </div>
                    </motion.div>
                </section>
            )}
        </div>
    )
})
