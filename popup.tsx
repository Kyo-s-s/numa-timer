import type { CSSProperties } from "react"

import { useStorage } from "@plasmohq/storage/hook"

import {
  DEFAULT_SETTINGS,
  DOMAIN_LABEL,
  DOMAIN_ORDER,
  localAreaStorage,
  normalizeSettings,
  SETTINGS_STORAGE_KEY,
  type DomainKey
} from "~lib/numa-timer"

const panelStyle: CSSProperties = {
  padding: "16px",
  width: "260px",
  fontFamily:
    "ui-sans-serif, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif",
  color: "#111827",
  background: "#f8fafc"
}

const rowStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  marginTop: "10px",
  padding: "10px 12px",
  borderRadius: "10px",
  background: "#ffffff",
  border: "1px solid #e5e7eb"
}

function IndexPopup() {
  const [settings, setSettings, { isLoading }] = useStorage(
    { key: SETTINGS_STORAGE_KEY, instance: localAreaStorage },
    DEFAULT_SETTINGS
  )

  const normalized = normalizeSettings(settings)

  const onToggle = async (domain: DomainKey) => {
    await setSettings((currentSettings) => {
      const baseSettings = normalizeSettings(currentSettings)
      return {
        enabledDomains: {
          ...baseSettings.enabledDomains,
          [domain]: !baseSettings.enabledDomains[domain]
        }
      }
    })
  }

  return (
    <div style={panelStyle}>
      <div style={{ fontSize: "16px", fontWeight: 700 }}>Numa Timer</div>
      <div style={{ marginTop: "4px", fontSize: "12px", color: "#4b5563" }}>
        Timer ON/OFF by domain
      </div>

      {DOMAIN_ORDER.map((domain) => (
        <label key={domain} style={rowStyle}>
          <span style={{ fontSize: "14px", fontWeight: 600 }}>
            {DOMAIN_LABEL[domain]}
          </span>
          <input
            type="checkbox"
            checked={normalized.enabledDomains[domain]}
            onChange={() => void onToggle(domain)}
            disabled={isLoading}
            aria-label={`${DOMAIN_LABEL[domain]} timer switch`}
          />
        </label>
      ))}
    </div>
  )
}

export default IndexPopup
