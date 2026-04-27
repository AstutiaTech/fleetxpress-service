"use client"

import * as React from "react"
import { TrendingUp } from "lucide-react"
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts"

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"
import { ApiService } from "@/lib/api"
import { ShipmentByMonthData } from "@/types/dashboardTypes"
import { toastUtils } from "@/utils/toast-utils"

const chartConfig = {
    shipments: {
        label: "Shipments",
        color: "var(--chart-2)",
    },
    label: {
        color: "var(--background)",
    },
} satisfies ChartConfig

export const ShipmentBarChart = () => {
    const [chartData, setChartData] = React.useState<ShipmentByMonthData[]>([])
    const [isLoading, setIsLoading] = React.useState(true)

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true)
                const response = await ApiService.getShipmentsByMonth({ months: 6 })
                if (response.status && response.data) {
                    setChartData(response.data)
                } else {
                    toastUtils.error(response.message || "Failed to load shipment data")
                }
            } catch (error) {
                console.error("Error fetching shipments by month:", error)
                toastUtils.error("Failed to load shipment data")
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [])

    // Transform data to match chart format
    const transformedData = chartData.map(item => ({
        month: item.month,
        shipments: item.shipments,
    }))
    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Shipment Chart</CardTitle>
                <CardDescription>Showing total shipments for the last 6 months</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex items-center justify-center h-[250px]">
                        <p className="text-muted-foreground">Loading chart data...</p>
                    </div>
                ) : transformedData.length === 0 ? (
                    <div className="flex items-center justify-center h-[250px]">
                        <p className="text-muted-foreground">No data available</p>
                    </div>
                ) : (
                    <ChartContainer config={chartConfig}>
                        <BarChart
                            accessibilityLayer
                            data={transformedData}
                            layout="vertical"
                            margin={{
                                right: 16,
                            }}
                        >
                            <CartesianGrid horizontal={false} />
                            <YAxis
                                dataKey="month"
                                type="category"
                                tickLine={false}
                                tickMargin={10}
                                axisLine={false}
                                tickFormatter={(value) => value.slice(0, 3)}
                                hide
                            />
                            <XAxis dataKey="shipments" type="number" hide />
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent indicator="line" />}
                            />
                            <Bar
                                dataKey="shipments"
                                fill="var(--color-shipments)"
                                radius={4}
                            >
                                <LabelList
                                    dataKey="month"
                                    position="insideLeft"
                                    offset={8}
                                    className="fill-(--color-label)"
                                    fontSize={12}
                                />
                                <LabelList
                                    dataKey="shipments"
                                    position="right"
                                    offset={8}
                                    className="fill-foreground"
                                    fontSize={12}
                                />
                            </Bar>
                        </BarChart>
                    </ChartContainer>
                )}
            </CardContent>
            <CardFooter className="flex-col items-start gap-2 text-sm">
                <div className="flex gap-2 leading-none font-medium">
                    Trending up by 10% this month <TrendingUp className="h-4 w-4" />
                </div>
                <div className="text-muted-foreground leading-none">
                    Showing total shipments for the last 6 months
                </div>
            </CardFooter>
        </Card>
    )
}