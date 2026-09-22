import { useSyncExternalStore } from 'react'
import { subscribe } from '@/lib/store'

/** Read a value from the mutable UI store and re-render only when it changes. */
export function useStoreValue<T>(get: () => T, server: T): T {
  return useSyncExternalStore(subscribe, get, () => server)
}
