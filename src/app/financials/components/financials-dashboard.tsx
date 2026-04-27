"use client"

import { useEffect, useState } from "react"
import { observer } from "mobx-react-lite"
import { useStore } from "@/providers/store.provider"
import { DashboardHeader } from "@/components/dashboard-header"
import { PageTransition } from "@/providers/page-transition"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { formatPrice } from "@/handlers/formatters"
import { Loader2 } from "lucide-react"
import { ApiService } from "@/lib/api"
import { ReceivableStatus, PaymentStatus } from "@/types/financialsTypes"

export const FinancialsDashboard = observer(() => {
    const { receivablesStore, payablesStore, paymentsStore } = useStore()
    const [summary, setSummary] = useState({
        totalRevenue: 0,
        outstandingReceivables: 0,
        outstandingPayables: 0,
        cashBalance: 0,
        netIncome: 0,
        loading: true,
    })

    useEffect(() => {
        loadDashboardData()
    }, [])

    const loadDashboardData = async () => {
        setSummary(prev => ({ ...prev, loading: true }))
        try {
            // Fetch receivables and calculate outstanding
            const receivablesRes = await ApiService.getAllReceivables({ limit: 1000 })
            const receivables = (receivablesRes.status && receivablesRes.data) ? receivablesRes.data : []
            const outstandingReceivables = receivables
                .filter(r => r.status === "PENDING" || r.status === "PARTIAL")
                .reduce((sum, r) => sum + r.balance, 0)

            // Fetch payables and calculate outstanding
            const payablesRes = await ApiService.getAllPayables({ limit: 1000 })
            const payables = (payablesRes.status && payablesRes.data) ? payablesRes.data : []
            const outstandingPayables = payables
                .filter(p => p.status === "PENDING" || p.status === "PARTIAL")
                .reduce((sum, p) => sum + p.balance, 0)

            // Fetch recent payments to calculate revenue
            const paymentsRes = await ApiService.getAllPayments({ 
                paymentType: "RECEIVABLE",
                status: "COMPLETED",
                limit: 1000 
            })
            const payments = (paymentsRes.status && paymentsRes.data) ? paymentsRes.data : []
            const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0)

            // TODO: Fetch cash balance from ledger accounts
            const cashBalance = 0

            // Calculate net income (simplified - revenue minus expenses)
            const expensePaymentsRes = await ApiService.getAllPayments({ 
                paymentType: "PAYABLE",
                status: "COMPLETED",
                limit: 1000 
            })
            const expensePayments = (expensePaymentsRes.status && expensePaymentsRes.data) ? expensePaymentsRes.data : []
            const totalExpenses = expensePayments.reduce((sum, p) => sum + p.amount, 0)
            const netIncome = totalRevenue - totalExpenses

            setSummary({
                totalRevenue,
                outstandingReceivables,
                outstandingPayables,
                cashBalance,
                netIncome,
                loading: false,
            })
        } catch (error) {
            console.error("Failed to load dashboard data:", error)
            setSummary(prev => ({ ...prev, loading: false }))
        }
    }

    return (
        <PageTransition>
            <div className="flex flex-1 flex-col gap-4 w-full max-w-full min-h-screen">
                <DashboardHeader title="Financials Dashboard" />
                <section className="w-full max-w-full">
                    {summary.loading ? (
                        <div className="flex items-center justify-center h-64">
                            <Loader2 className="h-8 w-8 animate-spin" />
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-green-600">
                                        {formatPrice(summary.totalRevenue)}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Outstanding Receivables</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-orange-600">
                                        {formatPrice(summary.outstandingReceivables)}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Outstanding Payables</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-red-600">
                                        {formatPrice(summary.outstandingPayables)}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Cash Balance</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {formatPrice(summary.cashBalance)}
                                    </div>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Net Income</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className={`text-2xl font-bold ${summary.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {formatPrice(summary.netIncome)}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}
                </section>
            </div>
        </PageTransition>
    )
})

