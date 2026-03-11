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
  const dateKeyRef = useRef(dateKey)
  const lastTickMsRef = useRef(Date.now())
  const unsavedMsRef = useRef(0)
  const storedDailySecondsRef = useRef(0)
  const [displaySeconds, setDisplaySeconds] = useState(0)
  const flushPromiseRef = useRef<Promise<void>>(Promise.resolve())
  const isMountedRef = useRef(true)

  const dailyTotalStorageKey = buildDailyTotalKey(dateKey, domain)

  const [storedDailySeconds, setDailyTotalSeconds] = useStorage<number>(
    { key: dailyTotalStorageKey, instance: localAreaStorage },
    0
  )

  const scheduleFlush = useCallback(
    (
      snapshotSeconds: number,
      updateDisplay: boolean,
      snapshotDateKey: string
    ) => {
      if (snapshotSeconds <= 0) return
      flushPromiseRef.current = flushPromiseRef.current
        .catch(() => {})
        .then(async () => {
          await setDailyTotalSeconds((currentValue) => {
            const safeValue = toSafeSeconds(currentValue)
            return safeValue + snapshotSeconds
          })
          if (!updateDisplay) return
          if (dateKeyRef.current !== snapshotDateKey) return
          const subtractMs = Math.min(
            unsavedMsRef.current,
            snapshotSeconds * 1000
          )
          unsavedMsRef.current -= subtractMs
          storedDailySecondsRef.current += snapshotSeconds
          if (isMountedRef.current) {
            setDisplaySeconds(
              storedDailySecondsRef.current +
                Math.floor(unsavedMsRef.current / 1000)
            )
          }
        })
    },
    [setDailyTotalSeconds]
  )

  const queueFlush = useCallback(
    (snapshotSeconds?: number, updateDisplay = true) => {
      const wholeSeconds =
        snapshotSeconds ?? Math.floor(unsavedMsRef.current / 1000)
      scheduleFlush(wholeSeconds, updateDisplay, dateKeyRef.current)
    },
    [scheduleFlush]
  )

  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    const safeStoredSeconds = toSafeSeconds(storedDailySeconds)
    storedDailySecondsRef.current = safeStoredSeconds
    setDisplaySeconds(
      safeStoredSeconds + Math.floor(unsavedMsRef.current / 1000)
    )
  }, [storedDailySeconds])

  useEffect(() => {
    dateKeyRef.current = dateKey
    const onTick = () => {
      const nowMs = Date.now()
      const deltaMs = Math.max(0, nowMs - lastTickMsRef.current)
      lastTickMsRef.current = nowMs

      const nextDateKey = getDateKey(new Date(nowMs))
      if (nextDateKey !== dateKey) {
        const pendingSeconds = Math.floor(unsavedMsRef.current / 1000)
        queueFlush(pendingSeconds, false)
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
        queueFlush()
      }
    }

    const onVisibilityChange = () => {
      if (document.visibilityState !== "visible") {
        queueFlush()
      }
      lastTickMsRef.current = Date.now()
    }

    const onBlur = () => {
      queueFlush()
      lastTickMsRef.current = Date.now()
    }

    const onFocus = () => {
      lastTickMsRef.current = Date.now()
    }

    const onPageHide = () => {
      queueFlush()
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
      const pendingSeconds = Math.floor(unsavedMsRef.current / 1000)
      queueFlush(pendingSeconds, false)
    }
  }, [dateKey, queueFlush])

  return { displaySeconds }
}
