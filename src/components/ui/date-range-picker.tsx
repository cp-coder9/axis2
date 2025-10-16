"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { DateRange } from "react-day-picker"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { format } from "date-fns"

interface DatePickerWithRangeProps {
    date?: { from: Date; to: Date }
    onDateChange?: (date: { from: Date; to: Date } | undefined) => void
    className?: string
}

export function DatePickerWithRange({
    date,
    onDateChange,
    className,
}: DatePickerWithRangeProps) {
    const [dateRange, setDateRange] = React.useState<DateRange | undefined>(
        date ? { from: date.from, to: date.to } : undefined
    )

    React.useEffect(() => {
        setDateRange(date ? { from: date.from, to: date.to } : undefined)
    }, [date])

    const handleSelect = (range: DateRange | undefined) => {
        setDateRange(range)
        if (range?.from && range?.to) {
            onDateChange?.({ from: range.from, to: range.to })
        } else {
            onDateChange?.(undefined)
        }
    }

    return (
        <div className={cn("grid gap-2", className)}>
            <Popover>
                <PopoverTrigger asChild>
                    <Button
                        id="date"
                        variant={"outline"}
                        className={cn(
                            "w-[300px] justify-start text-left font-normal",
                            !dateRange && "text-muted-foreground"
                        )}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange?.from ? (
                            dateRange.to ? (
                                <>
                                    {format(dateRange.from, "LLL dd, y")} -{" "}
                                    {format(dateRange.to, "LLL dd, y")}
                                </>
                            ) : (
                                format(dateRange.from, "LLL dd, y")
                            )
                        ) : (
                            <span>Pick a date range</span>
                        )}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={dateRange?.from}
                        selected={dateRange}
                        onSelect={handleSelect}
                        numberOfMonths={2}
                    />
                </PopoverContent>
            </Popover>
        </div>
    )
}