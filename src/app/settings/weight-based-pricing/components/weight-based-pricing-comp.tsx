"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CityType, WeightBasedPrice } from "@/types/weightBasedPricingTypes"
import { CustomTable, CustomTableColumn } from "@/components/customTable"
import { Download, Edit, Plus, Trash2, Upload, FileUp, FileText } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useEffect, useState } from "react"

import { ApiService } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { DashboardHeader } from "@/components/dashboard-header"
import { Info } from "lucide-react"
import { PageTransition } from "@/providers/page-transition"
import { WeightBasedPricingModal } from "./weight-based-pricing-modal"
import { PricingImportModal } from "./pricing-import-modal"
import { generateCSVTemplate, generateExcelTemplate } from "@/lib/pricing-template"
import { formatPrice } from "@/handlers/formatters"
import { observer } from "mobx-react-lite"
import { toastUtils } from "@/utils/toast-utils"

export const WeightBasedPricingComp = observer(() => {
    const [insideCityPrices, setInsideCityPrices] = useState<WeightBasedPrice[]>([])
    const [outsideCityPrices, setOutsideCityPrices] = useState<WeightBasedPrice[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [isImportModalOpen, setIsImportModalOpen] = useState(false)
    const [selectedItem, setSelectedItem] = useState<WeightBasedPrice | null>(null)
    const [activeTab, setActiveTab] = useState<CityType>("inside_city")
    
    // Pagination state
    const [insideCityPage, setInsideCityPage] = useState(1)
    const [outsideCityPage, setOutsideCityPage] = useState(1)
    const [rowsPerPage, setRowsPerPage] = useState(10)
    const [insideCityTotalRows, setInsideCityTotalRows] = useState(0)
    const [outsideCityTotalRows, setOutsideCityTotalRows] = useState(0)

    useEffect(() => {
        loadPrices()
    }, [insideCityPage, outsideCityPage, rowsPerPage, activeTab])

    const loadPrices = async () => {
        setIsLoading(true)
        try {
            const currentPage = activeTab === "inside_city" ? insideCityPage : outsideCityPage
            
            const response = await ApiService.getWeightBasedPrices({ 
                cityType: activeTab,
                page: currentPage,
                limit: rowsPerPage
            })
            
            if (response.status) {
                let sortedData: WeightBasedPrice[] = []
                let totalRows = 0
                
                // Handle both paginated and non-paginated responses
                if ('meta' in response && response.meta) {
                    // Paginated response
                    sortedData = Array.isArray(response.data) 
                        ? response.data.sort((a, b) => a.weightKg - b.weightKg)
                        : []
                    totalRows = response.meta.total || sortedData.length
                } else if ('data' in response && Array.isArray(response.data)) {
                    // Non-paginated response
                    sortedData = response.data.sort((a, b) => a.weightKg - b.weightKg)
                    totalRows = sortedData.length
                }
                
                if (activeTab === "inside_city") {
                    setInsideCityPrices(sortedData)
                    setInsideCityTotalRows(totalRows)
                } else {
                    setOutsideCityPrices(sortedData)
                    setOutsideCityTotalRows(totalRows)
                }
            }
        } catch (error) {
            toastUtils.error("Failed to Load", "Unable to fetch weight-based prices.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleAdd = () => {
        setSelectedItem(null)
        setIsModalOpen(true)
    }

    const handleEdit = (item: WeightBasedPrice) => {
        setSelectedItem(item)
        setIsModalOpen(true)
    }

    const handleDelete = async (item: WeightBasedPrice) => {
        if (!confirm(`Are you sure you want to delete the price for ${item.weightKg}kg?`)) {
            return
        }

        try {
            const response = await ApiService.deleteWeightBasedPrice(item.id)
            if (response.status) {
                toastUtils.success("Deleted", "Weight-based price deleted successfully.")
                loadPrices()
            } else {
                toastUtils.error("Delete Failed", response.message || "Failed to delete price.")
            }
        } catch (error) {
            toastUtils.error("Delete Failed", "An error occurred while deleting the price.")
        }
    }

    const handleModalClose = () => {
        setIsModalOpen(false)
        setSelectedItem(null)
    }

    const handleSuccess = () => {
        // Reset to first page after successful operation
        if (activeTab === "inside_city") {
            setInsideCityPage(1)
        } else {
            setOutsideCityPage(1)
        }
        loadPrices()
        handleModalClose()
    }

    const handlePageChange = (page: number) => {
        if (activeTab === "inside_city") {
            setInsideCityPage(page)
        } else {
            setOutsideCityPage(page)
        }
    }

    const handleRowsPerPageChange = (rows: number) => {
        setRowsPerPage(rows)
        // Reset to first page when changing rows per page
        setInsideCityPage(1)
        setOutsideCityPage(1)
    }

    const handleBulkImport = () => {
        setIsImportModalOpen(true)
    }

    const handleDownloadTemplate = (format: "csv" | "excel") => {
        try {
            if (format === "csv") {
                generateCSVTemplate()
                toastUtils.success("Template Downloaded", "CSV template downloaded successfully.")
            } else {
                generateExcelTemplate()
                toastUtils.success("Template Downloaded", "Excel template downloaded successfully.")
            }
        } catch (error) {
            toastUtils.error("Download Failed", "Failed to download template.")
        }
    }

    const currentPrices = activeTab === "inside_city" ? insideCityPrices : outsideCityPrices
    const currentPage = activeTab === "inside_city" ? insideCityPage : outsideCityPage
    const currentTotalRows = activeTab === "inside_city" ? insideCityTotalRows : outsideCityTotalRows

    const columns: CustomTableColumn<WeightBasedPrice>[] = [
        {
            header: "Category",
            accessor: "category" as keyof WeightBasedPrice,
            className: "font-medium",
        },
        {
            header: "Weight (kg)",
            accessor: "weightKg" as keyof WeightBasedPrice,
            className: "font-medium",
            cell: (row) => `${row.weightKg} kg`,
        },
        {
            header: "Price (₦)",
            cell: (row) => formatPrice(row.price),
        },
        {
            header: "Actions",
            cell: (row) => (
                <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleEdit(row)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(row)} className="text-destructive">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                    </Button>
                </div>
            ),
        },
    ]

    return (
        <PageTransition>
            <div className="flex flex-1 flex-col gap-4 w-full max-w-full min-h-screen pb-14">
                <DashboardHeader 
                    title="Weight-Based Pricing" 
                    rightWidgets={[
                        <Button 
                            key="template-csv"
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDownloadTemplate("csv")}
                        >
                            <FileText className="h-4 w-4 mr-2" />
                            Download CSV Template
                        </Button>,
                        <Button 
                            key="template-excel"
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDownloadTemplate("excel")}
                        >
                            <FileText className="h-4 w-4 mr-2" />
                            Download Excel Template
                        </Button>,
                        <Button 
                            key="import"
                            variant="outline" 
                            size="sm"
                            onClick={handleBulkImport}
                        >
                            <FileUp className="h-4 w-4 mr-2" />
                            Import Pricing
                        </Button>,
                        <Button 
                            key="add"
                            size="sm"
                            onClick={handleAdd}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Price
                        </Button>
                    ]}
                />

                <Alert className="mb-4">
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                        Configure weight-based pricing by category. Pricing is stored per category and shared across all routes with the same category. 
                        For example, all routes with category "MAINLAND 1" will use the same pricing structure.
                        <br /><br />
                        <strong>Import Note:</strong> When importing files, ALL weight/price combinations for each category are collected and imported, 
                        regardless of which route they appear under in the file. This ensures all routes in a category have access to the full pricing range.
                    </AlertDescription>
                </Alert>

                <Card>
                    <CardHeader>
                        <CardTitle>Pricing Tiers</CardTitle>
                        <CardDescription>
                            Manage weight-based pricing for different city types
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs value={activeTab} onValueChange={(value) => {
                            setActiveTab(value as CityType)
                            // Reset to first page when switching tabs
                            setInsideCityPage(1)
                            setOutsideCityPage(1)
                        }}>
                            <TabsList className="mb-4">
                                <TabsTrigger value="inside_city">Inside City</TabsTrigger>
                                <TabsTrigger value="outside_city">Outside City</TabsTrigger>
                            </TabsList>
                            
                            <TabsContent value="inside_city">
                                <CustomTable
                                    columns={columns}
                                    data={insideCityPrices}
                                    isLoading={isLoading}
                                    emptyMessage="No inside city pricing tiers configured. Click 'Add Price' to create one."
                                    usePagination={true}
                                    page={insideCityPage}
                                    onPageChange={setInsideCityPage}
                                    rowsPerPage={rowsPerPage}
                                    onRowsPerPageChange={handleRowsPerPageChange}
                                    totalRows={insideCityTotalRows}
                                    rowsPerPageOptions={[10, 20, 50, 100]}
                                />
                            </TabsContent>
                            
                            <TabsContent value="outside_city">
                                <CustomTable
                                    columns={columns}
                                    data={outsideCityPrices}
                                    isLoading={isLoading}
                                    emptyMessage="No outside city pricing tiers configured. Click 'Add Price' to create one."
                                    usePagination={true}
                                    page={outsideCityPage}
                                    onPageChange={setOutsideCityPage}
                                    rowsPerPage={rowsPerPage}
                                    onRowsPerPageChange={handleRowsPerPageChange}
                                    totalRows={outsideCityTotalRows}
                                    rowsPerPageOptions={[10, 20, 50, 100]}
                                />
                            </TabsContent>
                        </Tabs>
                    </CardContent>
                </Card>

                <WeightBasedPricingModal
                    open={isModalOpen}
                    onOpenChange={setIsModalOpen}
                    item={selectedItem}
                    cityType={activeTab}
                    onSuccess={handleSuccess}
                />

                <PricingImportModal
                    open={isImportModalOpen}
                    onOpenChange={setIsImportModalOpen}
                    onSuccess={handleSuccess}
                />
            </div>
        </PageTransition>
    )
})

export default WeightBasedPricingComp

