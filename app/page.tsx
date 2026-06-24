"use client"

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import { addDays, format, isToday, subDays } from "date-fns"
import { TopBar } from "@/components/TopBar"
import { DayPanel } from "@/components/day/DayPanel"

const BUFFER = 7

function makeDates(center: Date, back: number, forward: number) {
  return Array.from(
    { length: back + forward + 1 },
    (_, i) => addDays(center, i - back)
  )
}

export default function Home() {
  const [dates, setDates] = useState(() =>
    makeDates(new Date(), BUFFER, BUFFER)
  )
  const [currentDate, setCurrentDate] = useState(() =>
    format(new Date(), "yyyy-MM-dd")
  )

  const scrollRef = useRef<HTMLDivElement>(null)
  const todayRef = useRef<HTMLDivElement>(null)
  const startRef = useRef<HTMLDivElement>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const prevWidthRef = useRef(0)
  const isPrependingRef = useRef(false)

  useEffect(() => {
    todayRef.current?.scrollIntoView({ behavior: "instant", inline: "center" })
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    const observer = new ResizeObserver(() => {
      todayRef.current?.scrollIntoView({ behavior: "instant", inline: "center" })
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useLayoutEffect(() => {
    if (isPrependingRef.current && scrollRef.current) {
      scrollRef.current.scrollLeft +=
        scrollRef.current.scrollWidth - prevWidthRef.current
      isPrependingRef.current = false
    }
  }, [dates])

  useEffect(() => {
    const scrollEl = scrollRef.current
    const startEl = startRef.current
    const endEl = endRef.current
    if (!scrollEl || !startEl || !endEl) return

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          if (entry.target === startEl) {
            prevWidthRef.current = scrollEl.scrollWidth
            isPrependingRef.current = true
            setDates((prev) => {
              const batch = Array.from({ length: BUFFER }, (_, i) =>
                subDays(prev[0], BUFFER - i)
              )
              return [...batch, ...prev]
            })
          } else if (entry.target === endEl) {
            setDates((prev) => {
              const batch = Array.from({ length: BUFFER }, (_, i) =>
                addDays(prev[prev.length - 1], i + 1)
              )
              return [...prev, ...batch]
            })
          }
        }
      },
      { root: scrollEl, rootMargin: "200px" }
    )

    observer.observe(startEl)
    observer.observe(endEl)
    return () => observer.disconnect()
  }, [])

  const handleScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const cx = el.scrollLeft + el.clientWidth / 2
    for (const panel of el.querySelectorAll<HTMLElement>("[data-date]")) {
      if (cx >= panel.offsetLeft && cx <= panel.offsetLeft + panel.offsetWidth) {
        if (panel.dataset.date) setCurrentDate(panel.dataset.date)
        break
      }
    }
  }, [])

  const scrollToToday = useCallback(() => {
    todayRef.current?.scrollIntoView({ behavior: "smooth", inline: "center" })
  }, [])


  return (
    <div className="flex h-full flex-col">
      <TopBar currentDate={currentDate} onTodayClick={scrollToToday} />

      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex flex-1 gap-3 overflow-x-auto overflow-y-hidden p-3 pt-0"
      >
        <div ref={startRef} className="h-full w-px shrink-0" />

        {dates.map((date) => {
          const key = format(date, "yyyy-MM-dd")
          const isTodayDate = isToday(date)
          return (
            <DayPanel
              key={key}
              ref={isTodayDate ? todayRef : undefined}
              date={key}
              isToday={isTodayDate}
            />
          )
        })}

        <div ref={endRef} className="h-full w-px shrink-0" />
      </div>
    </div>
  )
}
