import { chooseAction, type TurnProgress } from '../ai'
import type { DecisionRequest, DecisionResponse } from '../ai/decisionProtocol'
import type { PlayerView } from '../ai/playerView'
import type { Action, AiLevel } from '../engine'

/** Computes the actions of the AI players, possibly away from the interface thread. */
export type AiDecider = {
  decide: (view: PlayerView, level: AiLevel, turn: TurnProgress) => Promise<Action>
  dispose: () => void
}

/** The part of a Web Worker the decider talks to. */
export type DecisionWorker = Pick<Worker, 'postMessage' | 'terminate' | 'addEventListener'>

type PendingDecision = {
  resolve: (action: Action) => void
  reject: (error: Error) => void
}

/** Decides on the calling thread: for the tests, and where Web Workers are not available. */
export function createInlineDecider(): AiDecider {
  return {
    decide: (view, level, turn) => new Promise((resolve) => resolve(chooseAction(view, level, turn))),
    dispose: () => {},
  }
}

function spawnAiWorker(): DecisionWorker {
  return new Worker(new URL('../ai/worker.ts', import.meta.url), { type: 'module' })
}

/** Decides in a Web Worker; disposing it terminates the worker and rejects the decisions still pending. */
export function createWorkerDecider(worker: DecisionWorker = spawnAiWorker()): AiDecider {
  const pending = new Map<number, PendingDecision>()
  let lastId = 0

  const rejectAll = (error: Error) => {
    pending.forEach((decision) => decision.reject(error))
    pending.clear()
  }

  worker.addEventListener('message', (event: MessageEvent<DecisionResponse>) => {
    const response = event.data
    const decision = pending.get(response.id)
    pending.delete(response.id)
    if ('action' in response) {
      decision?.resolve(response.action)
    } else {
      decision?.reject(new Error(response.error))
    }
  })
  worker.addEventListener('error', (event: ErrorEvent) => rejectAll(new Error(event.message)))

  return {
    decide: (view, level, turn) =>
      new Promise((resolve, reject) => {
        lastId += 1
        pending.set(lastId, { resolve, reject })
        const request: DecisionRequest = { id: lastId, view, level, turn }
        worker.postMessage(request)
      }),
    dispose: () => {
      worker.terminate()
      rejectAll(new Error('The AI decider has been disposed'))
    },
  }
}

/** A worker decider where Web Workers exist, an inline one elsewhere. */
export function createAiDecider(): AiDecider {
  return typeof Worker === 'undefined' ? createInlineDecider() : createWorkerDecider()
}
