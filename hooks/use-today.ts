"use client"

import { useEffect, useState } from "react"
import { useDaySettings } from "@/lib/settings-context"
import { getEffectiveDateStr } from "@/lib/utils"

/** The current "effective" date string (yyyy-MM-dd), respecting the day-start rollover hour. */
export function useToday(): string {
  const { settings } = useDaySettings()
  const [today, setToday] = useState(() => getEffectiveDateStr(settings.dayStartHour))

  useEffect(() => {
    function update() {
      setToday(getEffectiveDateStr(settings.dayStartHour))
    }
    update()
    const id = setInterval(update, 60_000)
    return () => clearInterval(id)
  }, [settings.dayStartHour])

  return today
}
