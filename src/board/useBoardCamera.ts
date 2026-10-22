import { MOUSE, TOUCH, type PerspectiveCamera } from 'three'
import { MapControls } from 'three/examples/jsm/controls/MapControls.js'
import { cameraPosition, clampTarget, fitDistance, maxZoomDistance } from './cameraFraming'

/** Camera controls of the board: pan and zoom only, bounded to the map. */
export type BoardCamera = {
  controls: MapControls
  recenter: () => void
  updateBounds: () => void
  dispose: () => void
}

function aspectOf(element: HTMLElement): number {
  return element.clientHeight === 0 ? 16 / 9 : element.clientWidth / element.clientHeight
}

/** Sets up map-style controls on `camera`: no rotation, zoom towards the cursor, target kept on the map. */
export function useBoardCamera(camera: PerspectiveCamera, element: HTMLElement): BoardCamera {
  const controls = new MapControls(camera, element)
  controls.enableRotate = false
  controls.screenSpacePanning = false
  controls.zoomToCursor = true
  controls.enableDamping = true
  controls.dampingFactor = 0.12
  controls.mouseButtons = { LEFT: MOUSE.PAN, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.PAN }
  controls.touches = { ONE: TOUCH.PAN, TWO: TOUCH.DOLLY_PAN }
  controls.minDistance = maxZoomDistance()

  const updateBounds = () => {
    controls.maxDistance = fitDistance(aspectOf(element))
  }

  const keepTargetOnMap = () => {
    const clamped = clampTarget({ x: controls.target.x, z: controls.target.z })
    const dx = clamped.x - controls.target.x
    const dz = clamped.z - controls.target.z
    if (dx !== 0 || dz !== 0) {
      controls.target.x += dx
      controls.target.z += dz
      camera.position.x += dx
      camera.position.z += dz
    }
  }

  const recenter = () => {
    updateBounds()
    const position = cameraPosition({ x: 0, z: 0 }, controls.maxDistance)
    controls.target.set(0, 0, 0)
    camera.position.set(position.x, position.y, position.z)
    controls.update()
  }

  controls.addEventListener('change', keepTargetOnMap)
  recenter()

  return {
    controls,
    recenter,
    updateBounds,
    dispose: () => {
      controls.removeEventListener('change', keepTargetOnMap)
      controls.dispose()
    },
  }
}
