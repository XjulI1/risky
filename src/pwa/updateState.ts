import { readonly, ref, type Ref } from 'vue'
import type { RegisterSWOptions } from 'vite-plugin-pwa/types'

/** Registers the service worker and returns the function that activates a waiting version. */
export type RegisterServiceWorker = (options: RegisterSWOptions) => (reloadPage?: boolean) => Promise<void>

/** Whether a new version of the app is waiting, and how to switch to it. */
export type AppUpdate = {
  updateReady: Readonly<Ref<boolean>>
  applyUpdate: () => Promise<void>
}

/**
 * Registers the service worker, if any, and tracks when a new version is ready.
 * @param register the registration function, or `null` when the app runs without service worker.
 */
export function watchAppUpdate(register: RegisterServiceWorker | null): AppUpdate {
  const updateReady = ref(false)
  const updateServiceWorker =
    register?.({
      onNeedRefresh: () => {
        updateReady.value = true
      },
      onRegisterError: () => {},
    }) ?? null

  return {
    updateReady: readonly(updateReady),
    applyUpdate: async () => {
      await updateServiceWorker?.(true)
    },
  }
}
