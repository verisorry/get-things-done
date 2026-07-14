import { create } from "zustand"

export interface DevError {
  id: string
  message: string
  timestamp: number
}

interface DevErrorState {
  errors: DevError[]
  report: (message: string) => void
  dismiss: (id: string) => void
  clear: () => void
}

export const useDevErrorStore = create<DevErrorState>()((set) => ({
  errors: [],
  report: (message) =>
    set((state) => ({
      errors: [
        ...state.errors,
        { id: crypto.randomUUID(), message, timestamp: Date.now() },
      ],
    })),
  dismiss: (id) =>
    set((state) => ({ errors: state.errors.filter((e) => e.id !== id) })),
  clear: () => set({ errors: [] }),
}))

function formatArg(arg: unknown): string {
  if (arg instanceof Error) return arg.message
  if (typeof arg === "string") return arg
  try {
    return JSON.stringify(arg)
  } catch {
    return String(arg)
  }
}

let patched = false

/** Patches console.error (dev only) so it also surfaces in the DevErrorOverlay, without changing its console behavior. */
export function patchConsoleErrorForDevOverlay() {
  if (patched || process.env.NODE_ENV !== "development") return
  patched = true

  const originalError = console.error
  console.error = (...args: unknown[]) => {
    originalError(...args)
    useDevErrorStore.getState().report(args.map(formatArg).join(" "))
  }
}
