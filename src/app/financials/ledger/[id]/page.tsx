"use client"

import { ArrowLeft, RotateCcw } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"

import { ApiService } from "@/lib/api"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DashboardHeader } from "@/components/dashboard-header"
import { LedgerEntry } from "@/types/financialsTypes"
import { PageTransition } from "@/providers/page-transition"
import { format } from "date-fns"
import { formatPrice } from "@/handlers/formatters"
import { observer } from "mobx-react-lite"
import { toastUtils } from "@/utils/toast-utils"

export default observer(function LedgerEntryDetailPage() {
    const params = useParams()
    const router = useRouter()
    const [entry, setEntry] = useState<LedgerEntry | null>(null)
    const [loading, setLoading] = useState(true)
    const [reversing, setReversing] = useState(false)

    const entryId = params.id as string

    useEffect(() => {
        if (entryId) {
            loadEntry()
        }
    }, [entryId])

    const loadEntry = async () => {
        setLoading(true)
        try {
            const response = await ApiService.getLedgerEntryById(entryId)
            if (response.status && response.data) {
                setEntry(response.data)
            } else {
                toastUtils.error("Error", response.message || "Failed to load ledger entry")
            }
        } catch (error) {
            console.error("Failed to load ledger entry:", error)
            toastUtils.error("Error", "Failed to load ledger entry")
        } finally {
            setLoading(false)
        }
    }

    const handleReverse = async () => {
        if (!entry) return
        if (confirm(`Are you sure you want to reverse ledger entry ${entry.entryNumber}? This action cannot be undone.`)) {
            setReversing(true)
            try {
                const response = await ApiService.reverseLedgerEntry(entry.id)
                if (response.status && response.data) {
                    toastUtils.success("Reversed", "Ledger entry has been reversed successfully.")
                    loadEntry()
                } else {
                    toastUtils.error("Error", response.message || "Failed to reverse ledger entry")
                }
            } catch (error) {
                console.error("Failed to reverse ledger entry:", error)
                toastUtils.error("Error", "Failed to reverse ledger entry")
            } finally {
                setReversing(false)
            }
        }
    }

    if (loading) {
        return (
            <PageTransition>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <p className="mt-4 text-muted-foreground">Loading ledger entry details...</p>
                    </div>
                </div>
            </PageTransition>
        )
    }

    if (!entry) {
        return (
            <PageTransition>
                <div className="flex flex-col gap-4 w-full max-w-full min-h-screen">
                    <DashboardHeader title="Ledger Entry Not Found" />
                    <Card>
                        <CardContent className="pt-6">
                            <p className="text-muted-foreground">The ledger entry you're looking for doesn't exist.</p>
                            <Button onClick={() => router.push("/financials/ledger")} className="mt-4">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Ledger
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </PageTransition>
        )
    }

    const totalDebits = entry.transactions
        .filter(t => t.transactionType === "DEBIT")
        .reduce((sum, t) => sum + t.amount, 0)
    
    const totalCredits = entry.transactions
        .filter(t => t.transactionType === "CREDIT")
        .reduce((sum, t) => sum + t.amount, 0)

    return (
        <PageTransition>
            <div className="flex flex-1 flex-col gap-4 w-full max-w-full min-h-screen">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" onClick={() => router.push("/financials/ledger")}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                        <DashboardHeader title={`Ledger Entry ${entry.entryNumber}`} />
                    </div>
                    {!entry.isReversed && (
                        <Button variant="outline" onClick={handleReverse} disabled={reversing}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            {reversing ? "Reversing..." : "Reverse Entry"}
                        </Button>
                    )}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    {/* Entry Information */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Entry Information</CardTitle>
                            <CardDescription>Ledger entry details</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Entry Number:</span>
                                <span className="font-medium">{entry.entryNumber}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Transaction Date:</span>
                                <span>
                                    {entry.transactionDate ? (() => {
                                        const date = new Date(entry.transactionDate)
                                        return isNaN(date.getTime()) ? "-" : format(date, "MMM dd, yyyy")
                                    })() : "-"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Description:</span>
                                <span>{entry.description}</span>
                            </div>
                            {entry.referenceNumber && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Reference:</span>
                                    <span className="font-mono text-sm">{entry.referenceNumber}</span>
                                </div>
                            )}
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Source:</span>
                                <Badge variant="outline">{entry.source}</Badge>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Total Amount:</span>
                                <span className="font-medium">{formatPrice(entry.totalAmount)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Reversed:</span>
                                <Badge variant={entry.isReversed ? "destructive" : "default"}>
                                    {entry.isReversed ? "Yes" : "No"}
                                </Badge>
                            </div>
                            {entry.isReversed && entry.reversedAt && (
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Reversed At:</span>
                                    <span className="text-sm text-muted-foreground">
                                        {format(new Date(entry.reversedAt), "MMM dd, yyyy 'at' hh:mm a")}
                                    </span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Summary</CardTitle>
                            <CardDescription>Transaction totals</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Total Debits:</span>
                                <span className="font-medium text-green-600">{formatPrice(totalDebits)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Total Credits:</span>
                                <span className="font-medium text-red-600">{formatPrice(totalCredits)}</span>
                            </div>
                            <div className="pt-2 border-t">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium">Difference:</span>
                                    <span className={`font-bold ${Math.abs(totalDebits - totalCredits) < 0.01 ? "text-green-600" : "text-red-600"}`}>
                                        {formatPrice(Math.abs(totalDebits - totalCredits))}
                                    </span>
                                </div>
                                {Math.abs(totalDebits - totalCredits) < 0.01 && (
                                    <p className="text-xs text-muted-foreground mt-1">✓ Balanced</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Transactions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Transactions</CardTitle>
                        <CardDescription>All debit and credit transactions for this entry</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Account Code</TableHead>
                                    <TableHead>Account Name</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {entry.transactions.map((transaction) => (
                                    <TableRow key={transaction.id}>
                                        <TableCell className="font-mono">{transaction.account.code}</TableCell>
                                        <TableCell>{transaction.account.name}</TableCell>
                                        <TableCell>
                                            <Badge variant={transaction.transactionType === "DEBIT" ? "default" : "secondary"}>
                                                {transaction.transactionType}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className={transaction.transactionType === "DEBIT" ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                                            {transaction.transactionType === "DEBIT" ? "+" : "-"}{formatPrice(transaction.amount)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Timestamps */}
                <Card>
                    <CardHeader>
                        <CardTitle>Timestamps</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Created At:</span>
                            <span className="text-sm text-muted-foreground">
                                {entry.createdAt ? (() => {
                                    const date = new Date(entry.createdAt)
                                    return isNaN(date.getTime()) ? "-" : format(date, "MMM dd, yyyy 'at' hh:mm a")
                                })() : "-"}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">Updated At:</span>
                            <span className="text-sm text-muted-foreground">
                                {entry.updatedAt ? (() => {
                                    const date = new Date(entry.updatedAt)
                                    return isNaN(date.getTime()) ? "-" : format(date, "MMM dd, yyyy 'at' hh:mm a")
                                })() : "-"}
                            </span>
                        </div>
                        {entry.createdBy && (
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Created By:</span>
                                <span className="text-sm text-muted-foreground">{entry.createdBy.name}</span>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </PageTransition>
    )
})

