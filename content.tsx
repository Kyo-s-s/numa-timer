import type { PlasmoCSConfig } from "plasmo"

import { NumaTimerRoot } from "~components/NumaTimerRoot"

export const config: PlasmoCSConfig = {
  matches: [
    "https://youtube.com/*",
    "https://*.youtube.com/*",
    "https://x.com/*",
    "https://*.x.com/*"
  ]
}

export default NumaTimerRoot
