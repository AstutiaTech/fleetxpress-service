"use client"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { CustomTable, CustomTableColumn } from "@/components/customTable"
import { Download, Trash2 } from "lucide-react"
import { formatFileSize, timeAgo } from "@/handlers/formatters"

import { Backup } from "@/types/backupTypes"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { observer } from "mobx-react-lite"
import { useEffect } from "react"
import { useStore } from "@/providers/store.provider"

export const BackupsTable = observer(() => {
    const { backupStore } = useStore()

    useEffect(() => {
        backupStore.fetchAllBackups()
    }, [])

    const backups = backupStore.backups
    const isLoading = backupStore.isLoading

    const handleDownload = (backup: Backup) => {
        backupStore.handleDirectDownload(backup)
    }

    const handleDownloadAuthenticated = async (backup: Backup) => {
        try {
            await backupStore.downloadBackup(backup.filename)
        } catch (error) {
            // Error is already handled in the store
        }
    }

    const handleCleanup = async () => {
        try {
            await backupStore.cleanupBackups()
        } catch (error) {
            // Error is already handled in the store
        }
    }

    const columns: CustomTableColumn<Backup>[] = [
        {
            header: "Filename",
            cell: (row: Backup) => (
                <div>
                    <div className="font-medium">{row.filename}</div>
                    <div className="text-xs text-muted-foreground">
                        Created {timeAgo(row.createdAt)}
                    </div>
                </div>
            ),
            className: "min-w-[250px]",
        },
        {
            header: "Size",
            cell: (row: Backup) => (
                <Badge variant="secondary">
                    {formatFileSize(row.size)}
                </Badge>
            ),
            className: "w-[120px]",
        },
        {
            header: "Created At",
            cell: (row: Backup) => (
                <div>
                    <div>{format(new Date(row.createdAt), "MMM dd, yyyy HH:mm")}</div>
                    <div className="text-xs text-muted-foreground">{timeAgo(row.createdAt)}</div>
                </div>
            ),
            className: "w-[180px]",
        },
        {
            header: "Actions",
            cell: (row: Backup) => (
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadAuthenticated(row)}
                    >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                    </Button>
                </div>
            ),
            className: "w-[150px]",
        },
    ]

    return (
        <div className="space-y-4">
            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 p-4 bg-card rounded-lg border">
                <Button
                    variant="default"
                    onClick={() => backupStore.createBackup()}
                    disabled={backupStore.isCreating}
                >
                    {backupStore.isCreating ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Creating...
                        </>
                    ) : (
                        <>
                            <Download className="h-4 w-4 mr-2" />
                            Create New Backup
                        </>
                    )}
                </Button>
                <Button
                    variant="outline"
                    onClick={() => backupStore.fetchAllBackups()}
                    disabled={isLoading}
                >
                    Refresh List
                </Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button
                            variant="destructive"
                            disabled={isLoading}
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Cleanup Old Backups
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Cleanup Old Backups</AlertDialogTitle>
                            <AlertDialogDescription>
                                Are you sure you want to delete backups older than 7 days? This action cannot be undone.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleCleanup}>
                                Continue
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>

                {/* Progress Bar */}
                {backupStore.isCreating && (
                    <div className="w-full mt-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">Creating backup...</span>
                            <span className="text-sm font-medium">{backupStore.createProgress}%</span>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2">
                            <div
                                className="bg-primary h-2 rounded-full transition-all duration-300"
                                style={{ width: `${backupStore.createProgress}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Table */}
            <CustomTable
                columns={columns}
                data={backups}
                usePagination={false}
                emptyContent={
                    <div className="text-center py-8">
                        <p className="text-muted-foreground">No backups found</p>
                        <p className="text-sm text-muted-foreground mt-2">
                            Click &quot;Create New Backup&quot; to create your first backup
                        </p>
                    </div>
                }
            />
        </div>
    )
})

