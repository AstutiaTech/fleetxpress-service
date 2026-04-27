"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CustomTable, CustomTableColumn } from "@/components/customTable"
import { ProfitLossItem, ProfitLossReport, ProfitLossReportType } from "@/types/financialsTypes"
import { format, subDays } from "date-fns"

import { ApiService } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { DashboardHeader } from "@/components/dashboard-header"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { PageTransition } from "@/providers/page-transition"
import { formatPrice } from "@/handlers/formatters"
import { toastUtils } from "@/utils/toast-utils"
import { useState } from "react"

export function ProfitLossReportComp() {
    const [loading, setLoading] = useState(false)
    const [report, setReport] = useState<ProfitLossReportType | null>(null)
    const [startDate, setStartDate] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"))
    const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"))

    const generateReport = async () => {
        setLoading(true)
        try {
            const response = await ApiService.getProfitLoss(startDate, endDate)
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

    const columns: CustomTableColumn<ProfitLossItem>[] = [
        {
            header: "Account Code",
            accessor: "accountCode" as keyof ProfitLossItem,
        },
        {
            header: "Account Name",
            accessor: "accountName" as keyof ProfitLossItem,
        },
        {
            header: "Amount",
            cell: (row: ProfitLossItem) => formatPrice(row.amount),
        },
    ]

    return (
        <PageTransition>
            <div className="flex flex-1 flex-col gap-4 w-full max-w-full min-h-screen">
                <DashboardHeader title="Profit & Loss Statement" />
                <section className="w-full max-w-full">
                    <Card>
                        <CardHeader>
                            <CardTitle>Generate Profit & Loss</CardTitle>
                            <CardDescription>
                                View revenue and expenses for a date range
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-3 items-end">
                                <div className="space-y-2">
                                    <Label>Start Date</Label>
                                    <Input
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>End Date</Label>
                                    <Input
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
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
                                <div className="space-y-6">
                                    <div className="text-right space-y-1">
                                        <p className="text-sm">
                                            <span className="font-medium">Total Revenue:</span> {formatPrice(report.revenue.totalRevenue)}
                                        </p>
                                        <p className="text-sm">
                                            <span className="font-medium">Total Expenses:</span> {formatPrice(report.expenses.totalExpenses)}
                                        </p>
                                        <p className={`text-lg font-bold ${report.netIncome >= 0 ? "text-green-600" : "text-red-600"}`}>
                                            Net Income: {formatPrice(report.netIncome)}
                                        </p>
                                    </div>

                                    {/* <div>
                                        <h3 className="text-lg font-semibold mb-2">Revenue</h3>
                                        <CustomTable
                                            columns={columns}
                                            data={report.revenue.operatingRevenue || []}
                                        />
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">Expenses</h3>
                                        <CustomTable
                                            columns={columns}
                                            data={report.expenses.cogs || []}
                                        />
                                    </div> */}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </section>
            </div>
        </PageTransition>
    )
}

