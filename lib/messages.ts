const REMINDER_MESSAGES = [
  "この時間はもう戻りません",
  "今日の時間は有限です",
  "いまの使い方で未来が決まる",
  "今この瞬間も、過去に変わっています",
  "一度きりの今日を大切に",
] as const

export const pickReminderMessage = () =>
  REMINDER_MESSAGES[Math.floor(Math.random() * REMINDER_MESSAGES.length)]
