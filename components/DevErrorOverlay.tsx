"use client"

import { useEffect } from "react"
import { X } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  patchConsoleErrorForDevOverlay,
  useDevErrorStore,
} from "@/lib/dev-error-store"

export function DevErrorOverlay() {
  const errors = useDevErrorStore((state) => state.errors)
  const dismiss = useDevErrorStore((state) => state.dismiss)
  const clear = useDevErrorStore((state) => state.clear)

  useEffect(() => {
    patchConsoleErrorForDevOverlay()
  }, [])

  if (process.env.NODE_ENV !== "development" || errors.length === 0) {
    return null
  }

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2">
      {errors.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          className="self-end text-xs text-muted-foreground"
          onClick={clear}
        >
          Clear all ({errors.length})
        </Button>
      )}
      {errors.map((error) => (
        <Alert
          key={error.id}
          variant="destructive"
          className="border-[#FF3B30]/30 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.06)] dark:bg-card"
        >
          <AlertTitle className="flex items-start justify-between gap-2 pr-1">
            <span>Dev error</span>
            <button
              onClick={() => dismiss(error.id)}
              aria-label="Dismiss"
              className="shrink-0 text-muted-foreground hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          </AlertTitle>
          <AlertDescription className="break-words font-mono text-xs">
            {error.message}
          </AlertDescription>
        </Alert>
      ))}
    </div>
  )
}
