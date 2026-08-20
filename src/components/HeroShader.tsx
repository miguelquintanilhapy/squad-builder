'use client'

import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'motion/react'

const VERTEX_SHADER = `
attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`

// Value noise + fbm clássico, sem cor — smoothstep afinado pra ficar bem esparso (wisps soltos,
// não um blob preenchendo tudo). Saída em --ink (#18212a), alpha máximo de 0.05.
const FRAGMENT_SHADER = `
precision highp float;
uniform float uTime;
uniform vec2 uResolution;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 4; i++) {
    value += amplitude * noise(p);
    p *= 2.0;
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  vec2 p = uv * 2.6;
  float t = uTime * 0.035;
  float n = fbm(p + vec2(t, -t * 0.6));
  n = fbm(p + n * 0.5 + t);
  float alpha = smoothstep(0.45, 0.85, n) * 0.05;
  gl_FragColor = vec4(0.094, 0.129, 0.164, alpha);
}
`

function compileShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type)
  if (!shader) return null
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('[HeroShader] erro ao compilar shader:', gl.getShaderInfoLog(shader))
    gl.deleteShader(shader)
    return null
  }
  return shader
}

/**
 * Fundo animado monocromático (pedido do usuário: "shader") — ruído orgânico fluindo bem devagar
 * em tons de --ink, nunca acima de 5% de opacidade. WebGL puro (sem Three.js/lib — seria
 * dependência nova pra um efeito que cabe em ~80 linhas). Fica dentro da restrição
 * anti-gradiente/glow do projeto: sem cor, sem brilho, só textura em movimento.
 * Renderizado uma única vez no root do app (fixed, atrás de tudo) — cobre a interface inteira,
 * não só o hero (pedido do usuário).
 */
export function HeroShader() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const reduceMotion = useReducedMotion()

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false })
    if (!gl) {
      console.error('[HeroShader] getContext("webgl") retornou null')
      return
    }

    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER)
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER)
    if (!vertexShader || !fragmentShader) return

    const program = gl.createProgram()
    if (!program) return
    gl.attachShader(program, vertexShader)
    gl.attachShader(program, fragmentShader)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('[HeroShader] erro ao linkar programa:', gl.getProgramInfoLog(program))
      return
    }
    gl.useProgram(program)

    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)

    const aPosition = gl.getAttribLocation(program, 'aPosition')
    gl.enableVertexAttribArray(aPosition)
    gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0)

    const uTime = gl.getUniformLocation(program, 'uTime')
    const uResolution = gl.getUniformLocation(program, 'uResolution')

    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    // Arrow functions const, não function declaration — declaração seria hoisted e o TS perde
    // o estreitamento de "canvas"/"gl" não-nulos feito pelos returns antecipados acima.
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      const width = Math.floor(canvas.clientWidth * dpr)
      const height = Math.floor(canvas.clientHeight * dpr)
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
      }
      gl.viewport(0, 0, canvas.width, canvas.height)
    }

    resize()
    window.addEventListener('resize', resize)

    const start = performance.now()
    let frameId = 0

    const render = (now: number) => {
      resize()
      gl.uniform1f(uTime, (now - start) / 1000)
      gl.uniform2f(uResolution, canvas.width, canvas.height)
      gl.clearColor(0, 0, 0, 0)
      gl.clear(gl.COLOR_BUFFER_BIT)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
      if (!reduceMotion) {
        frameId = requestAnimationFrame(render)
      }
    }

    // Sempre desenha ao menos um frame — prefers-reduced-motion só impede o loop, não some com
    // a textura inteira.
    frameId = requestAnimationFrame(render)

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(frameId)
      gl.deleteProgram(program)
      gl.deleteShader(vertexShader)
      gl.deleteShader(fragmentShader)
      gl.deleteBuffer(positionBuffer)
    }
  }, [reduceMotion])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 z-0 h-full w-full pointer-events-none"
    />
  )
}
