import { useMemo } from "react"

import { resolveDomainFromHostname } from "~lib/config"
import { useSettings } from "~hooks/useSettings"
import { useUiState } from "~hooks/useUiState"

import { NumaTimer } from "./NumaTimer"

export const NumaTimerRoot = () => {
  const domain = useMemo(
    () => resolveDomainFromHostname(window.location.hostname),
    []
  )

  const { settings, isLoading: isSettingsLoading } = useSettings()
  const { uiState, setUiState, isLoading: isUiStateLoading } = useUiState()

  if (isSettingsLoading || isUiStateLoading) return null
  if (!domain || !settings.enabledDomains[domain]) return null

  return (
    <NumaTimer domain={domain} uiState={uiState} setUiState={setUiState} />
  )
}
