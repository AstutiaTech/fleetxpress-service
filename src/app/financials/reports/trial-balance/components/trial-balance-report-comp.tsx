"use client"

import { useState, useEffect } from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { PageTransition } from "@/providers/page-transition"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { CustomTable, CustomTableColumn } from "@/components/customTable"
import { Loader2, Download } from "lucide-react"
import { ApiService } from "@/lib/api"
import { TrialBalanceItem } from "@/types/financialsTypes"
import { formatPrice } from "@/handlers/formatters"
import { format } from "date-fns"
import { toastUtils } from "@/utils/toast-utils"

export function TrialBalanceReportComp() {
    const [loading, setLoading] = useState(false)
    const [report, setReport] = useState<any>(null)
    const [asOfDate, setAsOfDate] = useState(format(new Date(), "yyyy-MM-dd"))

    const generateReport = async () => {
        setLoading(true)
        try {
            const response = await ApiService.getTrialBalance(asOfDate)
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

    const columns: CustomTableColumn<TrialBalanceItem>[] = [
        {
            header: "Account Code",
            accessor: "accountCode" as keyof TrialBalanceItem,
        },
        {
            header: "Account Name",
            accessor: "accountName" as keyof TrialBalanceItem,
        },
        {
            header: "Debit Balance",
            cell: (row: TrialBalanceItem) => formatPrice(row.debitBalance),
        },
        {
            header: "Credit Balance",
            cell: (row: TrialBalanceItem) => formatPrice(row.creditBalance),
        },
    ]

    return (
        <PageTransition>
            <div className="flex flex-1 flex-col gap-4 w-full max-w-full min-h-screen">
                <DashboardHeader title="Trial Balance Report" />
                <section className="w-full max-w-full">
                    <Card>
                        <CardHeader>
                            <CardTitle>Generate Trial Balance</CardTitle>
                            <CardDescription>
                                View all account balances and verify debits equal credits
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
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="text-sm text-muted-foreground">
                                                As of: {(() => {
                                                    if (report.asOfDate) {
                                                        const date = new Date(report.asOfDate)
                                                        if (!isNaN(date.getTime())) {
                                                            return format(date, "MMM dd, yyyy")
                                                        }
                                                    }
                                                    return format(new Date(asOfDate), "MMM dd, yyyy")
                                                })()}
                                            </p>
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <p className="text-sm">
                                                <span className="font-medium">Total Debits:</span> {formatPrice(report.totalDebits)}
                                            </p>
                                            <p className="text-sm">
                                                <span className="font-medium">Total Credits:</span> {formatPrice(report.totalCredits)}
                                            </p>
                                            <p className={`text-sm font-bold ${Math.abs(report.totalDebits - report.totalCredits) < 0.01 ? "text-green-600" : "text-red-600"}`}>
                                                Difference: {formatPrice(Math.abs(report.totalDebits - report.totalCredits))}
                                            </p>
                                        </div>
                                    </div>
                                    <CustomTable
                                        columns={columns}
                                        data={report.items || []}
                                        exportOptions={{
                                            title: "Trial Balance",
                                            file_name: `trial-balance-${asOfDate}`,
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

