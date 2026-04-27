import { Skeleton } from "./ui/skeleton"

export const TableSkeleton = () => {
    return (
        <div className="flex flex-row gap-6 w-full">
            <div className="flex-1 bg-white border border-gray-200 rounded-2xl p-6 flex flex-col justify-between min-w-[220px] space-y-3">
                <div className="grid grid-cols-5 gap-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[160px]" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[160px]" />
                    <Skeleton className="h-4 w-[160px]" />
                </div>
                <div className="grid grid-cols-5 gap-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[160px]" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[160px]" />
                    <Skeleton className="h-4 w-[160px]" />
                </div>
                <div className="grid grid-cols-5 gap-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[160px]" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[160px]" />
                    <Skeleton className="h-4 w-[160px]" />
                </div>
                <div className="grid grid-cols-5 gap-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[160px]" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[160px]" />
                    <Skeleton className="h-4 w-[160px]" />
                </div>
                <div className="grid grid-cols-5 gap-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[160px]" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-[160px]" />
                    <Skeleton className="h-4 w-[160px]" />
                </div>
            </div>
        </div>
    )
}