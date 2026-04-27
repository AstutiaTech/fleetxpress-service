"use client"

import { DashboardHeader } from "@/components/dashboard-header"
import { PageTransition } from "@/providers/page-transition"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { FileText, TrendingUp, BarChart3, Calendar } from "lucide-react"
import Link from "next/link"

export function ReportsComp() {
    const reports = [
        {
            title: "Trial Balance",
            description: "View all account balances and verify debits equal credits",
            icon: FileText,
            href: "/financials/reports/trial-balance",
        },
        {
            title: "Balance Sheet",
            description: "View assets, liabilities, and equity as of a specific date",
            icon: BarChart3,
            href: "/financials/reports/balance-sheet",
        },
        {
            title: "Profit & Loss",
            description: "View revenue and expenses for a date range",
            icon: TrendingUp,
            href: "/financials/reports/profit-loss",
        },
        {
            title: "Receivable Aging",
            description: "View outstanding receivables grouped by age",
            icon: Calendar,
            href: "/financials/reports/receivable-aging",
        },
        {
            title: "Payable Aging",
            description: "View outstanding payables grouped by age",
            icon: Calendar,
            href: "/financials/reports/payable-aging",
        },
    ]

    return (
        <PageTransition>
            <div className="flex flex-1 flex-col gap-4 w-full max-w-full min-h-screen">
                <DashboardHeader title="Financial Reports" />
                <section className="w-full max-w-full">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {reports.map((report) => {
                            const Icon = report.icon
                            return (
                                <Card key={report.href} className="cursor-pointer hover:shadow-lg transition-shadow">
                                    <Link href={report.href}>
                                        <CardHeader>
                                            <div className="flex items-center gap-2">
                                                <Icon className="h-5 w-5" />
                                                <CardTitle>{report.title}</CardTitle>
                                            </div>
                                            <CardDescription>{report.description}</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <Button variant="outline" className="w-full">
                                                Generate Report
                                            </Button>
                                        </CardContent>
                                    </Link>
                                </Card>
                            )
                        })}
                    </div>
                </section>
            </div>
        </PageTransition>
    )
}

