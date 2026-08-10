'use client'

import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { ORB_STATES } from '@/types/orb'
import type { OrbCanvasProps, OrbPalette, OrbSettings, OrbState } from '@/types/orb'
import { DEFAULT_ORB_SETTINGS } from './orbSettings'
import styles from './OrbCanvas.module.css'

const PALETTE_KEYS: readonly (keyof OrbPalette)[] = [
  'cyan',
  'blue',
  'pink',
  'violet',
  'cream',
  'mint',
  'core',
]

/* Hex → 0–1 RGB without THREE.Color, so no color-management conversion is
   applied and the shader receives the exact values shown in the pickers */
function setVec3FromHex(v: THREE.Vector3, hex: string) {
  const n = parseInt(hex.replace('#', ''), 16)
  v.set(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255)
}

/* Resolution of the offscreen bloom copy — tiny on purpose: it gets blurred
   and stretched anyway, and a small buffer keeps the per-frame copy cheap */
const BLOOM_RES = 64
/* The bloom element spans 140% of the mount (see .bloom in the CSS), so a
   transform scale of 1/1.4 makes the copy exactly overlay the orb */
const BLOOM_BOX = 1.4

/* Ashima Arts 3D simplex noise (webgl-noise, MIT) — shared by both shaders */
const NOISE_GLSL = /* glsl */ `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
      i.z + vec4(0.0, i1.z, i2.z, 1.0))
      + i.y + vec4(0.0, i1.y, i2.y, 1.0))
      + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
}
`

const ORB_VERTEX = /* glsl */ `
uniform float uTime;
uniform float uDisplace;

varying vec3 vNormal;
varying vec3 vView;
varying vec3 vPos;

${NOISE_GLSL}

void main() {
  vPos = position;

  /* uDisplace already covers the full displace → maxDisplace voice range,
     computed in the render loop — no extra amplitude term here */
  float n = snoise(normalize(position) * 1.6 + vec3(0.0, uTime * 0.35, uTime * 0.18));
  vec3 displaced = position + normal * n * uDisplace;

  vec4 mv = modelViewMatrix * vec4(displaced, 1.0);
  vNormal = normalize(normalMatrix * normal);
  vView = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}
`

const ORB_FRAGMENT = /* glsl */ `
uniform float uFlowTime;
uniform float uActivity;
uniform float uGlow;
uniform float uAmplitude;
uniform vec3 uTint;
uniform vec3 uCyan;
uniform vec3 uBlue;
uniform vec3 uPink;
uniform vec3 uViolet;
uniform vec3 uCream;
uniform vec3 uMint;
uniform vec3 uCore;

varying vec3 vNormal;
varying vec3 vView;
varying vec3 vPos;

${NOISE_GLSL}

void main() {
  vec3 n = normalize(vNormal);
  vec3 v = normalize(vView);
  float facing = clamp(dot(n, v), 0.0, 1.0);
  float fresnel = pow(1.0 - facing, 2.0);

  /* uFlowTime is integrated on the CPU (flow += dt * speed), so Activity
     changes ramp the swirl speed smoothly — multiplying absolute time by a
     varying speed would fast-forward the pattern on every state change */
  float t = uFlowTime;
  vec3 p = normalize(vPos);

  /* Anisotropic sampling stretches the noise into broad horizontal bands */
  float n1 = snoise(vec3(p.x * 1.1, p.y * 2.4, p.z * 1.1) + vec3(t * 0.26, t * 0.19, -t * 0.12));
  float n2 = snoise(vec3(p.x * 2.0, p.y * 3.2, p.z * 2.0) - vec3(t * 0.14, -t * 0.22, t * 0.18));
  float band = sin(p.y * 3.0 + n1 * 2.6 + t * 0.6);

  /* 0 at the top of the orb → 1 at the bottom */
  float vertical = smoothstep(0.9, -0.9, p.y);

  vec3 col = mix(uCyan, uBlue, smoothstep(-0.7, 0.8, n1));
  col = mix(col, uViolet, smoothstep(0.25, 1.0, n2) * 0.55);
  col = mix(col, uPink, clamp(vertical * 0.7 + smoothstep(0.2, 0.95, band) * 0.35, 0.0, 1.0));
  col = mix(col, uCream, smoothstep(0.5, 1.0, -n1) * vertical * 0.3);

  /* Bright, washed-out core */
  col = mix(col, uCore, smoothstep(0.45, 1.0, facing) * 0.55);

  /* Mint rim glow */
  col = mix(col, uMint, fresnel * 0.8);

  /* State accent + brightness */
  col = mix(col, uTint, 0.18 * uActivity);
  col *= 0.85 + uGlow * 0.35 + uAmplitude * 0.25;

  /* Soft edge falloff — the orb dissolves at the limb instead of a hard rim */
  float alpha = smoothstep(0.02, 0.38, facing) * 0.95;

  gl_FragColor = vec4(col, alpha);
}
`


export function OrbCanvas({
  state,
  analyserRef,
  playbackAnalyserRef,
  speechLevelRef,
  settings = DEFAULT_ORB_SETTINGS,
  className,
}: OrbCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const bloomRef = useRef<HTMLCanvasElement>(null)
  const [webglFailed, setWebglFailed] = useState(false)

  // Keep state and settings readable inside the RAF loop without restarts
  const stateRef = useRef<OrbState>(state)
  stateRef.current = state
  const settingsRef = useRef<OrbSettings>(settings)
  settingsRef.current = settings

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    // ── Scene ──────────────────────────────────────────────────────────────────
    const scene = new THREE.Scene()

    const camera = new THREE.PerspectiveCamera(
      50,
      mount.clientWidth / mount.clientHeight,
      0.1,
      100,
    )
    camera.position.z = 3

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch {
      // WebGL unavailable — the CSS gradient fallback renders instead
      setWebglFailed(true)
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    mount.appendChild(renderer.domElement)

    // Bloom = a live blurred copy of the rendered orb, so the glow always
    // matches what's actually on screen instead of approximating the palette
    const bloomCanvas = bloomRef.current
    let bloomCtx: CanvasRenderingContext2D | null = null
    if (bloomCanvas) {
      bloomCanvas.width = BLOOM_RES
      bloomCanvas.height = BLOOM_RES
      bloomCtx = bloomCanvas.getContext('2d')
    }

    // ── Orb ────────────────────────────────────────────────────────────────────
    const initial = settingsRef.current.states[stateRef.current]
    const orbUniforms = {
      uTime: { value: 0 },
      uFlowTime: { value: 0 },
      uActivity: { value: initial.activity },
      uGlow: { value: initial.glow },
      uDisplace: { value: initial.displace },
      uAmplitude: { value: 0 },
      uTint: { value: new THREE.Vector3() },
      uCyan: { value: new THREE.Vector3() },
      uBlue: { value: new THREE.Vector3() },
      uPink: { value: new THREE.Vector3() },
      uViolet: { value: new THREE.Vector3() },
      uCream: { value: new THREE.Vector3() },
      uMint: { value: new THREE.Vector3() },
      uCore: { value: new THREE.Vector3() },
    }

    const orbGeometry = new THREE.SphereGeometry(1, 128, 128)
    const orbMaterial = new THREE.ShaderMaterial({
      vertexShader: ORB_VERTEX,
      fragmentShader: ORB_FRAGMENT,
      uniforms: orbUniforms,
      transparent: true,
    })
    const orb = new THREE.Mesh(orbGeometry, orbMaterial)

    // Group so scale changes apply to the whole orb in one call
    const orbGroup = new THREE.Group()
    orbGroup.add(orb)
    scene.add(orbGroup)

    // ── Settings → color targets — re-parsed only when settings change. The
    // palette is per-state: the render loop lerps the live uniforms toward the
    // active state's targets, so colors cross-fade on state changes just like
    // the animation params do.
    const paletteUniformFor: Record<keyof OrbPalette, { value: THREE.Vector3 }> = {
      cyan: orbUniforms.uCyan,
      blue: orbUniforms.uBlue,
      pink: orbUniforms.uPink,
      violet: orbUniforms.uViolet,
      cream: orbUniforms.uCream,
      mint: orbUniforms.uMint,
      core: orbUniforms.uCore,
    }
    const tintTargets = {} as Record<OrbState, THREE.Vector3>
    const paletteTargets = {} as Record<OrbState, Record<keyof OrbPalette, THREE.Vector3>>
    for (const st of ORB_STATES) {
      tintTargets[st] = new THREE.Vector3()
      paletteTargets[st] = {} as Record<keyof OrbPalette, THREE.Vector3>
      for (const key of PALETTE_KEYS) paletteTargets[st][key] = new THREE.Vector3()
    }
    let appliedSettings: OrbSettings | null = null

    const applySettings = (s: OrbSettings) => {
      for (const st of ORB_STATES) {
        const stateDef = s.states[st]
        setVec3FromHex(tintTargets[st], stateDef.tint)
        for (const key of PALETTE_KEYS) {
          setVec3FromHex(paletteTargets[st][key], stateDef.palette[key])
        }
      }
      appliedSettings = s
    }
    applySettings(settingsRef.current)
    orbUniforms.uTint.value.copy(tintTargets[stateRef.current])
    for (const key of PALETTE_KEYS) {
      paletteUniformFor[key].value.copy(paletteTargets[stateRef.current][key])
    }

    // ── Audio data buffer — allocated lazily, reused each frame ────────────────
    let freqData: Uint8Array<ArrayBuffer> | null = null

    // ── Render loop ────────────────────────────────────────────────────────────
    const clock = new THREE.Clock()
    let rafId: number

    // Scale is smoothed independently from amplitude so state transitions and
    // voice pulses both feel organic rather than snappy or mechanical.
    let currentScale = settingsRef.current.states[stateRef.current].baseScale
    let bloomLevel = settingsRef.current.states[stateRef.current].bloom
    let lastElapsed = 0

    const tick = () => {
      rafId = requestAnimationFrame(tick)

      const elapsed = clock.getElapsedTime()
      const dt = Math.min(elapsed - lastElapsed, 0.1)
      lastElapsed = elapsed
      const s = settingsRef.current
      if (s !== appliedSettings) applySettings(s)
      const params = s.states[stateRef.current]
      // How fast the orb morphs between states — tunable via settings
      const ease = s.transition ?? 0.05

      // Live amplitude: real mic data while listening; while replying, the
      // TTS playback analyser (real generated voice), or per-word speech
      // impulses from the speechSynthesis fallback, or a generic synthetic
      // pulse when nothing is wired up (e.g. the lab page).
      let targetAmplitude = 0
      const playbackAnalyser =
        stateRef.current === 'replying' ? (playbackAnalyserRef?.current ?? null) : null
      const activeAnalyser = analyserRef?.current ?? playbackAnalyser
      if (activeAnalyser) {
        if (!freqData || freqData.length !== activeAnalyser.frequencyBinCount) {
          freqData = new Uint8Array(activeAnalyser.frequencyBinCount)
        }
        activeAnalyser.getByteFrequencyData(freqData)
        let sum = 0
        for (let i = 0; i < freqData.length; i++) sum += freqData[i]
        targetAmplitude = sum / freqData.length / 255
        // Playback spectra average lower than mic input — lift into the same range
        if (activeAnalyser === playbackAnalyser) {
          targetAmplitude = Math.min(1, targetAmplitude * 1.8)
        }
      } else if (stateRef.current === 'replying') {
        if (speechLevelRef) {
          targetAmplitude = speechLevelRef.current
          speechLevelRef.current *= 0.94
        } else {
          targetAmplitude =
            (0.5 + 0.5 * Math.sin(elapsed * 4.2)) *
            (0.6 + 0.4 * Math.sin(elapsed * 1.3)) *
            0.55
        }
      }

      const u = orbUniforms
      u.uTime.value = elapsed
      // First smoothing pass on raw amplitude — snappy enough to follow speech
      u.uAmplitude.value += (targetAmplitude - u.uAmplitude.value) * 0.12
      u.uActivity.value += (params.activity - u.uActivity.value) * ease
      // Integrated swirl clock: the current (smoothed) activity sets the speed
      // each frame, so state changes accelerate/decelerate the flow instead of
      // teleporting the pattern
      u.uFlowTime.value += dt * (0.25 + u.uActivity.value * 0.9)
      // Glow rises from the state's base value toward maxGlow with voice
      // amplitude — the bloom brightens with it since its opacity tracks uGlow
      const targetGlow =
        params.glow + u.uAmplitude.value * (params.maxGlow - params.glow)
      u.uGlow.value += (targetGlow - u.uGlow.value) * Math.max(ease, 0.08)
      const targetDisplace =
        params.displace + u.uAmplitude.value * (params.maxDisplace - params.displace)
      u.uDisplace.value += (targetDisplace - u.uDisplace.value) * Math.max(ease, 0.08)
      u.uTint.value.lerp(tintTargets[stateRef.current], ease)
      for (const key of PALETTE_KEYS) {
        paletteUniformFor[key].value.lerp(paletteTargets[stateRef.current][key], ease)
      }

      // Scale: base size for the current state, expanded by amplitude within
      // the state's [baseScale, maxScale] window, plus a tiny idle breathe.
      const breatheOffset = Math.sin(elapsed * 1.1) * 0.012
      const targetScale =
        params.baseScale +
        u.uAmplitude.value * (params.maxScale - params.baseScale) +
        breatheOffset
      // Second smoothing pass — slower, makes state-switches and voice pulses
      // feel like breathing rather than toggling
      currentScale += (targetScale - currentScale) * 0.06
      orbGroup.scale.setScalar(currentScale)

      // Spin around y only, with a slight wobble — keeps the pink-toward-the-
      // bottom composition of the reference from tumbling upside down
      orb.rotation.y += 0.0015 + u.uActivity.value * 0.003
      orb.rotation.x = Math.sin(elapsed * 0.3) * 0.15

      renderer.render(scene, camera)

      // Bloom: copy this frame's render into the small canvas behind the orb
      // (blur + enlarge happen in CSS). Must run right after render(), while
      // the WebGL drawing buffer is still valid. The copy already contains the
      // orb at its current scale, so the bloom param maps to how far the glow
      // extends BEYOND the orb's edge — it must always clear the overlay
      // point or the glow hides behind the orb entirely.
      bloomLevel += (params.bloom - bloomLevel) * 0.05
      if (bloomCtx && bloomCanvas) {
        bloomCtx.clearRect(0, 0, BLOOM_RES, BLOOM_RES)
        bloomCtx.drawImage(renderer.domElement, 0, 0, BLOOM_RES, BLOOM_RES)
        const bs = ((1 + bloomLevel) / BLOOM_BOX)
        bloomCanvas.style.transform = `scale(${bs})`
        bloomCanvas.style.opacity = String(
          Math.min(1, 0.45 + u.uGlow.value * 0.7),
        )
      }
    }

    tick()

    // ── Resize handling ────────────────────────────────────────────────────────
    const ro = new ResizeObserver(() => {
      const w = mount.clientWidth
      const h = mount.clientHeight
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    })
    ro.observe(mount)

    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
      orbGeometry.dispose()
      orbMaterial.dispose()
      renderer.dispose()
      mount.removeChild(renderer.domElement)
    }
  }, [analyserRef, playbackAnalyserRef, speechLevelRef])

  const cls = [styles.mount, className].filter(Boolean).join(' ')
  return (
    <div ref={mountRef} className={cls}>
      {/* Bloom renders first so it sits behind the Three.js canvas in DOM order */}
      <canvas ref={bloomRef} className={styles.bloom} aria-hidden="true" />
      {webglFailed && <div className={styles.fallbackOrb} aria-hidden="true" />}
    </div>
  )
}

export default OrbCanvas
