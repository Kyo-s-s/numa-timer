import { Storage } from "@plasmohq/storage"

export type DomainKey = "youtube" | "x"

export type NumaTimerSettings = {
  enabledDomains: Record<DomainKey, boolean>
}

export const DOMAIN_ORDER: DomainKey[] = ["youtube", "x"]

export const DOMAIN_LABEL: Record<DomainKey, string> = {
  youtube: "YouTube",
  x: "X"
}

export const DEFAULT_SETTINGS: NumaTimerSettings = {
  enabledDomains: {
    youtube: true,
    x: true
  }
}

export const SETTINGS_STORAGE_KEY = "numa-timer:settings:v1"
export const DAILY_TOTAL_STORAGE_PREFIX = "numa-timer:daily-total:v1"

export type NumaTimerUiState = {
  collapsed: Record<DomainKey, boolean>
  // 将来的に size: 'S' | 'M' | 'L' などを追加予定
}

export const UI_STATE_STORAGE_KEY = "numa-timer:ui-state:v1"

export const DEFAULT_UI_STATE: NumaTimerUiState = {
  collapsed: {
    youtube: false,
    x: false
  }
}

export const localAreaStorage = new Storage({ area: "local" })

const pad2 = (value: number) => value.toString().padStart(2, "0")

export const getDateKey = (now = new Date()) =>
  `${now.getFullYear()}-${pad2(now.getMonth() + 1)}-${pad2(now.getDate())}`

export const formatDuration = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.floor(seconds))
  const hours = Math.floor(safeSeconds / 3600)
  const minutes = Math.floor((safeSeconds % 3600) / 60)
  const remain = safeSeconds % 60
  return `${pad2(hours)}:${pad2(minutes)}:${pad2(remain)}`
}

export const resolveDomainFromHostname = (
  hostname: string
): DomainKey | undefined => {
  const target = hostname.toLowerCase()

  if (target === "youtube.com" || target.endsWith(".youtube.com")) {
    return "youtube"
  }

  if (target === "x.com" || target.endsWith(".x.com")) {
    return "x"
  }

  return undefined
}

export const buildDailyTotalKey = (dateKey: string, domain: DomainKey) =>
  `${DAILY_TOTAL_STORAGE_PREFIX}:${dateKey}:${domain}`
