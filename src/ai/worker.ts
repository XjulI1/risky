import type { DecisionRequest, DecisionResponse } from './decisionProtocol'
import { chooseAction } from './index'

function decide({ id, view, level, turn }: DecisionRequest): DecisionResponse {
  try {
    return { id, action: chooseAction(view, level, turn) }
  } catch (error) {
    return { id, error: error instanceof Error ? error.message : String(error) }
  }
}

self.addEventListener('message', (event: MessageEvent<DecisionRequest>) => {
  self.postMessage(decide(event.data))
})
