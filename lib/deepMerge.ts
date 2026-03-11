export type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Record<string, unknown>
    ? DeepPartial<T[K]>
    : T[K]
}

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

export const deepMerge = <T extends Record<string, unknown>>(
  base: T,
  override: DeepPartial<T>
): T => {
  if (!isPlainObject(override)) {
    return base
  }
  const result: Record<string, unknown> = { ...base }
  for (const [key, value] of Object.entries(override)) {
    const baseValue = result[key]
    if (isPlainObject(value) && isPlainObject(baseValue)) {
      result[key] = deepMerge(
        baseValue as Record<string, unknown>,
        value as Record<string, unknown>
      )
    } else if (isPlainObject(baseValue) && !isPlainObject(value)) {
      continue
    } else {
      result[key] = value
    }
  }
  return result as T
}
