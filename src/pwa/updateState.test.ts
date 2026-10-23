import { describe, expect, it, vi } from 'vitest'
import type { RegisterSWOptions } from 'vite-plugin-pwa/types'
import { watchAppUpdate } from './updateState'

function fakeRegistration() {
  const updateServiceWorker = vi.fn(async () => {})
  let options: RegisterSWOptions = {}
  const register = vi.fn((registerOptions: RegisterSWOptions = {}) => {
    options = registerOptions
    return updateServiceWorker
  })
  return { register, updateServiceWorker, options: () => options }
}

describe('watchAppUpdate', () => {
  it('registers the service worker once', () => {
    const registration = fakeRegistration()
    watchAppUpdate(registration.register)
    expect(registration.register).toHaveBeenCalledTimes(1)
  })

  it('has no update ready at first', () => {
    const { updateReady } = watchAppUpdate(fakeRegistration().register)
    expect(updateReady.value).toBe(false)
  })

  it('has an update ready once the new version needs a refresh', () => {
    const registration = fakeRegistration()
    const { updateReady } = watchAppUpdate(registration.register)
    registration.options().onNeedRefresh?.()
    expect(updateReady.value).toBe(true)
  })

  it('has no update ready when the app only became available offline', () => {
    const registration = fakeRegistration()
    const { updateReady } = watchAppUpdate(registration.register)
    registration.options().onOfflineReady?.()
    expect(updateReady.value).toBe(false)
  })

  it('ignores a registration error', () => {
    const registration = fakeRegistration()
    const { updateReady } = watchAppUpdate(registration.register)
    expect(() => registration.options().onRegisterError?.(new Error('blocked'))).not.toThrow()
    expect(updateReady.value).toBe(false)
  })

  it('activates the waiting version and reloads the page when applying the update', async () => {
    const registration = fakeRegistration()
    const { applyUpdate } = watchAppUpdate(registration.register)
    registration.options().onNeedRefresh?.()
    await applyUpdate()
    expect(registration.updateServiceWorker).toHaveBeenCalledWith(true)
  })

  it('never has an update ready without a service worker', async () => {
    const { updateReady, applyUpdate } = watchAppUpdate(null)
    await applyUpdate()
    expect(updateReady.value).toBe(false)
  })
})
