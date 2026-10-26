import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import CapitalLostAlert from './CapitalLostAlert.vue'

describe('CapitalLostAlert', () => {
  it('tells the human which capital fell', async () => {
    const wrapper = mount(CapitalLostAlert, {
      props: {
        player: { id: 'p1', name: 'Alice', color: '#d64541', kind: 'human', isNeutral: false, eliminated: false },
        territory: 'egypt',
        mapId: 'classic',
      },
    })
    expect(wrapper.get('[role="alert"]').text()).toContain('Votre capitale Égypte est tombée')
    expect(wrapper.text()).toContain('Alice')
    await wrapper.get('button').trigger('click')
    expect(wrapper.emitted('dismiss')).toHaveLength(1)
  })
})
