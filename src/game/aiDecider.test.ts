import { describe, expect, it } from 'vitest'
import { chooseAction, NEW_TURN } from '../ai'
import type { DecisionRequest, DecisionResponse } from '../ai/decisionProtocol'
import { playerView } from '../ai/playerView'
import { newAiGame } from '../ai/testScenarios'
import { createAiDecider, createInlineDecider, createWorkerDecider, type DecisionWorker } from './aiDecider'

class FakeWorker implements DecisionWorker {
  requests: DecisionRequest[] = []
  terminated = false
  private readonly listeners = new Map<string, ((event: Event) => void)[]>()

  addEventListener(type: string, listener: EventListenerOrEventListenerObject | null): void {
    if (typeof listener === 'function') {
      this.listeners.set(type, [...(this.listeners.get(type) ?? []), listener])
    }
  }

  postMessage(message: unknown): void {
    this.requests.push(message as DecisionRequest)
  }

  terminate(): void {
    this.terminated = true
  }

  respond(response: DecisionResponse): void {
    this.listeners.get('message')?.forEach((listener) => listener(new MessageEvent('message', { data: response })))
  }
}

const game = newAiGame(['hard', 'hard', 'hard'], 5)
const view = playerView(game, game.players[game.currentPlayerIndex]?.id ?? '')
const deploy = { type: 'deploy', playerId: 'p1', territory: 'alaska', armies: 3 } as const
const endAttack = { type: 'endAttack', playerId: 'p1' } as const

describe('createInlineDecider', () => {
  it('decides like chooseAction', async () => {
    await expect(createInlineDecider().decide(view, 'hard', NEW_TURN)).resolves.toEqual(chooseAction(view, 'hard', NEW_TURN))
  })
})

describe('createWorkerDecider', () => {
  it('sends the view, the level and the progress of the turn to the worker', () => {
    const worker = new FakeWorker()
    void createWorkerDecider(worker).decide(view, 'expert', NEW_TURN)
    expect(worker.requests).toEqual([{ id: 1, view, level: 'expert', turn: NEW_TURN }])
  })

  it('matches each answer with its request, whatever their order', async () => {
    const worker = new FakeWorker()
    const decider = createWorkerDecider(worker)
    const first = decider.decide(view, 'hard', NEW_TURN)
    const second = decider.decide(view, 'hard', NEW_TURN)
    worker.respond({ id: 2, action: endAttack })
    worker.respond({ id: 1, action: deploy })
    await expect(first).resolves.toEqual(deploy)
    await expect(second).resolves.toEqual(endAttack)
  })

  it('rejects a decision the worker could not make', async () => {
    const worker = new FakeWorker()
    const decision = createWorkerDecider(worker).decide(view, 'hard', NEW_TURN)
    worker.respond({ id: 1, error: 'No action is possible once the game is over' })
    await expect(decision).rejects.toThrow('No action is possible once the game is over')
  })

  it('terminates the worker and rejects the pending decisions when disposed', async () => {
    const worker = new FakeWorker()
    const decider = createWorkerDecider(worker)
    const decision = decider.decide(view, 'hard', NEW_TURN)
    decider.dispose()
    expect(worker.terminated).toBe(true)
    await expect(decision).rejects.toThrow()
  })
})

describe('createAiDecider', () => {
  it('decides on the calling thread where Web Workers do not exist', async () => {
    expect(typeof Worker).toBe('undefined')
    await expect(createAiDecider().decide(view, 'normal', NEW_TURN)).resolves.toEqual(chooseAction(view, 'normal', NEW_TURN))
  })
})
