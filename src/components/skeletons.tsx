import { Skeleton } from "./ui/skeleton"
import { cn } from "@/lib/utils"

export const StatsSkeleton = ({ length = 4 }: { length?: number }) => {
    return (
        <div className={cn(`grid-cols-${length}`, 'grid gap-4')}>
            {Array.from({ length }).map((_, idx) => (
                <div key={idx} className="border flex flex-col gap-4 p-2 rounded-md bg-white">
                    <div className="flex gap-4 items-center">
                        <Skeleton className="h-8 w-8" />
                        <Skeleton className="h-4 w-2/3" />
                    </div>
                    <div className="">
                        <Skeleton className="h-4 w-[160px]" />
                    </div>
                    <div className="">
                        <Skeleton className="h-4 w-28" />
                    </div>
                </div>
            ))}
        </div>
    )
}

export const ChartStatsSkeleton = () => (
    <div className="grid grid-cols-12 gap-2 lg:gap-0 h-96">
        <div className="col-span-12 lg:col-span-6">
            <div className="border rounded-l-md h-full bg-white p-8 flex flex-col gap-5">
                <div className="flex justify-between">
                    <Skeleton className="h-4 w-1/2" />
                    <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-4 w-2/3" />
                <div className="flex-1 flex gap-2 items-end">
                    <Skeleton className="h-28 w-4" />
                    <Skeleton className="h-20 w-4" />
                    <Skeleton className="h-24 w-4" />
                    <Skeleton className="h-28 w-4" />
                    <Skeleton className="h-20 w-4" />
                    <Skeleton className="h-28 w-4" />
                    <Skeleton className="h-32 w-4" />
                    <Skeleton className="h-36 w-4" />
                    <Skeleton className="h-52 w-4" />
                    <Skeleton className="h-32 w-4" />
                    <Skeleton className="h-28 w-4" />
                    <Skeleton className="h-24 w-4" />
                    <Skeleton className="h-36 w-4" />
                    <Skeleton className="h-36 w-4" />
                    <Skeleton className="h-28 w-4" />
                    <Skeleton className="h-24 w-4" />
                    <Skeleton className="h-11 w-4" />
                    <Skeleton className="h-20 w-4" />
                    <Skeleton className="h-16 w-4" />
                    <Skeleton className="h-16 w-4" />
                    <Skeleton className="h-28 w-4" />
                    <Skeleton className="h-24 w-4" />
                </div>
            </div>
        </div>

        <div className="col-span-12 lg:col-span-3">
            <div className="border border-l-0 border-y h-full">
                <div className='grid grid-cols-2 h-full'>
                    {Array.from({ length: 6 }).map((_, idx) => (
                        <div key={idx} className={cn(
                            'p-3 bg-white flex flex-col gap-2',
                        )}>
                            <div
                                className={cn('w-12 h-12 rounded-md border flex items-center justify-center',)}

                            >
                                <Skeleton className="h-8 w-8" />
                            </div>
                            <div className='flex-1 flex flex-col gap-2'>
                                <h4 className='text-sm font-medium text-gray-600'><Skeleton className="h-4 w-24" /></h4>
                                <h2 className='text-2xl font-semibold text-gray-900'><Skeleton className="h-4 w-24" /></h2>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        <div className="col-span-12 lg:col-span-3 lg:ml-4 border rounded-md p-4">
            <div className="flex justify-between">
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-24" />
            </div>
            <div className="w-full h-60 flex justify-center mt-6 relative">
                <Skeleton className="h-full w-full rounded-full" />
                <div className="absolute w-full h-full p-10">
                    <div className="h-full w-full rounded-full bg-white" />
                </div>
            </div>
        </div>
    </div>
)