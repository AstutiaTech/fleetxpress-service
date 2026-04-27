"use client"

import * as React from "react"

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Calendar as CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

interface DatePickerProps {
    className?: React.HTMLAttributes<HTMLDivElement>
    hint?: string
    initialDate?: Date
    onDateChange?: (date: Date | undefined) => void
}

export function DatePicker(props: DatePickerProps) {
    const { className, hint = "Pick a date", initialDate, onDateChange } = props
    const [date, setDate] = React.useState<Date | undefined>(initialDate)
    React.useEffect(() => {
        if (onDateChange) {
            onDateChange(date)
        }
    }, [date, onDateChange])
    React.useEffect(() => {
        if (initialDate) {
            setDate(initialDate)
        }
    }, [initialDate])

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-full justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon />
                        {date ? (
                            format(date, "LLL dd, y")
                        ) : (
                            <span>{hint}</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        initialFocus
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        numberOfMonths={1}
                    />
                </PopoverContent>
            </Popover>
        </div>
    )
}
