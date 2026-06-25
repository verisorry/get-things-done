"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError("Invalid email or password")
      setLoading(false)
      return
    }

    router.replace("/")
    router.refresh()
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F2F2F7] dark:bg-[#1c1c1e]">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-[0_1px_3px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.06)] dark:bg-[#2c2c2e]">
        <div className="mb-4 flex items-center gap-3">
          <Image src="/logo.png" alt="GTD" width={40} height={40} className="rounded-[10px]" />
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Get Things Done</h1>
            <p className="text-sm text-muted-foreground">Sign in to continue</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="mb-1 block text-xs font-medium text-muted-foreground">
              Email
            </label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-xs font-medium text-muted-foreground">
              Password
            </label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <p className="text-sm text-red-500">{error}</p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>

        <div className="mt-6 border-t pt-4 space-y-3">
          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={() => router.push("/?demo=true")}
          >
            Try demo mode
          </Button>
          <p className="text-center text-xs text-muted-foreground/70 leading-relaxed">
            Want access?{" "}
            <a href="mailto:fang.silvia2026@gmail.com" className="underline underline-offset-2 hover:text-muted-foreground">
              Email fang.silvia2026@gmail.com
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
