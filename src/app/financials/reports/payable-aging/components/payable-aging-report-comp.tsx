"use client"

import { useState } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { PageTransition } from "@/providers/page-transition"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CustomTable, CustomTableColumn } from "@/components/customTable"
import { Loader2 } from "lucide-react"
import { ApiService } from "@/lib/api"
import { PayableAgingItem } from "@/types/financialsTypes"
import { formatPrice } from "@/handlers/formatters"
import { format } from "date-fns"
import { toastUtils } from "@/utils/toast-utils"

export function PayableAgingReportComp() {
    const [loading, setLoading] = useState(false)
    const [report, setReport] = useState<any>(null)
    const [asOfDate, setAsOfDate] = useState(format(new Date(), "yyyy-MM-dd"))
    const [driverId, setDriverId] = useState("")
    const [vendorId, setVendorId] = useState("")

    const generateReport = async () => {
        setLoading(true)
        try {
            const response = await ApiService.getPayableAging(driverId || undefined, vendorId || undefined, asOfDate)
            if (response.status && response.data) {
                setReport(response.data)
            } else {
                toastUtils.error("Failed", response.message || "Failed to generate report")
            }
        } catch (error) {
            console.error("Failed to generate report:", error)
            toastUtils.error("Failed", "An error occurred while generating the report")
        } finally {
            setLoading(false)
        }
    }

    const columns: CustomTableColumn<PayableAgingItem>[] = [
        {
            header: "Driver/Vendor",
            cell: (row: PayableAgingItem) => row.driverName || row.vendorName || "N/A",
        },
        {
            header: "Bill Number",
            accessor: "billNumber" as keyof PayableAgingItem,
        },
        {
            header: "Bill Date",
            cell: (row: PayableAgingItem) => {
                if (!row.billDate) return "-"
                const date = new Date(row.billDate)
                return isNaN(date.getTime()) ? "-" : format(date, "MMM dd, yyyy")
            },
        },
        {
            header: "Due Date",
            cell: (row: PayableAgingItem) => {
                if (!row.dueDate) return "-"
                const date = new Date(row.dueDate)
                return isNaN(date.getTime()) ? "-" : format(date, "MMM dd, yyyy")
            },
        },
        {
            header: "Total Amount",
            cell: (row: PayableAgingItem) => formatPrice(row.totalAmount),
        },
        {
            header: "Paid Amount",
            cell: (row: PayableAgingItem) => formatPrice(row.paidAmount),
        },
        {
            header: "Balance",
            cell: (row: PayableAgingItem) => formatPrice(row.balance),
        },
        {
            header: "0-30 Days",
            cell: (row: PayableAgingItem) => formatPrice(row.aging?.["0-30"] ?? 0),
        },
        {
            header: "31-60 Days",
            cell: (row: PayableAgingItem) => formatPrice(row.aging?.["31-60"] ?? 0),
        },
        {
            header: "61-90 Days",
            cell: (row: PayableAgingItem) => formatPrice(row.aging?.["61-90"] ?? 0),
        },
        {
            header: "90+ Days",
            cell: (row: PayableAgingItem) => formatPrice(row.aging?.["90+"] ?? 0),
        },
    ]

    return (
        <PageTransition>
            <div className="flex flex-1 flex-col gap-4 w-full max-w-full min-h-screen">
                <DashboardHeader title="Payable Aging Report" />
                <section className="w-full max-w-full">
                    <Card>
                        <CardHeader>
                            <CardTitle>Generate Payable Aging</CardTitle>
                            <CardDescription>
                                View outstanding payables grouped by age
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-4 items-end">
                                <div className="space-y-2">
                                    <Label>As Of Date</Label>
                                    <Input
                                        type="date"
                                        value={asOfDate}
                                        onChange={(e) => setAsOfDate(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Driver ID (Optional)</Label>
                                    <Input
                                        value={driverId}
                                        onChange={(e) => setDriverId(e.target.value)}
                                        placeholder="Filter by driver"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Vendor ID (Optional)</Label>
                                    <Input
                                        value={vendorId}
                                        onChange={(e) => setVendorId(e.target.value)}
                                        placeholder="Filter by vendor"
                                    />
                                </div>
                                <Button onClick={generateReport} disabled={loading}>
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Generating...
                                        </>
                                    ) : (
                                        "Generate Report"
                                    )}
                                </Button>
                            </div>

                            {report && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-5 gap-4">
                                        <div className="text-center p-2 bg-muted rounded">
                                            <p className="text-sm font-medium">0-30 Days</p>
                                            <p className="text-lg font-bold">{formatPrice(report.summary?.["0-30"] ?? 0)}</p>
                                        </div>
                                        <div className="text-center p-2 bg-muted rounded">
                                            <p className="text-sm font-medium">31-60 Days</p>
                                            <p className="text-lg font-bold">{formatPrice(report.summary?.["31-60"] ?? 0)}</p>
                                        </div>
                                        <div className="text-center p-2 bg-muted rounded">
                                            <p className="text-sm font-medium">61-90 Days</p>
                                            <p className="text-lg font-bold">{formatPrice(report.summary?.["61-90"] ?? 0)}</p>
                                        </div>
                                        <div className="text-center p-2 bg-muted rounded">
                                            <p className="text-sm font-medium">90+ Days</p>
                                            <p className="text-lg font-bold">{formatPrice(report.summary?.["90+"] ?? 0)}</p>
                                        </div>
                                        <div className="text-center p-2 bg-primary text-primary-foreground rounded">
                                            <p className="text-sm font-medium">Total</p>
                                            <p className="text-lg font-bold">{formatPrice(report.summary?.total ?? 0)}</p>
                                        </div>
                                    </div>
                                    <CustomTable
                                        columns={columns}
                                        data={report.items || []}
                                        exportOptions={{
                                            title: "Payable Aging",
                                            file_name: `payable-aging-${asOfDate}`,
                                        }}
                                        hasExport={true}
                                    />
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </section>
            </div>
        </PageTransition>
    )
}

