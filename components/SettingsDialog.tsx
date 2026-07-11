"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useDaySettings } from "@/lib/settings-context"

function formatHourLabel(hour: number) {
  const h = ((hour % 24) + 24) % 24
  const period = h < 12 ? "AM" : "PM"
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${display}:00 ${period}`
}

function endHourLabel(hour: number) {
  const label = formatHourLabel(hour)
  return hour >= 24 ? `${label} (next day)` : label
}

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { settings, setSettings } = useDaySettings()

  const startOptions = Array.from({ length: 24 }, (_, i) => i)
  const duration = settings.dayEndHour - settings.dayStartHour
  const endOptions = Array.from({ length: 24 }, (_, i) => settings.dayStartHour + i + 1)

  function handleStartChange(value: string) {
    const dayStartHour = Number(value)
    // Keep the same day length, clamped to a max of 24 hours.
    const dayEndHour = dayStartHour + Math.min(duration, 24)
    setSettings({ dayStartHour, dayEndHour })
  }

  function handleEndChange(value: string) {
    setSettings({ ...settings, dayEndHour: Number(value) })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Day settings</DialogTitle>
          <DialogDescription>
            Choose when your day starts and ends. This controls the time grid&apos;s
            visible hours and when tasks roll over to the next day — applied everywhere immediately.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium">Day starts at</span>
            <Select value={String(settings.dayStartHour)} onValueChange={handleStartChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {startOptions.map((hour) => (
                  <SelectItem key={hour} value={String(hour)}>
                    {formatHourLabel(hour)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium">Day ends at</span>
            <Select value={String(settings.dayEndHour)} onValueChange={handleEndChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {endOptions.map((hour) => (
                  <SelectItem key={hour} value={String(hour)}>
                    {endHourLabel(hour)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
