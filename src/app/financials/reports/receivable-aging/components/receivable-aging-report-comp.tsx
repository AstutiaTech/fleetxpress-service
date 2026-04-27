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
import { ReceivableAgingItem } from "@/types/financialsTypes"
import { formatPrice } from "@/handlers/formatters"
import { format } from "date-fns"
import { toastUtils } from "@/utils/toast-utils"

export function ReceivableAgingReportComp() {
    const [loading, setLoading] = useState(false)
    const [report, setReport] = useState<any>(null)
    const [asOfDate, setAsOfDate] = useState(format(new Date(), "yyyy-MM-dd"))
    const [customerId, setCustomerId] = useState("")

    const generateReport = async () => {
        setLoading(true)
        try {
            const response = await ApiService.getReceivableAging(customerId || undefined, asOfDate)
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

    const columns: CustomTableColumn<ReceivableAgingItem>[] = [
        {
            header: "Customer",
            accessor: "customerName" as keyof ReceivableAgingItem,
        },
        {
            header: "Invoice Number",
            accessor: "invoiceNumber" as keyof ReceivableAgingItem,
        },
        {
            header: "Invoice Date",
            cell: (row: ReceivableAgingItem) => {
                if (!row.invoiceDate) return "-"
                const date = new Date(row.invoiceDate)
                return isNaN(date.getTime()) ? "-" : format(date, "MMM dd, yyyy")
            },
        },
        {
            header: "Due Date",
            cell: (row: ReceivableAgingItem) => {
                if (!row.dueDate) return "-"
                const date = new Date(row.dueDate)
                return isNaN(date.getTime()) ? "-" : format(date, "MMM dd, yyyy")
            },
        },
        {
            header: "Total Amount",
            cell: (row: ReceivableAgingItem) => formatPrice(row.totalAmount),
        },
        {
            header: "Paid Amount",
            cell: (row: ReceivableAgingItem) => formatPrice(row.paidAmount),
        },
        {
            header: "Balance",
            cell: (row: ReceivableAgingItem) => formatPrice(row.balance),
        },
        {
            header: "0-30 Days",
            cell: (row: ReceivableAgingItem) => formatPrice(row.aging?.["0-30"] ?? 0),
        },
        {
            header: "31-60 Days",
            cell: (row: ReceivableAgingItem) => formatPrice(row.aging?.["31-60"] ?? 0),
        },
        {
            header: "61-90 Days",
            cell: (row: ReceivableAgingItem) => formatPrice(row.aging?.["61-90"] ?? 0),
        },
        {
            header: "90+ Days",
            cell: (row: ReceivableAgingItem) => formatPrice(row.aging?.["90+"] ?? 0),
        },
    ]

    return (
        <PageTransition>
            <div className="flex flex-1 flex-col gap-4 w-full max-w-full min-h-screen">
                <DashboardHeader title="Receivable Aging Report" />
                <section className="w-full max-w-full">
                    <Card>
                        <CardHeader>
                            <CardTitle>Generate Receivable Aging</CardTitle>
                            <CardDescription>
                                View outstanding receivables grouped by age
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex gap-4 items-end">
                                <div className="space-y-2 flex-1">
                                    <Label>As Of Date</Label>
                                    <Input
                                        type="date"
                                        value={asOfDate}
                                        onChange={(e) => setAsOfDate(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2 flex-1">
                                    <Label>Customer ID (Optional)</Label>
                                    <Input
                                        value={customerId}
                                        onChange={(e) => setCustomerId(e.target.value)}
                                        placeholder="Filter by customer"
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
                                            title: "Receivable Aging",
                                            file_name: `receivable-aging-${asOfDate}`,
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

