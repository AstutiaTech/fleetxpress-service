"use client"

import { Button } from "@/components/ui/button"
import { DashboardHeader } from "@/components/dashboard-header"
import { InvoicesTable } from "./invoices-table"
import Link from "next/link"
import { PageTransition } from "@/providers/page-transition"
import { PlusIcon } from "lucide-react"

export const InvoicesComp = () => {
    return (
        <PageTransition>
            <div className="flex flex-1 flex-col gap-4 w-full max-w-full min-h-screen">
                <DashboardHeader title="Invoice Management" rightWidgets={[
                    <Link key="create-invoice" href="/invoices/create">
                        <Button variant="default" className="cursor-pointer">
                            <PlusIcon className="w-4 h-4" /> Create Invoice
                        </Button>
                    </Link>
                ]} />
                <section className="w-full max-w-full">
                    <div className="w-full flex">
                        <InvoicesTable />
                    </div>
                </section>
            </div>
        </PageTransition>
    )
}

export default InvoicesComp

