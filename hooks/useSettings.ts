import { useStorage } from "@plasmohq/storage/hook"

import {
  DEFAULT_SETTINGS,
  localAreaStorage,
  SETTINGS_STORAGE_KEY,
  type NumaTimerSettings
} from "~lib/config"
import { deepMerge, type DeepPartial } from "~lib/deepMerge"

export const useSettings = () => {
  const [rawSettings, setStorageSettings, { isLoading }] = useStorage(
    { key: SETTINGS_STORAGE_KEY, instance: localAreaStorage },
    DEFAULT_SETTINGS
  )
  const setSettings = async (
    updater: (current: NumaTimerSettings) => DeepPartial<NumaTimerSettings>
  ) =>
    setStorageSettings((currentValue) => {
      const current = deepMerge(
        DEFAULT_SETTINGS,
        (currentValue ?? {}) as NumaTimerSettings
      )
      return deepMerge(current, updater(current))
    })
  return {
    isLoading,
    setSettings,
    settings: deepMerge(DEFAULT_SETTINGS, (rawSettings ?? {}) as NumaTimerSettings)
  }
}
