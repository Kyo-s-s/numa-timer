import { useStorage } from "@plasmohq/storage/hook"

import {
  DEFAULT_UI_STATE,
  localAreaStorage,
  UI_STATE_STORAGE_KEY,
  type NumaTimerUiState
} from "~lib/config"
import { deepMerge, type DeepPartial } from "~lib/deepMerge"

export const useUiState = () => {
  const [rawUiState, setStorageUiState, { isLoading }] = useStorage(
    { key: UI_STATE_STORAGE_KEY, instance: localAreaStorage },
    DEFAULT_UI_STATE
  )
  const setUiState = async (
    updater: (current: NumaTimerUiState) => DeepPartial<NumaTimerUiState>
  ) =>
    setStorageUiState((currentValue) => {
      const current = deepMerge(
        DEFAULT_UI_STATE,
        (currentValue ?? {}) as NumaTimerUiState
      )
      return deepMerge(current, updater(current))
    })
  return {
    isLoading,
    setUiState,
    uiState: deepMerge(DEFAULT_UI_STATE, (rawUiState ?? {}) as NumaTimerUiState)
  }
}
