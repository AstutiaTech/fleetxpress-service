"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CreditCard, Download, MoreHorizontal, Plus, Send, Wallet } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useState } from "react"

const initialAccounts = [
  { name: "CURRENT ASSET", balance: 7500 },
  { name: "FIXED ASSET", balance: 560000 },
  { name: "OTHER ASSET", balance: 120000 },
  { name: "OWNERS EQUITY", balance: 350000 },
  { name: "OPERATING REVENUE", balance: 5879000 },
  { name: "OTHER REVENUE", balance: 45000 },
  { name: "FINANCIAL EXPENSE", balance: 125000 },
]

export function AccountsOverview() {
  const [accounts, setAccounts] = useState(initialAccounts)
  const [currency, setCurrency] = useState("NGN")

  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0)

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Accounts Overview</CardTitle>
        <Select value={currency} onValueChange={setCurrency}>
          <SelectTrigger
            className="hidden w-[140px] rounded-lg sm:ml-auto sm:flex"
            aria-label="Select currency"
          >
            <SelectValue placeholder={currency} />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="USD" className="rounded-lg">
              USD
            </SelectItem>
            <SelectItem value="NGN" className="rounded-lg">
              NGN
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="flex flex-col h-56">
        <div className="text-2xl font-bold">{currency === "NGN" ? "₦" : "$"}{totalBalance.toLocaleString()}</div>
        <p className="text-xs text-muted-foreground">Total balance across major accounts</p>
        <ScrollArea className="h-56 mt-4">
          <div className="space-y-2 pr-4">
            {accounts.map((account) => (
              <div key={account.name} className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">{account.name}</span>
                <span className="text-sm font-medium">{currency === "NGN" ? "₦" : "$"}{account.balance.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </ScrollArea>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button size="sm">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button size="sm" variant="outline">
            <MoreHorizontal className="mr-2 h-4 w-4" /> See All
          </Button>
        </div>
      </CardContent>

    </Card>
  )
}
