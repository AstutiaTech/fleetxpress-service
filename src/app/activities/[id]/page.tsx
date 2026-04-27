"use client"

import { useEffect } from "react"
import { observer } from "mobx-react-lite"
import { useParams, useRouter } from "next/navigation"
import { useStore } from "@/providers/store.provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Loader2 } from "lucide-react"
import { format } from "date-fns"
import { timeAgo } from "@/handlers/formatters"
import { PageTransition } from "@/providers/page-transition"
import { ActivityType } from "@/types/activityTypes"

export default observer(function ActivityDetailPage() {
    const { id } = useParams<{ id: string }>()
    const router = useRouter()
    const { activityStore } = useStore()

    useEffect(() => {
        if (id && typeof id === "string") {
            activityStore.fetchActivityById(id)
        }
    }, [id])

    const activity = activityStore.currentActivity
    const isLoading = activityStore.isLoading

    const getActivityTypeColor = (type: ActivityType): "default" | "secondary" | "destructive" | "outline" => {
        const colorMap: Record<ActivityType, "default" | "secondary" | "destructive" | "outline"> = {
            login: "default",
            logout: "outline",
            create: "secondary",
            update: "secondary",
            delete: "destructive",
            view: "outline",
            export: "default",
            import: "secondary",
            payment: "default",
            shipment: "secondary",
            other: "outline",
        }
        return colorMap[type] || "outline"
    }

    if (isLoading) {
        return (
            <PageTransition>
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            </PageTransition>
        )
    }

    if (!activity) {
        return (
            <PageTransition>
                <div className="flex flex-col items-center justify-center h-64 gap-4">
                    <p className="text-muted-foreground">Activity not found</p>
                    <Button variant="outline" onClick={() => router.push("/activities")}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Activities
                    </Button>
                </div>
            </PageTransition>
        )
    }

    return (
        <PageTransition>
            <div className="flex flex-1 flex-col gap-4 w-full max-w-full min-h-screen p-6">
                <div className="mb-4">
                    <Button variant="ghost" onClick={() => router.push("/activities")}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Activities
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Activity Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Activity Name</label>
                                <p className="text-base font-medium mt-1">{activity.name}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Activity Type</label>
                                <div className="mt-1">
                                    <Badge variant={getActivityTypeColor(activity.activityType)}>
                                        {activity.activityType.toUpperCase()}
                                    </Badge>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Status</label>
                                <div className="mt-1">
                                    <Badge variant={activity.status === 1 ? "default" : "destructive"}>
                                        {activity.status === 1 ? "Success" : "Failed"}
                                    </Badge>
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">User ID</label>
                                <p className="text-base mt-1">{activity.userId || "System"}</p>
                            </div>
                            {activity.description && (
                                <div className="md:col-span-2">
                                    <label className="text-sm font-medium text-muted-foreground">Description</label>
                                    <p className="text-base mt-1">{activity.description}</p>
                                </div>
                            )}
                            {activity.activityLocation && (
                                <div>
                                    <label className="text-sm font-medium text-muted-foreground">Location</label>
                                    <p className="text-base mt-1">{activity.activityLocation}</p>
                                </div>
                            )}
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Created At</label>
                                <p className="text-base mt-1">
                                    {format(new Date(activity.createdAt), "MMM dd, yyyy HH:mm:ss")}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">{timeAgo(activity.createdAt)}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-muted-foreground">Updated At</label>
                                <p className="text-base mt-1">
                                    {format(new Date(activity.updatedAt), "MMM dd, yyyy HH:mm:ss")}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </PageTransition>
    )
})

