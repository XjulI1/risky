import { registerSW } from 'virtual:pwa-register'
import type { RegisterServiceWorker } from './updateState'

/** The service worker registration of the production build, or `null` in development and in browsers without service worker. */
export function serviceWorkerRegistration(): RegisterServiceWorker | null {
  return import.meta.env.PROD && 'serviceWorker' in navigator ? registerSW : null
}
