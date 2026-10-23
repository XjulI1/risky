import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { APP_MANIFEST } from './manifest'

const publicFile = (src: string) => resolve(import.meta.dirname, '../../public', src)

describe('APP_MANIFEST', () => {
  it('names the application Risky, in French', () => {
    expect(APP_MANIFEST.name).toBe('Risky')
    expect(APP_MANIFEST.short_name).toBe('Risky')
    expect(APP_MANIFEST.lang).toBe('fr')
  })

  it('uses relative addresses so that the app installs under a sub-path', () => {
    expect(APP_MANIFEST.id).toBe('./')
    expect(APP_MANIFEST.start_url).toBe('./')
    expect(APP_MANIFEST.scope).toBe('./')
  })

  it('opens standalone, in landscape', () => {
    expect(APP_MANIFEST.display).toBe('standalone')
    expect(APP_MANIFEST.orientation).toBe('landscape')
  })

  it('takes the ocean and ink colors of the interface', () => {
    expect(APP_MANIFEST.background_color).toBe('#163b52')
    expect(APP_MANIFEST.theme_color).toBe('#10161f')
  })

  it('declares 192 and 512 pixel icons, one of them maskable', () => {
    const icons = APP_MANIFEST.icons ?? []
    expect(icons.map((icon) => icon.sizes)).toEqual(expect.arrayContaining(['192x192', '512x512']))
    expect(icons.some((icon) => icon.purpose === 'maskable' && icon.sizes === '512x512')).toBe(true)
  })

  it('only declares icons that exist in the public folder', () => {
    for (const icon of APP_MANIFEST.icons ?? []) {
      expect(existsSync(publicFile(icon.src)), icon.src).toBe(true)
    }
  })
})
