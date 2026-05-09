/**
 * Settings storage access helpers (issue #5: cross-device config sync).
 *
 * Settings live in chrome.storage.sync as of the cross-device sync change.
 * Legacy v1.0.5 installs may still have the record in chrome.storage.local
 * until first read migrates it (see chrome-sync-storage-adapter.ts).
 *
 * Use these helpers from any non-Zustand caller (notifications, content
 * script, sidepanel, etc.) so we don't accidentally split-brain by writing
 * to local while Zustand writes to sync.
 */

export const SETTINGS_KEY = 'settings-storage'

export interface SettingsRecord {
  state: { settings: Record<string, unknown> }
  version?: number
}

/** Promise read of raw JSON string: sync first, legacy local fallback. */
export async function getSettingsRaw(): Promise<string | null> {
  const sync = await chrome.storage.sync.get(SETTINGS_KEY)
  const syncValue = sync[SETTINGS_KEY]
  if (typeof syncValue === 'string' && syncValue.length > 0) return syncValue
  const local = await chrome.storage.local.get(SETTINGS_KEY)
  const localValue = local[SETTINGS_KEY]
  return typeof localValue === 'string' && localValue.length > 0 ? localValue : null
}

/** Promise read of full Zustand record. Returns null if absent or malformed. */
export async function getSettingsRecord(): Promise<SettingsRecord | null> {
  const raw = await getSettingsRaw()
  if (!raw) return null
  try {
    return JSON.parse(raw) as SettingsRecord
  } catch {
    return null
  }
}

/** Promise read of just the settings object. */
export async function getSettings<T = Record<string, unknown>>(): Promise<T | null> {
  const record = await getSettingsRecord()
  return (record?.state?.settings as T | undefined) ?? null
}

/** Replace the whole record in sync storage. */
export async function setSettingsRecord(record: SettingsRecord): Promise<void> {
  await chrome.storage.sync.set({ [SETTINGS_KEY]: JSON.stringify(record) })
}

/**
 * Read-modify-write a settings patch into sync storage.
 * Concurrency note: read+write is not atomic. Same caveat as the previous
 * local-storage RMW callers (see notification-helpers.ts:182).
 */
export async function patchSettings(patch: Record<string, unknown>): Promise<void> {
  const current = await getSettingsRecord()
  const next: SettingsRecord = current ?? { state: { settings: {} }, version: 0 }
  if (!next.state) next.state = { settings: {} }
  if (!next.state.settings) next.state.settings = {}
  next.state.settings = { ...next.state.settings, ...patch }
  await setSettingsRecord(next)
}
