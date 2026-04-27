"use client"

import * as React from "react"
import { TrendingUp } from "lucide-react"
import { LabelList, Pie, PieChart } from "recharts"

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
import { ShipmentByLocationData } from "@/types/dashboardTypes"
import { toastUtils } from "@/utils/toast-utils"

const chartConfig = {
    shipments: {
        label: "Shipments",
    },
} satisfies ChartConfig

export const PieOfShipmentByLocation = () => {
    const [chartData, setChartData] = React.useState<ShipmentByLocationData[]>([])
    const [isLoading, setIsLoading] = React.useState(true)

    React.useEffect(() => {
        const fetchData = async () => {
            try {
                setIsLoading(true)
                const response = await ApiService.getShipmentsByLocation({ months: 6, limit: 4 })
                if (response.status && response.data) {
                    setChartData(response.data)
                } else {
                    toastUtils.error(response.message || "Failed to load shipment location data")
                }
            } catch (error) {
                console.error("Error fetching shipments by location:", error)
                toastUtils.error("Failed to load shipment location data")
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [])

    // Build dynamic chart config based on locations
    const dynamicChartConfig: ChartConfig = {
        shipments: {
            label: "Shipments",
        },
        ...chartData.reduce((acc, item, index) => {
            const colors = [
                "var(--chart-1)",
                "var(--chart-2)",
                "var(--chart-3)",
                "var(--chart-4)",
                "var(--chart-5)",
            ]
            acc[item.location] = {
                label: item.locationName,
                color: colors[index % colors.length],
            }
            return acc
        }, {} as Record<string, { label: string; color: string }>),
    } satisfies ChartConfig

    // Transform data to match chart format
    const transformedData = chartData.map((item) => {
        return {
            location: item.location,
            shipments: item.shipments,
            fill: `var(--color-${item.location})`,
        }
    })
    return (
        <Card className="flex flex-col">
            <CardHeader className="items-center pb-0">
                <CardTitle>Shipment by Location</CardTitle>
                <CardDescription>Showing total shipments by location for the last 6 months</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-0">
                {isLoading ? (
                    <div className="flex items-center justify-center h-[250px]">
                        <p className="text-muted-foreground">Loading chart data...</p>
                    </div>
                ) : transformedData.length === 0 ? (
                    <div className="flex items-center justify-center h-[250px]">
                        <p className="text-muted-foreground">No data available</p>
                    </div>
                ) : (
                    <ChartContainer
                        config={dynamicChartConfig}
                        className="[&_.recharts-text]:fill-background mx-auto aspect-square max-h-[250px]"
                    >
                        <PieChart>
                            <ChartTooltip
                                content={<ChartTooltipContent nameKey="shipments" hideLabel />}
                            />
                            <Pie data={transformedData} dataKey="shipments">
                                <LabelList
                                    dataKey="location"
                                    className="fill-background"
                                    stroke="none"
                                    fontSize={12}
                                    formatter={(value) => {
                                        const item = chartData.find(d => d.location === value)
                                        return item ? item.locationName : value
                                    }}
                                />
                            </Pie>
                        </PieChart>
                    </ChartContainer>
                )}
            </CardContent>
            <CardFooter className="flex-col gap-2 text-sm">
                <div className="flex items-center gap-2 leading-none font-medium">
                    Trending up by 10% this month <TrendingUp className="h-4 w-4" />
                </div>
                <div className="text-muted-foreground leading-none">
                    Showing total shipments by location for the last 6 months
                </div>
            </CardFooter>
        </Card>
    )
}