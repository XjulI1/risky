import { Color, ShaderMaterial } from 'three'

const vertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const fragmentShader = `
uniform float uTime;
uniform vec3 uDeep;
uniform vec3 uShallow;
varying vec2 vUv;
void main() {
  vec2 p = vUv * vec2(60.0, 40.0);
  float ripple = sin(p.x + uTime * 0.6) * sin(p.y * 1.3 - uTime * 0.45) + sin((p.x + p.y) * 0.7 + uTime * 0.3);
  float shimmer = smoothstep(0.9, 2.0, ripple) * 0.12;
  float vignette = smoothstep(0.85, 0.3, distance(vUv, vec2(0.5)));
  vec3 color = mix(uDeep, uShallow, vignette) + shimmer;
  gl_FragColor = vec4(color, 1.0);
}
`

/** Unlit ocean material with slowly moving ripples; advance it by setting `uniforms.uTime.value`. */
export function createOceanMaterial(): ShaderMaterial {
  return new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uTime: { value: 0 },
      uDeep: { value: new Color('#1d4e6b') },
      uShallow: { value: new Color('#3f86a6') },
    },
  })
}
