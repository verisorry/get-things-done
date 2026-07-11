import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, subDays } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * The "effective" date for a given moment, given the hour the day rolls over at.
 * Before dayStartHour, the clock time still belongs to the previous calendar day
 * (e.g. dayStartHour=6 means 2am on Jan 6 is still "Jan 5" for planning purposes).
 */
export function getEffectiveDate(dayStartHour: number, now: Date = new Date()): Date {
  return now.getHours() < dayStartHour ? subDays(now, 1) : now
}

export function getEffectiveDateStr(dayStartHour: number, now: Date = new Date()): string {
  return format(getEffectiveDate(dayStartHour, now), "yyyy-MM-dd")
}
