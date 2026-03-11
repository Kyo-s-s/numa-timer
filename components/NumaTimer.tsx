import { useCallback, useRef } from "react"

import {
  DOMAIN_LABEL,
  formatDuration,
  type DomainKey,
  type NumaTimerUiState
} from "~lib/config"
import { pickReminderMessage } from "~lib/messages"
import { useTimer } from "~hooks/useTimer"
import type { DeepPartial } from "~lib/deepMerge"

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


export const NumaTimer = ({
  domain,
  uiState,
  setUiState
}: {
  domain: DomainKey
  uiState: NumaTimerUiState
  setUiState: (
    updater: (current: NumaTimerUiState) => DeepPartial<NumaTimerUiState>
  ) => Promise<void>
}) => {
  const { displaySeconds } = useTimer(domain)
  const theme = DOMAIN_THEME[domain]
  const isCollapsed = uiState.collapsed[domain]
  const reminderMessageRef = useRef(pickReminderMessage())

  const handleToggleCollapsed = useCallback(() => {
    void setUiState((prev) => ({
      collapsed: {
        [domain]: !prev.collapsed[domain]
      }
    }))
  }, [domain, setUiState])

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
          onClick={handleToggleCollapsed}
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
            {reminderMessageRef.current}
          </div>
        </>
      )}
    </div>
  )
}
