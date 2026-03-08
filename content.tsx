import type { PlasmoCSConfig } from "plasmo"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

import { useStorage } from "@plasmohq/storage/hook"

import {
  buildDailyTotalKey,
  DEFAULT_SETTINGS,
  DOMAIN_LABEL,
  formatDuration,
  getDateKey,
  localAreaStorage,
  normalizeSettings,
  resolveDomainFromHostname,
  SETTINGS_STORAGE_KEY,
  type DomainKey
} from "~lib/numa-timer"

const TICK_MS = 1_000
const FLUSH_THRESHOLD_MS = 10_000
const toSafeSeconds = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : 0
const DOMAIN_THEME: Record<
  DomainKey,
  {
    background: string
    border: string
    subText: string
    shadow: string
    toggleBorder: string
    toggleBackground: string
  }
> = {
  youtube: {
    background:
      "linear-gradient(160deg, rgba(69, 10, 10, 0.96) 0%, rgba(127, 29, 29, 0.93) 55%, rgba(40, 10, 10, 0.96) 100%)",
    border: "1px solid rgba(248, 113, 113, 0.6)",
    subText: "#fecaca",
    shadow: "0 10px 30px rgba(127, 29, 29, 0.45)",
    toggleBorder: "1px solid rgba(254, 202, 202, 0.35)",
    toggleBackground: "rgba(127, 29, 29, 0.35)"
  },
  x: {
    background:
      "linear-gradient(160deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.92) 55%, rgba(2, 6, 23, 0.95) 100%)",
    border: "1px solid rgba(148, 163, 184, 0.45)",
    subText: "#dbeafe",
    shadow: "0 10px 30px rgba(2, 6, 23, 0.45)",
    toggleBorder: "1px solid rgba(255, 255, 255, 0.25)",
    toggleBackground: "rgba(0, 0, 0, 0.25)"
  }
}

export const config: PlasmoCSConfig = {
  matches: [
    "https://youtube.com/*",
    "https://*.youtube.com/*",
    "https://x.com/*",
    "https://*.x.com/*"
  ]
}

const NumaTimer = () => {
  const domain = useMemo(
    () => resolveDomainFromHostname(window.location.hostname),
    []
  )

  const [rawSettings] = useStorage(
    { key: SETTINGS_STORAGE_KEY, instance: localAreaStorage },
    DEFAULT_SETTINGS
  )
  const settings = normalizeSettings(rawSettings)
  const isEnabled = domain ? settings.enabledDomains[domain] : false

  const [dateKey, setDateKey] = useState(() => getDateKey())
  const lastTickMsRef = useRef(Date.now())
  const unsavedMsRef = useRef(0)
  const flushInProgressRef = useRef(false)
  const storedDailySecondsRef = useRef(0)
  const [displaySeconds, setDisplaySeconds] = useState(0)
  const [isCollapsed, setIsCollapsed] = useState(false)

  const dailyTotalStorageKey = domain
    ? buildDailyTotalKey(dateKey, domain)
    : "numa-timer:noop"

  const [storedDailySeconds, setDailyTotalSeconds] = useStorage<number>(
    { key: dailyTotalStorageKey, instance: localAreaStorage },
    0
  )

  const flushSeconds = useCallback(async () => {
    if (!domain || flushInProgressRef.current) return

    const wholeSeconds = Math.floor(unsavedMsRef.current / 1000)
    if (wholeSeconds <= 0) return

    flushInProgressRef.current = true

    try {
      await setDailyTotalSeconds((currentValue) => {
        const safeValue = toSafeSeconds(currentValue)
        return safeValue + wholeSeconds
      })
      unsavedMsRef.current -= wholeSeconds * 1000
      storedDailySecondsRef.current += wholeSeconds
      setDisplaySeconds(
        storedDailySecondsRef.current + Math.floor(unsavedMsRef.current / 1000)
      )
    } finally {
      flushInProgressRef.current = false
    }
  }, [domain, setDailyTotalSeconds])

  useEffect(() => {
    const safeStoredSeconds = toSafeSeconds(storedDailySeconds)
    storedDailySecondsRef.current = safeStoredSeconds
    setDisplaySeconds(
      safeStoredSeconds + Math.floor(unsavedMsRef.current / 1000)
    )
  }, [storedDailySeconds])

  useEffect(() => {
    if (!domain) return

    const onTick = () => {
      const nowMs = Date.now()
      const deltaMs = Math.max(0, nowMs - lastTickMsRef.current)
      lastTickMsRef.current = nowMs

      const nextDateKey = getDateKey(new Date(nowMs))
      if (nextDateKey !== dateKey) {
        void flushSeconds()
        unsavedMsRef.current = 0
        storedDailySecondsRef.current = 0
        setDisplaySeconds(0)
        setDateKey(nextDateKey)
        return
      }

      if (!isEnabled) return

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
  }, [dateKey, domain, flushSeconds, isEnabled])

  useEffect(() => {
    if (!isEnabled) {
      void flushSeconds()
    }
  }, [flushSeconds, isEnabled])

  if (!domain || !isEnabled) return null
  const theme = DOMAIN_THEME[domain]

  return (
    <div
      style={{
        position: "fixed",
        top: "12px",
        right: "12px",
        zIndex: 2147483647,
        width: isCollapsed ? "auto" : "280px",
        padding: isCollapsed ? "10px 12px" : "14px 16px",
        borderRadius: "14px",
        background: theme.background,
        color: "#ffffff",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: "13px",
        lineHeight: 1.35,
        border: theme.border,
        boxShadow: theme.shadow
      }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "10px"
        }}>
        <div style={{ fontWeight: 700, letterSpacing: "0.04em" }}>
          Numa Timer · {DOMAIN_LABEL[domain]}
        </div>
        <button
          onClick={() => setIsCollapsed((prev) => !prev)}
          aria-label={
            isCollapsed ? "Expand timer panel" : "Collapse timer panel"
          }
          title={isCollapsed ? "Open" : "Collapse"}
          style={{
            cursor: "pointer",
            border: theme.toggleBorder,
            borderRadius: "8px",
            width: "24px",
            height: "24px",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            background: theme.toggleBackground,
            color: "#fff",
            padding: 0
          }}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              transform: isCollapsed ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 140ms ease-out"
            }}>
            <path
              d="M6 15L12 9L18 15"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {isCollapsed ? (
        <div style={{ marginTop: "6px", fontSize: "18px", fontWeight: 700 }}>
          {formatDuration(displaySeconds)}
        </div>
      ) : (
        <>
          <div
            style={{
              marginTop: "8px",
              fontSize: "14px",
              color: theme.subText
            }}>
            今日 {DOMAIN_LABEL[domain]} で使った時間
          </div>
          <div
            style={{
              marginTop: "8px",
              fontSize: "44px",
              lineHeight: 1.05,
              fontWeight: 800
            }}>
            {formatDuration(displaySeconds)}
          </div>
          <div
            style={{
              marginTop: "8px",
              fontSize: "14px",
              color: theme.subText
            }}>
            この時間はもう戻りません
          </div>
        </>
      )}
    </div>
  )
}

export default NumaTimer
