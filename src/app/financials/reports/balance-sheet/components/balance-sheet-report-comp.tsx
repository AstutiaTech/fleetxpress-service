"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CustomTable, CustomTableColumn } from "@/components/customTable"

import { ApiService } from "@/lib/api"
import { BalanceSheetItem } from "@/types/financialsTypes"
import { Button } from "@/components/ui/button"
import { DashboardHeader } from "@/components/dashboard-header"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { PageTransition } from "@/providers/page-transition"
import { format } from "date-fns"
import { formatPrice } from "@/handlers/formatters"
import { toastUtils } from "@/utils/toast-utils"
import { useState } from "react"

export function BalanceSheetReportComp() {
    const [loading, setLoading] = useState(false)
    const [report, setReport] = useState<any>(null)
    const [asOfDate, setAsOfDate] = useState(format(new Date(), "yyyy-MM-dd"))

    const generateReport = async () => {
        setLoading(true)
        try {
            const response = await ApiService.getBalanceSheet(asOfDate)
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

    const assetColumns: CustomTableColumn<BalanceSheetItem>[] = [
        {
            header: "Account Code",
            accessor: "accountCode" as keyof BalanceSheetItem,
        },
        {
            header: "Account Name",
            accessor: "accountName" as keyof BalanceSheetItem,
        },
        {
            header: "Balance",
            cell: (row: BalanceSheetItem) => formatPrice(row.balance),
        },
    ]

    return (
        <PageTransition>
            <div className="flex flex-1 flex-col gap-4 w-full max-w-full min-h-screen pb-14">
                <DashboardHeader title="Balance Sheet Report" />
                <section className="w-full max-w-full">
                    <Card>
                        <CardHeader>
                            <CardTitle>Generate Balance Sheet</CardTitle>
                            <CardDescription>
                                View assets, liabilities, and equity as of a specific date
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
                                            <span className="font-medium">Total Assets:</span> {formatPrice(report.totalAssets)}
                                        </p>
                                        <p className="text-sm">
                                            <span className="font-medium">Total Liabilities:</span> {formatPrice(report.totalLiabilities)}
                                        </p>
                                        <p className="text-sm">
                                            <span className="font-medium">Total Equity:</span> {formatPrice(report.totalEquity)}
                                        </p>
                                        <p className={`text-sm font-bold ${Math.abs(report.totalAssets - (report.totalLiabilities + report.totalEquity)) < 0.01 ? "text-green-600" : "text-red-600"}`}>
                                            Balance: {formatPrice(Math.abs(report.totalAssets - (report.totalLiabilities + report.totalEquity)))}
                                        </p>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">Assets</h3>
                                        <CustomTable
                                            columns={assetColumns}
                                            data={report.assets || []}
                                        />
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">Liabilities</h3>
                                        <CustomTable
                                            columns={assetColumns}
                                            data={report.liabilities || []}
                                        />
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">Equity</h3>
                                        <CustomTable
                                            columns={assetColumns}
                                            data={report.equity || []}
                                        />
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </section>
            </div>
        </PageTransition>
    )
}

