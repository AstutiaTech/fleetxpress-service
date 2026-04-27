"use client"

import { useCallback, useEffect, useState } from "react"

import { Account } from "@/types/financialsTypes"
import { AccountModal } from "./account-modal"
import { AccountsTable } from "./accounts-table"
import { ApiService } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { DashboardHeader } from "@/components/dashboard-header"
import { PageTransition } from "@/providers/page-transition"
import { PlusIcon } from "lucide-react"
import { observer } from "mobx-react-lite"

export const ChartOfAccountsComp = observer(() => {
    const [accounts, setAccounts] = useState<Account[]>([])
    const [loading, setLoading] = useState(false)
    const [modalOpen, setModalOpen] = useState(false)
    const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
    const [page, setPage] = useState(1)
    const [rowsPerPage, setRowsPerPage] = useState(10)
    const [totalRows, setTotalRows] = useState(0)

    const loadAccounts = useCallback(async () => {
        setLoading(true)
        try {
            const response = await ApiService.getAllAccounts({ page, limit: rowsPerPage })
            if (response.status && response.data) {
                // Handle both paginated and non-paginated responses
                const accountsData = Array.isArray(response.data) ? response.data : []
                setAccounts(accountsData)
                
                // Check if response has meta (paginated) or use data length
                if ('meta' in response && response.meta) {
                    setTotalRows(response.meta.total || accountsData.length)
                } else {
                    setTotalRows(accountsData.length)
                }
            } else {
                setAccounts([])
                setTotalRows(0)
            }
        } catch (error) {
            console.error("Failed to load accounts:", error)
            setAccounts([])
            setTotalRows(0)
        } finally {
            setLoading(false)
        }
    }, [page, rowsPerPage])

    useEffect(() => {
        loadAccounts()
    }, [loadAccounts])

    const handleCreate = () => {
        setSelectedAccount(null)
        setModalOpen(true)
    }

    const handleEdit = (account: Account) => {
        setSelectedAccount(account)
        setModalOpen(true)
    }

    const handleSuccess = () => {
        setModalOpen(false)
        setSelectedAccount(null)
        loadAccounts()
    }

    const handlePageChange = (newPage: number) => {
        setPage(newPage)
    }

    const handleRowsPerPageChange = (newRowsPerPage: number) => {
        setRowsPerPage(newRowsPerPage)
        setPage(1) // Reset to first page when changing rows per page
    }

    return (
        <PageTransition>
            <div className="flex flex-1 flex-col gap-4 w-full max-w-full min-h-screen">
                <DashboardHeader 
                    title="Chart of Accounts" 
                    rightWidgets={[
                        <Button key="create" variant="default" onClick={handleCreate}>
                            <PlusIcon className="w-4 h-4" /> Create Account
                        </Button>
                    ]} 
                />
                <section className="w-full max-w-full">
                    <div className="w-full flex">
                        <AccountsTable 
                            accounts={accounts} 
                            loading={loading} 
                            onEdit={handleEdit}
                            page={page}
                            onPageChange={handlePageChange}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={handleRowsPerPageChange}
                            totalRows={totalRows}
                            onRefresh={loadAccounts}
                        />
                    </div>
                </section>
                <AccountModal
                    open={modalOpen}
                    onOpenChange={setModalOpen}
                    item={selectedAccount}
                    onSuccess={handleSuccess}
                />
            </div>
        </PageTransition>
    )
})

