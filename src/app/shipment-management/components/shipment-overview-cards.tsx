"use client"

import * as React from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  CheckCircle,
  Package,
  PackageSearch,
  XCircle
} from "lucide-react"

import { ApiService } from "@/lib/api"
import { DashboardSummary } from "@/types/dashboardTypes"
import { toastUtils } from "@/utils/toast-utils"

interface CardConfig {
  title: string
  icon: React.ComponentType<{ className?: string }>
  key: keyof DashboardSummary
  formatter?: (value: number) => string
}

const cardConfigs: CardConfig[] = [
  {
    title: "Total Shipments",
    icon: Package,
    key: "totalShipments",
    formatter: (value) => value.toLocaleString(),
  },
  {
    title: "Total Completed Shipments",
    icon: CheckCircle,
    key: "totalCompleted",
    formatter: (value) => value.toLocaleString(),
  },
  {
    title: "Total Ongoing Shipments",
    icon: PackageSearch,
    key: "totalOngoing",
    formatter: (value) => value.toLocaleString(),
  },
  {
    title: "Total Delivered Shipments",
    icon: CheckCircle,
    key: "totalDelivered",
    formatter: (value) => value.toLocaleString(),
  },
  {
    title: "Total Cancelled Shipments",
    icon: XCircle,
    key: "totalCancelled",
    formatter: (value) => value.toLocaleString(),
  },
]

export function ShipmentOverviewCards() {
  const [summary, setSummary] = React.useState<DashboardSummary | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const response = await ApiService.getDashboardSummary()
        if (response.status && response.data) {
          setSummary(response.data)
        } else {
          toastUtils.error(response.message || "Failed to load shipment summary")
        }
      } catch (error) {
        console.error("Error fetching shipment summary:", error)
        toastUtils.error("Failed to load shipment summary")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])

  if (isLoading) {
    return (
      <>
        {cardConfigs.map((config) => (
          <Card key={config.title} className="min-w-[200px] w-full shrink-0">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{config.title}</CardTitle>
              <config.icon className="h-4 w-4 text-muted-foreground shrink-0" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Loading...</div>
            </CardContent>
          </Card>
        ))}
      </>
    )
  }

  if (!summary) {
    return (
      <>
        {cardConfigs.map((config) => (
          <Card key={config.title} className="min-w-[200px] w-full shrink-0">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{config.title}</CardTitle>
              <config.icon className="h-4 w-4 text-muted-foreground shrink-0" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">N/A</div>
            </CardContent>
          </Card>
        ))}
      </>
    )
  }

  return (
    <>
      {cardConfigs.map((config) => {
        const value = summary[config.key]
        const formattedValue = config.formatter ? config.formatter(value) : value.toString()
        
        return (
          <Card key={config.title} className="min-w-[200px] w-full shrink-0">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{config.title}</CardTitle>
              <config.icon className="h-4 w-4 text-muted-foreground shrink-0" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formattedValue}</div>
            </CardContent>
          </Card>
        )
      })}
    </>
  )
}
