import { useCallback, useEffect, useRef, useState } from "react"

import { useStorage } from "@plasmohq/storage/hook"

import {
  buildDailyTotalKey,
  getDateKey,
  localAreaStorage,
  type DomainKey
} from "~lib/config"

const TICK_MS = 1_000
const FLUSH_THRESHOLD_MS = 10_000

const toSafeSeconds = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0

export const useTimer = (domain: DomainKey) => {
  const [dateKey, setDateKey] = useState(() => getDateKey())
  const lastTickMsRef = useRef(Date.now())
  const unsavedMsRef = useRef(0)
  const flushInProgressRef = useRef(false)
  const storedDailySecondsRef = useRef(0)
  const [displaySeconds, setDisplaySeconds] = useState(0)

  const dailyTotalStorageKey = buildDailyTotalKey(dateKey, domain)

  const [storedDailySeconds, setDailyTotalSeconds] = useStorage<number>(
    { key: dailyTotalStorageKey, instance: localAreaStorage },
    0
  )

  const flushSeconds = useCallback(async (snapshotSeconds?: number) => {
    if (flushInProgressRef.current) return

    const wholeSeconds =
      snapshotSeconds ?? Math.floor(unsavedMsRef.current / 1000)
    if (wholeSeconds <= 0) return

    flushInProgressRef.current = true

    try {
      await setDailyTotalSeconds((currentValue) => {
        const safeValue = toSafeSeconds(currentValue)
        return safeValue + wholeSeconds
      })
      if (snapshotSeconds === undefined) {
        unsavedMsRef.current -= wholeSeconds * 1000
        storedDailySecondsRef.current += wholeSeconds
        setDisplaySeconds(
          storedDailySecondsRef.current +
            Math.floor(unsavedMsRef.current / 1000)
        )
      }
    } finally {
      flushInProgressRef.current = false
    }
  }, [setDailyTotalSeconds])

  useEffect(() => {
    const safeStoredSeconds = toSafeSeconds(storedDailySeconds)
    storedDailySecondsRef.current = safeStoredSeconds
    setDisplaySeconds(
      safeStoredSeconds + Math.floor(unsavedMsRef.current / 1000)
    )
  }, [storedDailySeconds])

  useEffect(() => {
    const onTick = () => {
      const nowMs = Date.now()
      const deltaMs = Math.max(0, nowMs - lastTickMsRef.current)
      lastTickMsRef.current = nowMs

      const nextDateKey = getDateKey(new Date(nowMs))
      if (nextDateKey !== dateKey) {
        const pendingSeconds = Math.floor(unsavedMsRef.current / 1000)
        void flushSeconds(pendingSeconds)
        unsavedMsRef.current = 0
        storedDailySecondsRef.current = 0
        setDisplaySeconds(0)
        setDateKey(nextDateKey)
        return
      }

      if (document.visibilityState !== "visible" || !document.hasFocus()) {
        return
      }

      unsavedMsRef.current += deltaMs
      setDisplaySeconds(
        storedDailySecondsRef.current + Math.floor(unsavedMsRef.current / 1000)
      )

      if (unsavedMsRef.current >= FLUSH_THRESHOLD_MS) {
        void flushSeconds()
      }
    }

    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        void flushSeconds()
      }
      lastTickMsRef.current = Date.now()
    }

    const onBlur = () => {
      void flushSeconds()
      lastTickMsRef.current = Date.now()
    }

    const onFocus = () => {
      lastTickMsRef.current = Date.now()
    }

    const onPageHide = () => {
      void flushSeconds()
    }

    const tickId = window.setInterval(onTick, TICK_MS)

    document.addEventListener("visibilitychange", onVisibilityChange)
    window.addEventListener("blur", onBlur)
    window.addEventListener("focus", onFocus)
    window.addEventListener("pagehide", onPageHide)
    window.addEventListener("beforeunload", onPageHide)

    return () => {
      window.clearInterval(tickId)
      document.removeEventListener("visibilitychange", onVisibilityChange)
      window.removeEventListener("blur", onBlur)
      window.removeEventListener("focus", onFocus)
      window.removeEventListener("pagehide", onPageHide)
      window.removeEventListener("beforeunload", onPageHide)
      void flushSeconds()
    }
  }, [dateKey, flushSeconds])

  return { displaySeconds }
}
