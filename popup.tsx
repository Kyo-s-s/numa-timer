import type { CSSProperties } from "react"

import {
  DOMAIN_LABEL,
  DOMAIN_ORDER,
  type DomainKey
} from "~lib/config"
import { useSettings } from "~hooks/useSettings"

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
  const { settings, setSettings, isLoading } = useSettings()

  const onToggle = async (domain: DomainKey) => {
    await setSettings((currentSettings) => {
      return {
        enabledDomains: {
          [domain]: !currentSettings.enabledDomains[domain]
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
            checked={settings.enabledDomains[domain]}
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
