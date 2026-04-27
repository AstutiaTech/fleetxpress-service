"use client"

import { CustomTable, CustomTableColumn } from "@/components/customTable"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useState } from "react"

import { Activity } from "@/types/activityTypes"
import { ActivityType } from "@/types/activityTypes"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Eye } from "lucide-react"
import { Input } from "@/components/ui/input"
import { format } from "date-fns"
import { observer } from "mobx-react-lite"
import { timeAgo } from "@/handlers/formatters"
import { useRouter } from "next/navigation"
import { useStore } from "@/providers/store.provider"

export const ActivitiesTable = observer(() => {
    const { activityStore } = useStore()
    const router = useRouter()
    const [search, setSearch] = useState("")
    const [activityTypeFilter, setActivityTypeFilter] = useState<ActivityType | "all">("all")
    const [statusFilter, setStatusFilter] = useState<number | "all">("all")

    useEffect(() => {
        const filters: any = {
            page: 1,
            limit: activityStore.pagination.limit,
        }

        if (search) {
            filters.search = search
        }

        if (activityTypeFilter !== "all") {
            filters.activityType = activityTypeFilter
        }

        if (statusFilter !== "all") {
            filters.status = statusFilter
        }

        activityStore.fetchAllActivities(filters)
    }, [search, activityTypeFilter, statusFilter, activityStore.pagination.limit])

    const activities = activityStore.activities
    const pagination = activityStore.pagination

    const handleView = (activity: Activity) => {
        router.push(`/activities/${activity.id}`)
    }

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

    const getStatusBadge = (status: number) => {
        return (
            <Badge variant={status === 1 ? "default" : "destructive"}>
                {status === 1 ? "Success" : "Failed"}
            </Badge>
        )
    }

    const columns: CustomTableColumn<Activity>[] = [
        {
            header: "Activity Name",
            cell: (row: Activity) => {
                // Create a data attribute for export extraction
                const exportValue = row.description 
                    ? `${row.name} - ${row.description}` 
                    : row.name;
                return (
                    <div 
                        className="min-w-[200px] max-w-[400px]"
                        data-export-value={exportValue}
                    >
                        <div className="font-medium wrap-break-word whitespace-normal">{row.name}</div>
                        {row.description && (
                            <div className="text-sm text-muted-foreground wrap-break-word whitespace-normal">{row.description}</div>
                        )}
                    </div>
                );
            },
            className: "min-w-[200px]",
        },
        {
            header: "Type",
            cell: (row: Activity) => (
                <Badge variant={getActivityTypeColor(row.activityType)}>
                    {row.activityType.toUpperCase()}
                </Badge>
            ),
            // className: "w-[120px]",
        },
        {
            header: "Status",
            cell: (row: Activity) => getStatusBadge(row.status),
            // className: "w-[100px]",
        },
        {
            header: "User",
            cell: (row: Activity) => (
                <div>
                    {row.user?.firstName ? `${row.user?.firstName} ${row.user?.lastName}` : "System"}
                    <div className="text-xs text-muted-foreground">{row.user?.email}</div>
                </div>
            ),
            // className: "w-[150px]",
        },
        {
            header: "Location",
            cell: (row: Activity) => row.activityLocation || "-",
            // className: "w-[150px]",
        },
        {
            header: "Date",
            cell: (row: Activity) => (
                <div>
                    <div>{format(new Date(row.createdAt), "MMM dd, yyyy HH:mm")}</div>
                    <div className="text-xs text-muted-foreground">{timeAgo(row.createdAt)}</div>
                </div>
            ),
            sortable: true,
            // className: "w-[180px]",
        },
        // {
        //     header: "Actions",
        //     cell: (row: Activity) => (
        //         <Button
        //             variant="ghost"
        //             size="sm"
        //             onClick={() => handleView(row)}
        //         >
        //             <Eye className="h-4 w-4 mr-2" />
        //             View
        //         </Button>
        //     ),
        //     // className: "w-[100px]",
        // },
    ]

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 p-4 bg-card rounded-lg border">
                <Input
                    placeholder="Search activities..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="flex-1"
                />
                <Select
                    value={activityTypeFilter}
                    onValueChange={(value) => setActivityTypeFilter(value as ActivityType | "all")}
                >
                    <SelectTrigger className="w-full md:w-[200px]">
                        <SelectValue placeholder="Activity Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="login">Login</SelectItem>
                        <SelectItem value="logout">Logout</SelectItem>
                        <SelectItem value="create">Create</SelectItem>
                        <SelectItem value="update">Update</SelectItem>
                        <SelectItem value="delete">Delete</SelectItem>
                        <SelectItem value="view">View</SelectItem>
                        <SelectItem value="export">Export</SelectItem>
                        <SelectItem value="import">Import</SelectItem>
                        <SelectItem value="payment">Payment</SelectItem>
                        <SelectItem value="shipment">Shipment</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                </Select>
                <Select
                    value={statusFilter === "all" ? "all" : statusFilter.toString()}
                    onValueChange={(value) => setStatusFilter(value === "all" ? "all" : parseInt(value))}
                >
                    <SelectTrigger className="w-full md:w-[150px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="1">Success</SelectItem>
                        <SelectItem value="0">Failed</SelectItem>
                    </SelectContent>
                </Select>
                <Button
                    variant="outline"
                    onClick={() => {
                        setSearch("")
                        setActivityTypeFilter("all")
                        setStatusFilter("all")
                    }}
                >
                    Clear Filters
                </Button>
            </div>

            <div className="mt-4 w-full">
                <CustomTable
                    columns={columns}
                    data={activities}
                    usePagination={true}
                    page={pagination.page}
                    onPageChange={(page) => {
                        const filters: any = {
                            page,
                            limit: pagination.limit,
                        }
                        if (search) filters.search = search
                        if (activityTypeFilter !== "all") filters.activityType = activityTypeFilter
                        if (statusFilter !== "all") filters.status = statusFilter
                        activityStore.fetchAllActivities(filters)
                    }}
                    rowsPerPage={pagination.limit}
                    onRowsPerPageChange={(limit) => {
                        const filters: any = {
                            page: 1,
                            limit,
                        }
                        if (search) filters.search = search
                        if (activityTypeFilter !== "all") filters.activityType = activityTypeFilter
                        if (statusFilter !== "all") filters.status = statusFilter
                        activityStore.fetchAllActivities(filters)
                    }}
                    totalRows={pagination.total}
                    exportOptions={{
                        title: "Activities",
                        file_name: "activities",
                        header_title: "Activities",
                    }}
                    hasExport={true}
                />
            </div>
        </div>
    )
})

