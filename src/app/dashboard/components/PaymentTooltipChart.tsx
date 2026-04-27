"use client"

import * as React from "react"
import { Bar, BarChart, XAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ApiService } from "@/lib/api"
import { PaymentData } from "@/types/dashboardTypes"
import { toastUtils } from "@/utils/toast-utils"

const chartConfig = {
  credit: {
    label: "Credit",
    color: "var(--chart-2)",
  },
  debit: {
    label: "Debit",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

export const PaymentTooltipChart = () => {
  const [currency, setCurrency] = React.useState("NGN")
  const [chartData, setChartData] = React.useState<PaymentData[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const response = await ApiService.getPayments({ currency, days: 6 })
        if (response.status && response.data) {
          setChartData(response.data)
        } else {
          toastUtils.error(response.message || "Failed to load payment data")
        }
      } catch (error) {
        console.error("Error fetching payments:", error)
        toastUtils.error("Failed to load payment data")
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [currency])

  return (
    <Card className="h-full">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1">
          <CardTitle>Payments</CardTitle>
          <CardDescription>
            Showing credit and debit payments over time
          </CardDescription>
        </div>
        <Select value={currency} onValueChange={setCurrency}>
          <SelectTrigger
            className="hidden w-[140px] rounded-lg sm:ml-auto sm:flex"
            aria-label="Select currency"
          >
            <SelectValue placeholder="USD" />
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
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-[250px]">
            <p className="text-muted-foreground">Loading chart data...</p>
          </div>
        ) : chartData.length === 0 ? (
          <div className="flex items-center justify-center h-[250px]">
            <p className="text-muted-foreground">No data available</p>
          </div>
        ) : (
          <ChartContainer config={chartConfig}>
            <BarChart accessibilityLayer data={chartData}>
            <XAxis
              dataKey="date"
              tickLine={false}
              tickMargin={10}
              axisLine={false}
              tickFormatter={(value) => {
                return new Date(value).toLocaleDateString("en-US", {
                  weekday: "short",
                })
              }}
            />
            <Bar
              dataKey="credit"
              stackId="a"
              fill="var(--color-credit)"
              radius={[0, 0, 4, 4]}
            />
            <Bar
              dataKey="debit"
              stackId="a"
              fill="var(--color-debit)"
              radius={[4, 4, 0, 0]}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  hideLabel
                  className="w-[180px]"
                  formatter={(value, name, item, index) => (
                    <>
                      <div
                        className="h-2.5 w-2.5 shrink-0 rounded-[2px] bg-(--color-bg)"
                        style={
                          {
                            "--color-bg": `var(--color-${name})`,
                          } as React.CSSProperties
                        }
                      />
                      {chartConfig[name as keyof typeof chartConfig]?.label ||
                        name}
                      <div className="text-foreground ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums">
                        {value}
                        <span className="text-muted-foreground font-normal">
                          {currency}
                        </span>
                      </div>
                      {/* Add this after the last item */}
                      {index === 1 && (
                        <div className="text-foreground mt-1.5 flex basis-full items-center border-t pt-1.5 text-xs font-medium">
                          Total
                          <div className="text-foreground ml-auto flex items-baseline gap-0.5 font-mono font-medium tabular-nums">
                            {item.payload.credit + item.payload.debit}
                            <span className="text-muted-foreground font-normal">
                              {currency}
                            </span>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                />
              }
              cursor={false}
              defaultIndex={1}
            />
          </BarChart>
        </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}