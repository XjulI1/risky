/** One drawing command of an SVG path, in absolute SVG coordinates. */
export type PathCommand =
  | { type: 'M'; x: number; y: number }
  | { type: 'L'; x: number; y: number }
  | { type: 'C'; x1: number; y1: number; x2: number; y2: number; x: number; y: number }

/** A closed outline: a move followed by lines and cubic curves. */
export type SubPath = PathCommand[]

const TOKEN = /[A-Za-z]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g

function unsupported(command: string): Error {
  return new Error(`Unsupported path command "${command}"`)
}

/**
 * Parses the absolute `M`, `L`, `C` and `z` commands used by the map data into closed sub-paths.
 * Any other command throws, so that unexpected data is caught instead of drawn wrongly.
 */
export function parsePathData(d: string): SubPath[] {
  const tokens = d.match(TOKEN) ?? []
  const subPaths: SubPath[] = []
  let current: SubPath = []
  let command = ''
  let index = 0

  const isCommand = (token: string | undefined) => token !== undefined && /^[A-Za-z]$/.test(token)
  const nextNumber = (): number => {
    const token = tokens[index]
    if (token === undefined || isCommand(token)) {
      throw new Error(`Missing coordinate after "${command}"`)
    }
    index += 1
    return Number(token)
  }
  const closeCurrent = () => {
    if (current.length > 0) {
      subPaths.push(current)
      current = []
    }
  }

  while (index < tokens.length) {
    const token = tokens[index] as string
    if (isCommand(token)) {
      command = token
      index += 1
      if (command === 'z' || command === 'Z') {
        closeCurrent()
        continue
      }
      if (command !== 'M' && command !== 'L' && command !== 'C') {
        throw unsupported(command)
      }
    }
    switch (command) {
      case 'M':
        closeCurrent()
        current.push({ type: 'M', x: nextNumber(), y: nextNumber() })
        command = 'L'
        break
      case 'L':
        current.push({ type: 'L', x: nextNumber(), y: nextNumber() })
        break
      case 'C':
        current.push({
          type: 'C',
          x1: nextNumber(),
          y1: nextNumber(),
          x2: nextNumber(),
          y2: nextNumber(),
          x: nextNumber(),
          y: nextNumber(),
        })
        break
      default:
        throw unsupported(command)
    }
  }
  closeCurrent()
  return subPaths
}
