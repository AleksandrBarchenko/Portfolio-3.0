/* ────────────────────────────────────────────────────────────────────────────
 * TV Head — standalone, single-file build
 *
 * A Stray-style companion robot head rendered in Three.js. Everything about the
 * object lives in this one file — its types, its full per-state settings, the
 * geometry, the shaders and the text-driven mouth. It imports nothing but
 * `react` and `three`, so it stays copyable into any React project as-is.
 *
 * ON THIS SITE
 *   This is the avatar behind the "2nd" header tab. <Avatar> renders it for
 *   AvatarMode "face" and the orb for "orb"; both take the same interaction
 *   `state`, whose union is identical to TvState below. Retune the character by
 *   editing DEFAULT_TV_SETTINGS here — nothing outside this file describes it.
 *
 * DEPENDENCIES
 *   three + @types/three (the repo is on 0.180, which is fine). Three must be
 *   r163 or newer — this uses `scene.environmentIntensity`, which silently does
 *   nothing on older versions.
 *
 * USAGE
 *   import { TvHead, useTextMouth } from './TvHead'
 *
 *   function TalkingHead({ text }: { text: string }) {
 *     const speechLevelRef = useRef(0)                    // see GOTCHA 2
 *     const [state, setState] = useState<TvState>('idle')
 *     const { speak, stop } = useTextMouth(speechLevelRef, {
 *       onDone: () => setState('idle'),
 *     })
 *
 *     useEffect(() => {
 *       if (!text) return
 *       setState('replying')
 *       speak(text)
 *       return stop
 *     }, [text, speak, stop])
 *
 *     return (
 *       <div style={{ width: 420, height: 420 }}>        // see GOTCHA 1
 *         <TvHead state={state} speechLevelRef={speechLevelRef} />
 *       </div>
 *     )
 *   }
 *
 * GOTCHA 1 — the parent needs a definite height. The mount fills 100%/100%, so
 *   inside an auto-height flex column clientHeight is 0, camera.aspect is NaN,
 *   and you get a black canvas. Give the wrapper real dimensions or
 *   `aspect-ratio: 1`.
 *
 * GOTCHA 2 — `speechLevelRef` must be a stable `useRef`. It is an effect
 *   dependency, so passing an inline object rebuilds the entire Three.js scene
 *   (environment bake, ~12 geometries, 8 materials) on every render. For the
 *   same reason, keep TvHead mounted and change `state` rather than remounting
 *   or re-keying it per message.
 *
 * GOTCHA 3 — do not pass `analyserRef` / `playbackAnalyserRef` unless you have
 *   real Web Audio. Any non-null analyser takes priority over `speechLevelRef`,
 *   and the mouth will stop responding to text.
 *
 * STATES — 'idle' | 'listening' | 'thinking' | 'replying'. All four are tuned
 *   and cross-fade into each other automatically. If you only ever talk, drive
 *   'replying' while speaking and 'idle' between; that reads best.
 *
 * TUNING — every color and parameter lives in DEFAULT_TV_SETTINGS below. Pass a
 *   modified copy via the `settings` prop, or just edit the constant.
 * ──────────────────────────────────────────────────────────────────────────── */

'use client'

/* eslint-disable react-refresh/only-export-components --
   Single file by design: the component ships together with its settings, its
   types and the mouth helper so the whole character is one copyable unit. The
   cost is HMR granularity in dev; there is no runtime cost. */

import { useCallback, useEffect, useRef, useState } from 'react'
import type { CSSProperties, MutableRefObject } from 'react'
import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

// ── Contract ────────────────────────────────────────────────────────────────

export type TvState = 'idle' | 'listening' | 'thinking' | 'replying'

export const TV_STATES: readonly TvState[] = ['idle', 'listening', 'thinking', 'replying']

export interface TvCanvasBaseProps {
  /** Current interaction state — drives the face, the pose and the palette */
  state: TvState
  /** Mic analyser. Leave undefined for a text-only head. */
  analyserRef?: MutableRefObject<AnalyserNode | null>
  /** Analyser on TTS playback. Leave undefined for a text-only head. */
  playbackAnalyserRef?: MutableRefObject<AnalyserNode | null>
  /** Mouth level 0–1, read only while `state === 'replying'`. See useTextMouth. */
  speechLevelRef?: MutableRefObject<number>
  /** Freeze on the current frame */
  paused?: boolean
  className?: string
}

const MOUNT_STYLE: CSSProperties = { position: 'relative', width: '100%', height: '100%' }

/** Shown only if the WebGL context cannot be created at all */
const FALLBACK_STYLE: CSSProperties = {
  position: 'absolute',
  inset: '16% 10%',
  borderRadius: '8%',
  background:
    'radial-gradient(ellipse at 50% 38%, #ffb43a 0%, #c43a06 62%, #6d2a10 100%)',
  boxShadow: 'inset 0 0 0 clamp(8px, 3.5%, 22px) #3a3b3d',
}

/**
 * TV Head — the assistant as a Stray-style companion robot head: a chamfered
 * white box with a chunky dark bezel around a flat pixel screen, a perforated
 * speaker cone on one cheek, and cabling hanging out of the base. No body.
 *
 * The face is flat vector shapes on a rainbow field rather than a glowing CRT —
 * two rounded eyes and a mouth bar that bends into a smile or opens with the
 * voice.
 *
 * Same contract as the orbs — every interaction state carries a full set of
 * colors and parameters and the render loop cross-fades all of them on state
 * changes (governed by `transition`).
 *
 * Copy JSON from the /tv-v1 lab pastes here as the value of
 * DEFAULT_TV_SETTINGS (keep the `export const ... =` prefix).
 */
export interface TvStateParams {
  /** The shell — white moulded plastic */
  shellColor: string
  /** Bezel, top hood and speaker ring — the charcoal parts */
  shellDark: string
  /** Perforated speaker mesh */
  grilleColor: string
  /** Panel gradient — the deep end */
  screenA: string
  /** Panel gradient — the bright end, up toward the top-left */
  screenB: string
  /** Eyes and mouth */
  faceColor: string
  /** Cable jacket */
  cableColor: string
  /** Studio sweep behind the head */
  backdropColor: string

  /* ── Screen ── */
  /** How far the gradient slides back and forth (0–2) */
  drift: number
  /** Screen emission — above 1 the panel blooms in the post pass (0.4–2.5) */
  screenGlow: number
  /** Visibility of the pixel grid ruling (0–1) */
  pixelGrid: number

  /* ── Face ── */
  /** Eye half-width, where the screen is 1.0 tall (0.01–0.2) */
  eyeW: number
  /** Eye half-height (0.01–0.25) */
  eyeH: number
  /** Half the distance between the eyes (0.03–0.3) */
  eyeSpacing: number
  /** Vertical position of the eye line (−0.3–0.3) */
  eyeHeight: number
  /** Corner rounding of the eyes — at half-width they become ovals (0–0.2) */
  eyeRound: number
  /** Mouth half-width (0.01–0.3) */
  mouthW: number
  /** Mouth half-height (0.005–0.15) */
  mouthH: number
  /** Vertical position of the mouth (−0.4–0.2) */
  mouthY: number
  /** Bend: positive smiles, negative frowns (−1–1) */
  mouthCurve: number
  /** How far the voice opens the mouth (0–3) */
  voiceMouth: number
  /** Blinks per minute, normalized (0 = never, 1 = restless) */
  blinkRate: number
  /** How far the eyes wander off-center while looking around (0–1) */
  gaze: number

  /* ── Pose ── */
  /** Resting turn (yaw) in radians — negative shows the speaker cheek (−0.8–0.8) */
  yaw: number
  /** Resting tilt (pitch) in radians — negative dips the chin, positive lifts it (−0.6–0.6) */
  pitch: number
  /** Head roll in radians (−0.5–0.5) */
  lean: number
  /** Idle bob and sway amount (0–1.5) */
  bob: number
  /** Overall size (0.5–1.4) */
  scale: number

  /* ── Lens and film, applied in the post pass over the finished frame ── */
  /** Highlight bloom (0–2) */
  bloom: number
  /** Radial chromatic aberration (0–1) */
  aberration: number
  /** Film grain (0–1) */
  filmGrain: number
  /** Lens vignette (0–1) */
  vignette: number
  /** Opacity of the studio sweep / drop-shadow behind the head (0–1) */
  backdrop: number
  /** How far the shadow spreads out from the head — tight pool to full frame (0.2–1.5) */
  shadowDepth: number
  /** Softness of the shadow's edge — 0 hard, 1 fully feathered (0–1) */
  shadowBlur: number
}

export interface TvSettings {
  /** Per-frame easing for state transitions (0.01 slow – 0.2 snappy). Default 0.05. */
  transition?: number
  states: Record<TvState, TvStateParams>
}

export const DEFAULT_TV_SETTINGS: TvSettings = {
  "transition": 0.05,
  "states": {
    "idle": {
      "shellColor": "#ddd9d2",
      "shellDark": "#3a3b3d",
      "grilleColor": "#b4b1a9",
      "screenA": "#cf3e05",
      "screenB": "#ffc048",
      "faceColor": "#ffffff",
      "cableColor": "#ef8206",
      "backdropColor": "#e66119",
      "drift": 0.8,
      "screenGlow": 1.25,
      "pixelGrid": 0.32,
      "eyeW": 0.064,
      "eyeH": 0.09,
      "eyeSpacing": 0.135,
      "eyeHeight": 0.095,
      "eyeRound": 0.064,
      "mouthW": 0.12,
      "mouthH": 0.007,
      "mouthY": -0.195,
      "mouthCurve": 0.35,
      "voiceMouth": 0.75,
      "blinkRate": 0.3,
      "gaze": 0.3,
      "yaw": -0.31,
      "pitch": -0.12,
      "lean": -0.02,
      "bob": 0.12,
      "scale": 1.15,
      "bloom": 0,
      "aberration": 0.14,
      "filmGrain": 0.28,
      "vignette": 0.22,
      "backdrop": 0.35,
      "shadowDepth": 0.93,
      "shadowBlur": 1
    },
    "listening": {
      "shellColor": "#ddd9d2",
      "shellDark": "#3a3b3d",
      "grilleColor": "#b4b1a9",
      "screenA": "#cf3e05",
      "screenB": "#ffc048",
      "faceColor": "#ffffff",
      "cableColor": "#ef8206",
      "backdropColor": "#e66119",
      "drift": 0.8,
      "screenGlow": 1.25,
      "pixelGrid": 0.32,
      "eyeW": 0.064,
      "eyeH": 0.09,
      "eyeSpacing": 0.135,
      "eyeHeight": 0.095,
      "eyeRound": 0.064,
      "mouthW": 0.12,
      "mouthH": 0.007,
      "mouthY": -0.195,
      "mouthCurve": 0.35,
      "voiceMouth": 0.75,
      "blinkRate": 0.3,
      "gaze": 0.3,
      "yaw": -0.31,
      "pitch": -0.12,
      "lean": -0.02,
      "bob": 0.12,
      "scale": 1.15,
      "bloom": 0,
      "aberration": 0.14,
      "filmGrain": 0.28,
      "vignette": 0.22,
      "backdrop": 0.35,
      "shadowDepth": 0.93,
      "shadowBlur": 1
    },
    "thinking": {
      "shellColor": "#ddd9d2",
      "shellDark": "#3a3b3d",
      "grilleColor": "#b4b1a9",
      "screenA": "#cf3e05",
      "screenB": "#ffc048",
      "faceColor": "#ffffff",
      "cableColor": "#ef8206",
      "backdropColor": "#e66119",
      "drift": 0.8,
      "screenGlow": 1.25,
      "pixelGrid": 0.32,
      "eyeW": 0.064,
      "eyeH": 0.09,
      "eyeSpacing": 0.135,
      "eyeHeight": 0.095,
      "eyeRound": 0.064,
      "mouthW": 0.12,
      "mouthH": 0.007,
      "mouthY": -0.195,
      "mouthCurve": 0.35,
      "voiceMouth": 0.75,
      "blinkRate": 0.3,
      "gaze": 0.3,
      "yaw": -0.31,
      "pitch": -0.12,
      "lean": -0.02,
      "bob": 0.12,
      "scale": 1.15,
      "bloom": 0,
      "aberration": 0.14,
      "filmGrain": 0.28,
      "vignette": 0.22,
      "backdrop": 0.35,
      "shadowDepth": 0.93,
      "shadowBlur": 1
    },
    "replying": {
      "shellColor": "#ddd9d2",
      "shellDark": "#3a3b3d",
      "grilleColor": "#b4b1a9",
      "screenA": "#cf3e05",
      "screenB": "#ffc048",
      "faceColor": "#ffffff",
      "cableColor": "#ef8206",
      "backdropColor": "#e66119",
      "drift": 0.8,
      "screenGlow": 1.25,
      "pixelGrid": 0.32,
      "eyeW": 0.064,
      "eyeH": 0.09,
      "eyeSpacing": 0.135,
      "eyeHeight": 0.095,
      "eyeRound": 0.064,
      "mouthW": 0.12,
      "mouthH": 0.007,
      "mouthY": -0.195,
      "mouthCurve": 0.35,
      "voiceMouth": 0.75,
      "blinkRate": 0.3,
      "gaze": 0.3,
      "yaw": -0.31,
      "pitch": -0.12,
      "lean": -0.02,
      "bob": 0.12,
      "scale": 1.15,
      "bloom": 0,
      "aberration": 0.14,
      "filmGrain": 0.28,
      "vignette": 0.22,
      "backdrop": 0.35,
      "shadowDepth": 0.93,
      "shadowBlur": 1
    }
  }
}

// ── Text-driven mouth ───────────────────────────────────────────────────────
// The head reads `speechLevelRef.current` only while `state === 'replying'` and
// no analyser is attached. With neither, the level stays 0 and the mouth is a
// static bar — the head just sits there. This turns a plain string into a
// syllable-paced envelope so it looks like it is saying the thing.
//
// It writes an absolute level every frame from its own rAF rather than kicking
// a value and letting the render loop decay it: that decay is per-frame, so the
// kick-and-decay approach speeds up on a 120Hz display and the head mumbles.

const SYLLABLE_MS = 155       // ~6.5 syllables/s — unhurried conversational English
const SYLLABLE_JITTER = 0.22  // so it never reads as metronomic
const WORD_GAP_MS = 45
const CLAUSE_GAP_MS = 200
const SENTENCE_GAP_MS = 380   // long enough that the mouth fully closes between sentences
const TAIL_MS = 240
const BASE_GAIN = 0.62
const STRESS_GAIN = 0.82

interface MouthBeat { start: number; end: number; gain: number }
export interface SpeechPlan { beats: MouthBeat[]; durationMs: number }

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
const smoothstep = (x: number) => { const t = clamp01(x); return t * t * (3 - 2 * t) }

/** Fast attack, slower release — a jaw dropping and closing */
function bump(p: number) {
  if (p <= 0 || p >= 1) return 0
  return p < 0.3 ? smoothstep(p / 0.3) : smoothstep(1 - (p - 0.3) / 0.7)
}

/** Vowel-group syllable count. Wrong maybe 10% of the time; nobody can tell. */
function countSyllables(raw: string) {
  const w = raw.toLowerCase().replace(/[^a-z]/g, '')
  if (!w) return 0
  const groups = w.match(/[aeiouy]+/g)
  let n = groups ? groups.length : 1
  if (n > 1 && w.length > 3 && /[^aeiouy]e$/.test(w)) n -= 1   // silent trailing e
  return Math.max(1, n)
}

/** Text → a timeline of mouth openings. Pure, so it is easy to test or tweak. */
export function planSpeech(text: string, rate = 1): SpeechPlan {
  const beats: MouthBeat[] = []
  const syllableMs = SYLLABLE_MS / Math.max(0.25, rate)
  let t = 0
  for (const token of text.split(/\s+/)) {
    if (!token) continue
    const n = countSyllables(token)
    if (n === 0) { t += CLAUSE_GAP_MS; continue }
    for (let i = 0; i < n; i++) {
      const dur = syllableMs * (1 + (Math.random() * 2 - 1) * SYLLABLE_JITTER)
      const gain =
        (i === 0 ? STRESS_GAIN : BASE_GAIN) *
        (0.9 + Math.min(0.25, token.length * 0.02)) *
        (0.9 + Math.random() * 0.2)
      beats.push({ start: t, end: t + dur * 0.92, gain: Math.min(1, gain) })
      t += dur
    }
    t += WORD_GAP_MS
    if (/[.!?…]["')\]]?$/.test(token)) t += SENTENCE_GAP_MS
    else if (/[,;:—]$/.test(token)) t += CLAUSE_GAP_MS
  }
  return { beats, durationMs: t + TAIL_MS }
}

export interface TextMouthOptions {
  /** >1 speaks faster, <1 slower. Default 1. */
  rate?: number
  /** Fired once the utterance and its tail have finished. */
  onDone?: () => void
}

/**
 * Drives a `speechLevelRef` from text. Pass the same ref to <TvHead> and set
 * its state to 'replying' while speaking.
 */
export function useTextMouth(
  speechLevelRef: MutableRefObject<number>,
  { rate = 1, onDone }: TextMouthOptions = {},
) {
  const [speaking, setSpeaking] = useState(false)
  const rafRef = useRef(0)
  const planRef = useRef<SpeechPlan | null>(null)
  const doneRef = useRef(onDone)
  doneRef.current = onDone            // so `speak` keeps a stable identity

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    rafRef.current = 0
    planRef.current = null
    speechLevelRef.current = 0
    setSpeaking(false)
  }, [speechLevelRef])

  const speak = useCallback((text: string) => {
    cancelAnimationFrame(rafRef.current)
    const plan = planSpeech(text, rate)
    if (!plan.beats.length) { stop(); doneRef.current?.(); return }
    planRef.current = plan
    setSpeaking(true)

    const t0 = performance.now()
    let cursor = 0
    const frame = (now: number) => {
      const p = planRef.current
      if (!p) return
      const t = now - t0
      // beats are sorted by start, so retiring finished ones keeps this cheap
      while (cursor < p.beats.length && p.beats[cursor].end <= t) cursor++
      // max, not sum — overlapping beats can never push past 1.0
      let level = 0
      for (let i = cursor; i < p.beats.length; i++) {
        const b = p.beats[i]
        if (b.start > t) break
        const v = b.gain * bump((t - b.start) / (b.end - b.start))
        if (v > level) level = v
      }
      speechLevelRef.current = level
      if (t >= p.durationMs) {
        planRef.current = null
        speechLevelRef.current = 0
        rafRef.current = 0
        setSpeaking(false)
        doneRef.current?.()
        return
      }
      rafRef.current = requestAnimationFrame(frame)
    }
    rafRef.current = requestAnimationFrame(frame)
  }, [rate, speechLevelRef, stop])

  useEffect(() => () => cancelAnimationFrame(rafRef.current), [])

  return { speak, stop, speaking }
}


/**
 * TV Head — the assistant as a Stray-style companion robot head.
 *
 *   head      chamfered box: an octagonal profile extruded with a bevel, so
 *             every silhouette edge is cut at 45° like the game's model
 *   bezel     chunky charcoal frame standing proud of the front face
 *   screen    flat panel carrying the face shader — rainbow field, pixel
 *             ruling, two rounded eyes and a mouth that bends or opens
 *   speaker   ring, boss and perforated mesh on the right cheek
 *   hood      dark wedge across the top rear
 *   details   perforation cluster, push button, base connectors
 *   cables    braided runs hanging out of the base and off the speaker
 *
 * The scene renders to a half-float buffer; POST_FRAGMENT finishes the frame
 * with bloom, dispersion, grain, vignette and the studio sweep.
 */

export interface TvHeadProps extends TvCanvasBaseProps {
  settings?: TvSettings
  /** Resting turn offset in radians, eased. 0 = front-on; negative shows the
   *  speaker cheek (three-quarter). Layered on top of cursor steering. */
  baseYaw?: number
  /** Image (or video) URL to show inside the screen. */
  screenMediaSrc?: string
  /** Crossfade the media over the face when true; back to the face when false. */
  screenMediaActive?: boolean
  /** Overlay the play triangle on the media. */
  screenShowPlay?: boolean
  /** Fired when the screen is clicked while media is active. */
  onScreenActivate?: () => void
}

/* Hex → 0–1 RGB without THREE.Color, so no color-management conversion is
   applied and the shader receives the exact values shown in the pickers.
   The shell is lit by real lights, so its colors do go through THREE.Color. */
function setVec3FromHex(v: THREE.Vector3, hex: string) {
  const n = parseInt(hex.replace('#', ''), 16)
  v.set(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255)
}

/* Head dimensions in world units. The front face sits at z = 0 and everything
   else is placed relative to it. */
const HEAD_W = 1.2
const HEAD_H = 1.24
const HEAD_D = 1.15
const HEAD_CHAMFER = 0.055
/* How much is cut off each corner of the front profile */
const CORNER_CUT = 0.26

/* Kept well inside the front face: the model reads as a panel with a display
   set into it, not as a screen with a frame around it */
const SCREEN_W = 0.58
const SCREEN_H = 0.62
const SCREEN_Y = 0.1
const SCREEN_ASPECT = SCREEN_W / SCREEN_H

// ── The face ────────────────────────────────────────────────────────────────

const SCREEN_VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const SCREEN_FRAGMENT = /* glsl */ `
uniform float uTime;
uniform float uAspect;
uniform vec3  uScreenA;
uniform vec3  uScreenB;
uniform vec3  uFaceColor;
uniform float uDrift;
uniform float uScreenGlow;
uniform float uPixelGrid;
uniform float uEyeW;
uniform float uEyeH;
uniform float uEyeSpacing;
uniform float uEyeHeight;
uniform float uEyeRound;
uniform float uMouthW;
uniform float uMouthH;
uniform float uMouthY;
uniform float uMouthCurve;
uniform float uVoiceMouth;
uniform float uBlink;   // 0 open → 1 shut
uniform vec2  uGaze;
uniform float uVoice;   // smoothed amplitude, 0–1
uniform sampler2D uMedia;     // still/video shown inside the screen
uniform float uMediaMix;      // 0 = face, 1 = media (crossfaded)
uniform float uMediaAspect;   // media width / height, for cover-fit
uniform float uShowPlay;      // 0/1 — overlay the play triangle

varying vec2 vUv;

/* Signed distance to a rounded rectangle — every feature on this face is one */
float roundBox(vec2 p, vec2 b, float r) {
  r = min(r, min(b.x, b.y));
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

/* Signed distance to a triangle (iq) — used for the play glyph */
float sdTriangle(vec2 p, vec2 p0, vec2 p1, vec2 p2) {
  vec2 e0 = p1 - p0, e1 = p2 - p1, e2 = p0 - p2;
  vec2 v0 = p - p0, v1 = p - p1, v2 = p - p2;
  vec2 pq0 = v0 - e0 * clamp(dot(v0, e0) / dot(e0, e0), 0.0, 1.0);
  vec2 pq1 = v1 - e1 * clamp(dot(v1, e1) / dot(e1, e1), 0.0, 1.0);
  vec2 pq2 = v2 - e2 * clamp(dot(v2, e2) / dot(e2, e2), 0.0, 1.0);
  float s = sign(e0.x * e2.y - e0.y * e2.x);
  vec2 d = min(min(vec2(dot(pq0, pq0), s * (v0.x * e0.y - v0.y * e0.x)),
                   vec2(dot(pq1, pq1), s * (v1.x * e1.y - v1.y * e1.x))),
                   vec2(dot(pq2, pq2), s * (v2.x * e2.y - v2.y * e2.x)));
  return -sqrt(d.x) * sign(d.y);
}

void main() {
  vec2 p = (vUv - 0.5) * vec2(uAspect, 1.0);

  /* Diagonal gradient across the panel, sliding gently along its own axis */
  float ramp = clamp(
    0.5 + (p.y - p.x) * 0.95 + sin(uTime * uDrift * 0.35) * 0.07,
    0.0, 1.0);
  vec3 col = mix(uScreenA, uScreenB, ramp);

  /* Pixel ruling — the faint graph-paper grid over the whole panel */
  vec2 g = fract(vUv * 34.0);
  float rule = min(min(g.x, 1.0 - g.x), min(g.y, 1.0 - g.y));
  col *= 1.0 - (1.0 - smoothstep(0.0, 0.045, rule)) * uPixelGrid * 0.16;

  /* Eyes. The lid closes by collapsing the box's height, which keeps the
     corner radius clamped inside it and leaves a flat lash line. */
  vec2 e = p - uGaze;
  float eh = max(uEyeH * (1.0 - uBlink * 0.93), 0.004);
  float dEye = min(
    roundBox(e - vec2(-uEyeSpacing, uEyeHeight), vec2(uEyeW, eh), uEyeRound),
    roundBox(e - vec2( uEyeSpacing, uEyeHeight), vec2(uEyeW, eh), uEyeRound)
  );

  /* Mouth: a bar bent by a parabola. The bend is subtracted from y so a
     positive curve lifts the ends into a smile. Voice opens it vertically. */
  float mw = uMouthW + uVoice * uVoiceMouth * 0.018;
  float mh = uMouthH + uVoice * uVoiceMouth * 0.055;
  float t = clamp(e.x / max(mw, 0.001), -1.0, 1.0);
  float bend = uMouthCurve * 0.09 * (t * t - 0.34);
  float dMouth = roundBox(vec2(e.x, e.y - uMouthY - bend), vec2(mw, mh), mh * 0.9);

  float face = 1.0 - smoothstep(0.0, 0.007, min(dEye, dMouth));
  col = mix(col, uFaceColor, face);

  /* Screen glow blooms the face in the post pass; the video should read as a
     normal-brightness panel, so ease the glow toward 1.0 as media takes over */
  float glow = mix(uScreenGlow, 1.04, uMediaMix);

  /* Media panel — the case-study still/video, cover-fit into the near-square
     screen so it fills without letterboxing, then crossfaded over the face */
  if (uMediaMix > 0.001) {
    vec2 scale = vec2(1.0);
    if (uMediaAspect > uAspect) scale.x = uAspect / uMediaAspect;
    else                        scale.y = uMediaAspect / uAspect;
    // Extra centre crop so a torn/deckle-bordered still shows only its scene
    scale *= 0.82;
    vec2 muv = (vUv - 0.5) * scale + 0.5;
    vec3 media = texture2D(uMedia, muv).rgb;
    col = mix(col, media, uMediaMix);

    /* Play glyph: a plain white right-pointing triangle, centred, with a soft
       dark scrim behind it so it reads over any frame */
    float dTri = sdTriangle(p, vec2(-0.05, -0.09), vec2(-0.05, 0.09), vec2(0.11, 0.0));
    float tri = 1.0 - smoothstep(0.0, 0.006, dTri);
    float scrim = (1.0 - smoothstep(0.14, 0.24, length(p))) * 0.28;
    float show = uShowPlay * uMediaMix;
    col = mix(col, vec3(0.0), scrim * show);
    col = mix(col, vec3(1.0), tri * show);
  }

  /* Driven above white so the panel blooms in the post pass */
  gl_FragColor = vec4(col * glow, 1.0);
}
`

/* Perforated speaker mesh — a hex lattice of holes, as on the model's cone */
const GRILLE_FRAGMENT = /* glsl */ `
uniform vec3 uGrilleColor;
varying vec2 vUv;

void main() {
  /* Coarse and low-contrast on purpose. The cone is small on screen and sits
     out where the dispersion is strongest, so a dense lattice moirés first and
     then gets split into magenta/green stripes by the aberration pass. */
  vec2 p = (vUv - 0.5) * 8.0;
  p.x += mod(floor(p.y), 2.0) * 0.5;   // offset alternate rows into a hex grid
  float d = length(fract(p) - 0.5);
  float hole = 1.0 - smoothstep(0.2, 0.4, d);

  vec3 col = mix(uGrilleColor, uGrilleColor * 0.42, hole);
  /* Falls into shadow toward the rim, the way a recessed cone does */
  col *= 1.0 - 0.45 * smoothstep(0.28, 0.5, length(vUv - 0.5));
  gl_FragColor = vec4(col, 1.0);
}
`

// ── Lens and film ───────────────────────────────────────────────────────────

const POST_VERTEX = /* glsl */ `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`

const POST_FRAGMENT = /* glsl */ `
uniform sampler2D tScene;
uniform vec2  uResolution;
uniform float uTime;
uniform float uBloom;
uniform float uAberration;
uniform float uFilmGrain;
uniform float uVignette;
uniform float uBackdrop;
uniform vec3  uBackdropColor;
uniform float uShadowDepth;
uniform float uShadowBlur;

varying vec2 vUv;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

/* Narkowicz's ACES approximation — filmic highlight rolloff, so the screen
   burns out the way an exposure does instead of clipping flat */
vec3 aces(vec3 x) {
  return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0);
}

void main() {
  vec2 c = vUv - 0.5;
  float r2 = dot(c, c);

  /* Dispersion: the channels separate radially, and only near the corners */
  vec2 off = c * uAberration * r2 * 0.05;
  vec4 sr = texture2D(tScene, vUv + off);
  vec4 sg = texture2D(tScene, vUv);
  vec4 sb = texture2D(tScene, vUv - off);
  vec3 col = vec3(sr.r, sg.g, sb.b);
  float alpha = max(max(sr.a, sg.a), sb.a);

  /* Bloom over whatever is already past white — the buffer is half-float, so
     the screen really does carry values above 1.0 to pick up */
  vec3 glow = vec3(0.0);
  for (int i = 0; i < 16; i++) {
    float fi = float(i);
    float a = fi * 2.39996;                      // golden angle — no banding
    float rad = 0.003 + 0.013 * fi / 16.0;
    vec2 o = vec2(cos(a), sin(a)) * rad * vec2(1.0, uResolution.x / uResolution.y);
    glow += max(vec3(0.0), texture2D(tScene, vUv + o).rgb - 1.0);
  }
  col += glow * (uBloom / 16.0) * 2.2;

  /* One soft shadow from a single light. Just a plain elliptical gradient pool
     — no silhouette sampling — so it reads as one smooth blob and never looks
     like it stacks up from several sources. Key light is up and to the right,
     so the pool sits down and to the left of the head. Depth shifts it further
     off; blur widens the falloff. */
  vec3 wall = pow(uBackdropColor, vec3(2.2));
  vec2 aspectFix = vec2(1.0, uResolution.x / uResolution.y);
  vec2 sc = (vUv - 0.5) * aspectFix;                     // aspect-correct, centred
  vec2 center = vec2(-0.05, -0.11) * uShadowDepth;       // pool sits down-left of head
  float dist = length((sc - center) / vec2(0.36, 0.32)); // ellipse radii
  float edge = mix(0.55, 1.15, clamp(uShadowBlur, 0.0, 1.0));
  float pool = 1.0 - smoothstep(0.0, edge, dist);        // single smooth gradient
  float sweep = 0.82 + 0.18 * smoothstep(0.0, 1.0, vUv.y);
  float bg = uBackdrop * pool * sweep;
  col += wall * bg * (1.0 - alpha);
  alpha = alpha + bg * (1.0 - alpha);

  col = aces(col * 1.12);

  col *= 1.0 - uVignette * smoothstep(0.05, 0.5, r2);
  col += (hash(vUv * uResolution + fract(uTime) * 91.7) - 0.5) * uFilmGrain * 0.055;

  gl_FragColor = vec4(col, alpha);
}
`

// ── Procedural maps ─────────────────────────────────────────────────────────

/** Fine white noise — micro roughness, so the plastic is not perfectly smooth */
function buildNoiseTexture() {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const texture = new THREE.CanvasTexture(canvas)
  if (ctx) {
    const image = ctx.createImageData(size, size)
    for (let i = 0; i < size * size; i++) {
      const v = 140 + Math.random() * 90
      image.data[i * 4] = v
      image.data[i * 4 + 1] = v
      image.data[i * 4 + 2] = v
      image.data[i * 4 + 3] = 255
    }
    ctx.putImageData(image, 0, 0)
    texture.needsUpdate = true
  }
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  texture.repeat.set(4, 4)
  return texture
}

/**
 * Grime map: soft low-frequency blotches, mostly white with a dark tail. The
 * game's shell is filthy in the corners; this is a cheap stand-in for a
 * hand-painted weathering pass — enough to stop the plastic reading as new.
 */
function buildGrungeTexture() {
  const size = 256
  const seedCanvas = document.createElement('canvas')
  seedCanvas.width = 48
  seedCanvas.height = 48
  const seedCtx = seedCanvas.getContext('2d')
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace

  if (seedCtx && ctx) {
    const seed = seedCtx.createImageData(seedCanvas.width, seedCanvas.height)
    for (let i = 0; i < seedCanvas.width * seedCanvas.height; i++) {
      const v = Math.random() * 255
      seed.data[i * 4] = v
      seed.data[i * 4 + 1] = v
      seed.data[i * 4 + 2] = v
      seed.data[i * 4 + 3] = 255
    }
    seedCtx.putImageData(seed, 0, 0)
    // A real blur, not just bilinear upscaling — plain smoothing on a small
    // seed leaves visible interpolation diamonds that read as camouflage
    ctx.imageSmoothingEnabled = true
    ctx.filter = 'blur(5px)'
    ctx.drawImage(seedCanvas, 0, 0, size, size)
    ctx.filter = 'none'

    const out = ctx.getImageData(0, 0, size, size)
    for (let i = 0; i < size * size; i++) {
      const v = out.data[i * 4] / 255
      // Keep only the dark tail of the noise, so most of the shell stays clean
      const dirt = Math.pow(Math.max(0, 0.44 - v) / 0.44, 2.0)
      const speck = Math.random() < 0.03 ? 0.05 : 0
      const c = Math.round(255 * (1 - Math.min(1, dirt * 0.16 + speck)))
      out.data[i * 4] = c
      out.data[i * 4 + 1] = c
      out.data[i * 4 + 2] = c
    }
    ctx.putImageData(out, 0, 0)
    texture.needsUpdate = true
  }
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  return texture
}

// ── Geometry helpers ────────────────────────────────────────────────────────

/** A closed path through `points` with every corner rounded by `r` */
function roundedPolygon(points: [number, number][], r: number): THREE.Shape {
  const shape = new THREE.Shape()
  const n = points.length
  const lerp = (a: [number, number], b: [number, number], t: number): [number, number] => {
    const dx = b[0] - a[0]
    const dy = b[1] - a[1]
    const len = Math.hypot(dx, dy) || 1
    const d = Math.min(t, len / 2)
    return [a[0] + (dx / len) * d, a[1] + (dy / len) * d]
  }

  for (let i = 0; i < n; i++) {
    const prev = points[(i - 1 + n) % n]
    const cur = points[i]
    const next = points[(i + 1) % n]
    const from = lerp(cur, prev, r)
    const to = lerp(cur, next, r)
    if (i === 0) shape.moveTo(from[0], from[1])
    else shape.lineTo(from[0], from[1])
    shape.quadraticCurveTo(cur[0], cur[1], to[0], to[1])
  }
  shape.closePath()
  return shape
}

/** The head's profile: a rectangle with all four corners cut off at 45° */
function chamferedShape(w: number, h: number, cut: number, r: number) {
  const x = w / 2
  const y = h / 2
  return roundedPolygon(
    [
      [-x, -y + cut], [-x, y - cut], [-x + cut, y], [x - cut, y],
      [x, y - cut], [x, -y + cut], [x - cut, -y], [-x + cut, -y],
    ],
    r,
  )
}

function roundedRectShape(w: number, h: number, r: number) {
  const x = w / 2
  const y = h / 2
  return roundedPolygon([[-x, -y], [-x, y], [x, y], [x, -y]], r)
}

/** A flat frame: an outline with a window cut out of it */
function buildFrameGeometry(
  outer: THREE.Shape,
  inner: THREE.Shape,
  depth: number,
  bevel: number,
) {
  outer.holes.push(inner)
  const geometry = new THREE.ExtrudeGeometry(outer, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments: 8,
  })
  geometry.computeVertexNormals()
  return geometry
}

/** One braided run, as a tube through a few control points */
function buildCable(points: [number, number, number][], radius: number) {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(...p)))
  return new THREE.TubeGeometry(curve, 36, radius, 10, false)
}

export function TvHead({
  state,
  analyserRef,
  playbackAnalyserRef,
  speechLevelRef,
  paused = false,
  settings = DEFAULT_TV_SETTINGS,
  className,
  baseYaw = 0,
  screenMediaSrc,
  screenMediaActive = false,
  screenShowPlay = false,
  onScreenActivate,
}: TvHeadProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const [webglFailed, setWebglFailed] = useState(false)

  // Keep state and settings readable inside the RAF loop without restarts
  const stateRef = useRef<TvState>(state)
  stateRef.current = state
  const settingsRef = useRef<TvSettings>(settings)
  settingsRef.current = settings
  const pausedRef = useRef(paused)
  pausedRef.current = paused
  // Screen-media controls, read from the RAF loop and click handler without
  // restarting the scene (deps stay the analyser refs only).
  const baseYawRef = useRef(baseYaw)
  baseYawRef.current = baseYaw
  const mediaActiveRef = useRef(screenMediaActive)
  mediaActiveRef.current = screenMediaActive
  const showPlayRef = useRef(screenShowPlay)
  showPlayRef.current = screenShowPlay
  const onScreenActivateRef = useRef(onScreenActivate)
  onScreenActivateRef.current = onScreenActivate
  // Loaded screen texture + its aspect, filled by the media effect below.
  const mediaTextureRef = useRef<THREE.Texture | null>(null)
  const mediaAspectRef = useRef(1)
  // Cursor position in −1..1 viewport coords; the head steers toward it
  const pointerRef = useRef({ x: 0, y: 0 })

  // Load the screen media into a texture off the render loop. Kept in a ref so
  // the RAF loop can pick it up without the scene effect depending on the src.
  useEffect(() => {
    if (!screenMediaSrc) {
      mediaTextureRef.current = null
      return
    }
    let cancelled = false
    let texture: THREE.Texture | null = null
    new THREE.TextureLoader().load(screenMediaSrc, (t) => {
      if (cancelled) {
        t.dispose()
        return
      }
      t.colorSpace = THREE.SRGBColorSpace
      // Sampled inside a dynamic branch in the screen shader — drop mipmaps so
      // implicit-LOD derivatives stay defined and don't artifact on some GPUs.
      t.minFilter = THREE.LinearFilter
      t.generateMipmaps = false
      texture = t
      mediaTextureRef.current = t
      const img = t.image as { width?: number; height?: number }
      if (img?.width && img?.height) mediaAspectRef.current = img.width / img.height
    })
    return () => {
      cancelled = true
      if (texture) texture.dispose()
      mediaTextureRef.current = null
    }
  }, [screenMediaSrc])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    // Wide-ish and close, not telephoto — the perspective divergence down the
    // cheek is most of what sells the head as a box rather than a card
    const camera = new THREE.PerspectiveCamera(
      42,
      mount.clientWidth / mount.clientHeight,
      0.1,
      100,
    )
    camera.position.set(0, 0.3, 2.72)
    camera.lookAt(0, 0.02, 0)

    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    } catch {
      setWebglFailed(true)
      return
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    mount.appendChild(renderer.domElement)

    // The scene renders here first so the lens/film pass has real headroom
    // above white to work with; the canvas only ever shows the post output.
    const sceneTarget = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType,
      samples: 4,
    })

    // ── Lighting ───────────────────────────────────────────────────────────
    const pmrem = new THREE.PMREMGenerator(renderer)
    const envRT = pmrem.fromScene(new RoomEnvironment(), 0.04)
    scene.environment = envRT.texture
    scene.environmentIntensity = 0.45

    const key = new THREE.DirectionalLight(0xffffff, 1.15)
    key.position.set(2.4, 3.2, 3.4)
    const fill = new THREE.DirectionalLight(0xbcd4ff, 0.4)
    fill.position.set(-3.4, 0.4, 1.8)
    const rim = new THREE.DirectionalLight(0xffffff, 0.7)
    rim.position.set(-1.2, 1.4, -3.2)
    scene.add(key, fill, rim, new THREE.AmbientLight(0xffffff, 0.12))

    // ── Materials ──────────────────────────────────────────────────────────
    const initial = settingsRef.current.states[stateRef.current]
    const noise = buildNoiseTexture()
    const grunge = buildGrungeTexture()
    // 1×1 black stand-in so the screen sampler is always bound; the real media
    // texture (if any) is swapped in from mediaTextureRef inside the RAF loop.
    const blankMedia = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1)
    blankMedia.needsUpdate = true

    const shellMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(initial.shellColor),
      roughness: 0.55,
      metalness: 0.02,
      clearcoat: 0.3,
      clearcoatRoughness: 0.5,
      map: grunge,
      roughnessMap: noise,
      bumpMap: noise,
      bumpScale: 0.0016,
    })
    const darkMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(initial.shellDark),
      roughness: 0.52,
      metalness: 0.05,
      clearcoat: 0.45,
      clearcoatRoughness: 0.35,
      roughnessMap: noise,
    })
    const cableMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(initial.cableColor),
      roughness: 0.78,
      metalness: 0.04,
      roughnessMap: noise,
    })
    // Only one run is jacketed in the loom's color; the rest are black braid,
    // otherwise three identical tubes read as legs rather than cabling
    const braidMaterial = new THREE.MeshStandardMaterial({
      color: 0x24242a,
      roughness: 0.72,
      metalness: 0.05,
      roughnessMap: noise,
    })
    const metalMaterial = new THREE.MeshStandardMaterial({
      color: 0x8d9096,
      roughness: 0.35,
      metalness: 0.85,
    })

    // ── Head ───────────────────────────────────────────────────────────────
    // The bevel is what chamfers the front and back edges; the octagonal
    // profile chamfers the four silhouette corners. Together they give the
    // faceted box of the game model.
    const headDepth = HEAD_D - HEAD_CHAMFER * 2
    const headGeometry = new THREE.ExtrudeGeometry(
      chamferedShape(HEAD_W, HEAD_H, CORNER_CUT, 0.055),
      {
        depth: headDepth,
        bevelEnabled: true,
        bevelThickness: HEAD_CHAMFER,
        bevelSize: HEAD_CHAMFER,
        bevelSegments: 2,
        curveSegments: 8,
      },
    )
    headGeometry.computeVertexNormals()
    const head = new THREE.Mesh(headGeometry, shellMaterial)
    head.position.z = -(HEAD_D - HEAD_CHAMFER)

    // ── Screen ─────────────────────────────────────────────────────────────
    const bezelGeometry = buildFrameGeometry(
      roundedRectShape(SCREEN_W + 0.18, SCREEN_H + 0.18, 0.11),
      roundedRectShape(SCREEN_W, SCREEN_H, 0.05),
      0.05,
      0.012,
    )
    const bezel = new THREE.Mesh(bezelGeometry, darkMaterial)
    bezel.position.set(0, SCREEN_Y, -0.02)

    const screenUniforms = {
      uTime: { value: 0 },
      uAspect: { value: SCREEN_ASPECT },
      uScreenA: { value: new THREE.Vector3() },
      uScreenB: { value: new THREE.Vector3() },
      uFaceColor: { value: new THREE.Vector3() },
      uDrift: { value: initial.drift },
      uScreenGlow: { value: initial.screenGlow },
      uPixelGrid: { value: initial.pixelGrid },
      uEyeW: { value: initial.eyeW },
      uEyeH: { value: initial.eyeH },
      uEyeSpacing: { value: initial.eyeSpacing },
      uEyeHeight: { value: initial.eyeHeight },
      uEyeRound: { value: initial.eyeRound },
      uMouthW: { value: initial.mouthW },
      uMouthH: { value: initial.mouthH },
      uMouthY: { value: initial.mouthY },
      uMouthCurve: { value: initial.mouthCurve },
      uVoiceMouth: { value: initial.voiceMouth },
      uBlink: { value: 0 },
      uGaze: { value: new THREE.Vector2() },
      uVoice: { value: 0 },
      uMedia: { value: blankMedia as THREE.Texture },
      uMediaMix: { value: 0 },
      uMediaAspect: { value: 1 },
      uShowPlay: { value: 0 },
    }
    const screenGeometry = new THREE.PlaneGeometry(SCREEN_W, SCREEN_H)
    const screenMaterial = new THREE.ShaderMaterial({
      vertexShader: SCREEN_VERTEX,
      fragmentShader: SCREEN_FRAGMENT,
      uniforms: screenUniforms,
    })
    const screen = new THREE.Mesh(screenGeometry, screenMaterial)
    screen.position.set(0, SCREEN_Y, 0.004)

    // ── Speaker cheek ──────────────────────────────────────────────────────
    const cheekX = HEAD_W / 2
    const speaker = new THREE.Group()

    const ringGeometry = new THREE.TorusGeometry(0.335, 0.02, 10, 56)
    const ring = new THREE.Mesh(ringGeometry, darkMaterial)
    ring.rotation.y = Math.PI / 2
    // Just proud of the cheek — flush with it, the shell swallows the ring
    ring.position.set(cheekX + 0.014, 0.02, -0.5)

    const bossGeometry = new THREE.CylinderGeometry(0.22, 0.275, 0.17, 40)
    const boss = new THREE.Mesh(bossGeometry, shellMaterial)
    boss.rotation.z = -Math.PI / 2
    boss.position.set(cheekX + 0.075, 0.02, -0.5)

    const grilleUniforms = { uGrilleColor: { value: new THREE.Vector3() } }
    const grilleGeometry = new THREE.CircleGeometry(0.188, 48)
    const grilleMaterial = new THREE.ShaderMaterial({
      vertexShader: SCREEN_VERTEX,
      fragmentShader: GRILLE_FRAGMENT,
      uniforms: grilleUniforms,
    })
    const grille = new THREE.Mesh(grilleGeometry, grilleMaterial)
    grille.rotation.y = Math.PI / 2
    grille.position.set(cheekX + 0.161, 0.02, -0.5)

    speaker.add(ring, boss, grille)

    // ── Top hood ───────────────────────────────────────────────────────────
    const hoodGeometry = new RoundedBoxGeometry(1.0, 0.18, 0.62, 3, 0.04)
    const hood = new THREE.Mesh(hoodGeometry, darkMaterial)
    hood.rotation.x = -0.18
    hood.position.set(0, HEAD_H / 2 - 0.015, -0.76)

    // ── Front hardware ─────────────────────────────────────────────────────
    // Perforation cluster, arranged in a triangle like the model's vent
    const perfGeometry = new THREE.CircleGeometry(0.015, 12)
    const perforations = new THREE.Group()
    for (let row = 0; row < 4; row++) {
      for (let i = 0; i <= row; i++) {
        const dot = new THREE.Mesh(perfGeometry, darkMaterial)
        dot.position.set(-0.3 + (i - row / 2) * 0.05, -0.36 - row * 0.045, 0.004)
        perforations.add(dot)
      }
    }

    const wellGeometry = new RoundedBoxGeometry(0.115, 0.115, 0.03, 2, 0.022)
    const well = new THREE.Mesh(wellGeometry, darkMaterial)
    well.position.set(0.14, -0.45, 0)

    const buttonGeometry = new THREE.CylinderGeometry(0.039, 0.039, 0.035, 24)
    const button = new THREE.Mesh(buttonGeometry, shellMaterial)
    button.rotation.x = Math.PI / 2
    button.position.set(0.14, -0.45, 0.018)

    // ── Base connectors and cabling ────────────────────────────────────────
    const baseY = -HEAD_H / 2 + 0.02
    const connectorGeometry = new THREE.CylinderGeometry(0.045, 0.05, 0.08, 20)
    const connectors = new THREE.Group()
    const cables = new THREE.Group()
    const cableRuns: THREE.BufferGeometry[] = []

    // Every run is a closed loop: it plugs into a connector on the front lip of
    // the base, swings down and sweeps back underneath, then rises to terminate
    // at the rear underside. Nothing trails off out of frame.
    const runs: { x: number; drop: number; spread: number; loom: boolean }[] = [
      { x: -0.2, drop: 0.2, spread: 1.18, loom: false },
      { x: -0.02, drop: 0.25, spread: 1.05, loom: true },
      { x: 0.17, drop: 0.17, spread: 1.3, loom: false },
    ]
    const FRONT_Z = -0.14
    const REAR_Z = -HEAD_D + 0.08
    for (const run of runs) {
      const plug = new THREE.Mesh(connectorGeometry, metalMaterial)
      plug.position.set(run.x, baseY, FRONT_Z)
      connectors.add(plug)

      const geometry = buildCable(
        [
          [run.x, baseY + 0.02, FRONT_Z],
          [run.x * run.spread, baseY - run.drop, FRONT_Z + 0.02],
          [run.x * run.spread * 1.12, baseY - run.drop * 1.15, -0.5],
          [run.x * run.spread, baseY - run.drop * 0.62, REAR_Z + 0.14],
          [run.x * 0.86, baseY - 0.04, REAR_Z],
        ],
        0.024,
      )
      cableRuns.push(geometry)
      cables.add(new THREE.Mesh(geometry, run.loom ? cableMaterial : braidMaterial))
    }

    // The run off the back of the speaker, as on the poster. Both ends are
    // sunk into solid geometry — the first inside the cheek shell behind a
    // rubber gland, the last in the rear-underside bundle with the base cables
    // — so the tube's open cap is never visible and the wire reads as plugged
    // in rather than cut off in mid-air.
    const grommetPos = new THREE.Vector3(cheekX - 0.02, -0.3, -0.66)
    const grommetDir = new THREE.Vector3(0.18, -0.2, -0.12).normalize()
    const cheekCable = buildCable(
      [
        [cheekX - 0.14, -0.22, -0.72],                // buried inside the cheek
        [grommetPos.x, grommetPos.y, grommetPos.z],   // exits through the gland
        [cheekX + 0.16, -0.5, -0.78],                 // loops out to the right
        [cheekX + 0.06, -0.66, -0.95],                // hangs below the head
        [cheekX - 0.24, -0.62, REAR_Z],               // sweeps to the rear underside
        [cheekX - 0.5, baseY, REAR_Z - 0.02],         // buried in the rear bundle
      ],
      0.022,
    )
    cableRuns.push(cheekCable)
    cables.add(new THREE.Mesh(cheekCable, braidMaterial))

    // Rubber cable gland: wide base seated into the cheek, narrow mouth facing
    // out along the wire, so the run clearly passes through the shell surface
    const grommetGeometry = new THREE.CylinderGeometry(0.03, 0.058, 0.09, 20)
    const grommet = new THREE.Mesh(grommetGeometry, darkMaterial)
    grommet.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), grommetDir)
    grommet.position.copy(grommetPos).addScaledVector(grommetDir, -0.012)
    cables.add(grommet)

    const tvGroup = new THREE.Group()
    tvGroup.add(head, bezel, screen, speaker, hood, perforations, well, button, connectors, cables)
    scene.add(tvGroup)

    // ── Post pass ──────────────────────────────────────────────────────────
    const postScene = new THREE.Scene()
    const postCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
    const postUniforms = {
      tScene: { value: sceneTarget.texture },
      uResolution: { value: new THREE.Vector2(1, 1) },
      uTime: { value: 0 },
      uBloom: { value: initial.bloom },
      uAberration: { value: initial.aberration },
      uFilmGrain: { value: initial.filmGrain },
      uVignette: { value: initial.vignette },
      uBackdrop: { value: initial.backdrop },
      uBackdropColor: { value: new THREE.Vector3() },
      uShadowDepth: { value: initial.shadowDepth },
      uShadowBlur: { value: initial.shadowBlur },
    }
    const postGeometry = new THREE.PlaneGeometry(2, 2)
    const postMaterial = new THREE.ShaderMaterial({
      vertexShader: POST_VERTEX,
      fragmentShader: POST_FRAGMENT,
      uniforms: postUniforms,
      transparent: true,
      depthTest: false,
      depthWrite: false,
    })
    postScene.add(new THREE.Mesh(postGeometry, postMaterial))

    // ── Per-state color targets — re-parsed only when settings change ──────
    const COLOR_KEYS = ['screenA', 'screenB', 'faceColor', 'grilleColor', 'backdropColor'] as const
    const colorUniformFor: Record<(typeof COLOR_KEYS)[number], { value: THREE.Vector3 }> = {
      screenA: screenUniforms.uScreenA,
      screenB: screenUniforms.uScreenB,
      faceColor: screenUniforms.uFaceColor,
      grilleColor: grilleUniforms.uGrilleColor,
      backdropColor: postUniforms.uBackdropColor,
    }
    const colorTargets = {} as Record<TvState, Record<(typeof COLOR_KEYS)[number], THREE.Vector3>>
    // The shell is lit by real lights, so its colors go through THREE.Color
    // (and its color management) rather than the raw-hex path the shaders use
    const shellTargets = {} as Record<
      TvState,
      { shell: THREE.Color; dark: THREE.Color; cable: THREE.Color }
    >
    for (const st of TV_STATES) {
      colorTargets[st] = {} as Record<(typeof COLOR_KEYS)[number], THREE.Vector3>
      for (const k of COLOR_KEYS) colorTargets[st][k] = new THREE.Vector3()
      shellTargets[st] = { shell: new THREE.Color(), dark: new THREE.Color(), cable: new THREE.Color() }
    }
    let appliedSettings: TvSettings | null = null
    const applySettings = (s: TvSettings) => {
      for (const st of TV_STATES) {
        for (const k of COLOR_KEYS) setVec3FromHex(colorTargets[st][k], s.states[st][k])
        shellTargets[st].shell.set(s.states[st].shellColor)
        shellTargets[st].dark.set(s.states[st].shellDark)
        shellTargets[st].cable.set(s.states[st].cableColor)
      }
      appliedSettings = s
    }
    applySettings(settingsRef.current)
    for (const k of COLOR_KEYS) {
      colorUniformFor[k].value.copy(colorTargets[stateRef.current][k])
    }

    // Scalars cross-fade between states; this holds the current lerped values
    const SCALAR_KEYS = [
      'drift', 'screenGlow', 'pixelGrid',
      'eyeW', 'eyeH', 'eyeSpacing', 'eyeHeight', 'eyeRound',
      'mouthW', 'mouthH', 'mouthY', 'mouthCurve', 'voiceMouth',
      'blinkRate', 'gaze', 'yaw', 'pitch', 'lean', 'bob', 'scale',
      'bloom', 'aberration', 'filmGrain', 'vignette', 'backdrop',
      'shadowDepth', 'shadowBlur',
    ] as const
    const cur = {} as Record<(typeof SCALAR_KEYS)[number], number>
    for (const k of SCALAR_KEYS) cur[k] = initial[k]

    // ── Blink and gaze ─────────────────────────────────────────────────────
    // Both are character, not physics: a blink is a fast triangular pulse and
    // the gaze drifts to a new random point every few seconds.
    const BLINK_DURATION = 0.13
    let blinkStart = -10
    let nextBlink = 2
    const gaze = new THREE.Vector2()
    const gazeTarget = new THREE.Vector2()
    let nextGaze = 1.5

    // ── Audio + render loop ────────────────────────────────────────────────
    let freqData: Uint8Array<ArrayBuffer> | null = null
    const clock = new THREE.Clock()
    let rafId: number
    let ampSmooth = 0
    let currentScale = initial.scale
    // Eased cursor steering — head turn and tilt lag the pointer for weight
    let pointerYaw = 0
    let pointerPitch = 0
    // Eased resting turn and screen-media crossfade
    let baseYawEased = baseYawRef.current
    let mediaMix = mediaActiveRef.current ? 1 : 0
    // Our own clock, so `paused` freezes the head on its current frame instead
    // of letting it jump forward when it resumes
    let t = 0

    const draw = () => {
      renderer.setRenderTarget(sceneTarget)
      renderer.render(scene, camera)
      renderer.setRenderTarget(null)
      renderer.render(postScene, postCamera)
    }

    const tick = () => {
      rafId = requestAnimationFrame(tick)

      const dt = Math.min(clock.getDelta(), 0.1)
      if (pausedRef.current) {
        draw()
        return
      }
      t += dt

      const s = settingsRef.current
      if (s !== appliedSettings) applySettings(s)
      const params: TvStateParams = s.states[stateRef.current]
      const ease = s.transition ?? 0.05

      // Same amplitude pipeline as the orbs: mic while listening, TTS playback
      // analyser while replying, speech-impulse fallback, else silence
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
        if (activeAnalyser === playbackAnalyser) {
          targetAmplitude = Math.min(1, targetAmplitude * 1.8)
        }
      } else if (stateRef.current === 'replying' && speechLevelRef) {
        targetAmplitude = speechLevelRef.current
        speechLevelRef.current *= 0.94
      }

      // Everything cross-fades toward the active state's targets
      for (const k of SCALAR_KEYS) cur[k] += (params[k] - cur[k]) * ease
      for (const k of COLOR_KEYS) {
        colorUniformFor[k].value.lerp(colorTargets[stateRef.current][k], ease)
      }
      ampSmooth += (targetAmplitude - ampSmooth) * 0.12
      // Mic/TTS averages sit well below 1.0 — lift them into a usable range
      const voice = Math.min(1, ampSmooth * 2.2)

      const shellTarget = shellTargets[stateRef.current]
      shellMaterial.color.lerp(shellTarget.shell, ease)
      darkMaterial.color.lerp(shellTarget.dark, ease)
      cableMaterial.color.lerp(shellTarget.cable, ease)

      // Blink: schedule the next from the state's restlessness, then run it as
      // a triangular open → shut → open pulse
      if (t > nextBlink) {
        blinkStart = t
        nextBlink = t + (6.5 - cur.blinkRate * 5) * (0.55 + Math.random())
      }
      const blinkT = (t - blinkStart) / BLINK_DURATION
      screenUniforms.uBlink.value = blinkT <= 1 ? 1 - Math.abs(blinkT * 2 - 1) : 0

      // Gaze: a new resting point every few seconds, eased into
      if (t > nextGaze) {
        gazeTarget.set((Math.random() - 0.5) * 0.12, (Math.random() - 0.5) * 0.07)
        nextGaze = t + 1.4 + Math.random() * 3
      }
      gaze.lerp(gazeTarget, 0.045)
      // Steer toward the cursor: eased so a quick flick reads as a follow, not
      // a snap. y is inverted — screen-space up is +, pointer-down is +.
      const px = pointerRef.current.x
      const py = pointerRef.current.y
      pointerYaw += (px * 0.5 - pointerYaw) * 0.05
      pointerPitch += (py * 0.26 - pointerPitch) * 0.05
      screenUniforms.uGaze.value
        .set(gaze.x + px * 0.16, gaze.y - py * 0.09)
        .multiplyScalar(cur.gaze)

      screenUniforms.uTime.value = t
      screenUniforms.uDrift.value = cur.drift
      screenUniforms.uScreenGlow.value = cur.screenGlow
      screenUniforms.uPixelGrid.value = cur.pixelGrid
      screenUniforms.uEyeW.value = cur.eyeW
      screenUniforms.uEyeH.value = cur.eyeH
      screenUniforms.uEyeSpacing.value = cur.eyeSpacing
      screenUniforms.uEyeHeight.value = cur.eyeHeight
      screenUniforms.uEyeRound.value = cur.eyeRound
      screenUniforms.uMouthW.value = cur.mouthW
      screenUniforms.uMouthH.value = cur.mouthH
      screenUniforms.uMouthY.value = cur.mouthY
      screenUniforms.uMouthCurve.value = cur.mouthCurve
      screenUniforms.uVoiceMouth.value = cur.voiceMouth
      screenUniforms.uVoice.value = voice

      // Screen media: swap in the loaded texture, crossfade toward it while
      // active, and show/hide the play glyph
      const mt = mediaTextureRef.current ?? blankMedia
      if (screenUniforms.uMedia.value !== mt) screenUniforms.uMedia.value = mt
      screenUniforms.uMediaAspect.value = mediaAspectRef.current
      mediaMix += ((mediaActiveRef.current ? 1 : 0) - mediaMix) * 0.08
      screenUniforms.uMediaMix.value = mediaMix
      screenUniforms.uShowPlay.value = showPlayRef.current ? 1 : 0

      // Idle motion: the head rests facing straight front (`baseYaw`, 0° by
      // default), steers toward the cursor from there, with a gentle drift
      // layered on top. The per-state `cur.yaw` cheek turn is intentionally not
      // applied so the head faces you head-on when the pointer is centered.
      baseYawEased += (baseYawRef.current - baseYawEased) * 0.06
      tvGroup.rotation.y = baseYawEased + pointerYaw + Math.sin(t * 0.31) * 0.07 * cur.bob
      tvGroup.rotation.x = pointerPitch + cur.pitch + Math.sin(t * 0.23) * 0.05 * cur.bob - 0.03
      tvGroup.rotation.z += (cur.lean + Math.sin(t * 0.19) * 0.02 * cur.bob - tvGroup.rotation.z) * 0.06
      tvGroup.position.y = Math.sin(t * 0.85) * 0.012 * cur.bob

      const targetScale = cur.scale * (1 + voice * 0.02)
      currentScale += (targetScale - currentScale) * 0.06
      // The single knob every placement shares, so the head sits the same size
      // in its box everywhere — hero, CTA, mobile and the side-quest modal alike
      // (the video section scales this up further via VIDEO_SCALE).
      tvGroup.scale.setScalar(currentScale * 0.7)

      postUniforms.uTime.value = t
      postUniforms.uBloom.value = cur.bloom
      postUniforms.uAberration.value = cur.aberration
      postUniforms.uFilmGrain.value = cur.filmGrain
      postUniforms.uVignette.value = cur.vignette
      postUniforms.uBackdrop.value = cur.backdrop
      postUniforms.uShadowDepth.value = cur.shadowDepth
      postUniforms.uShadowBlur.value = cur.shadowBlur

      draw()
    }

    const resize = () => {
      const w = mount.clientWidth
      const h = mount.clientHeight
      if (!w || !h) return
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
      // The post buffer is sized in device pixels, not CSS pixels
      const dpr = renderer.getPixelRatio()
      sceneTarget.setSize(w * dpr, h * dpr)
      postUniforms.uResolution.value.set(w * dpr, h * dpr)
    }
    resize()
    tick()

    const ro = new ResizeObserver(resize)
    ro.observe(mount)

    // Track the cursor across the whole window, not just the canvas, so the
    // head keeps following even when the pointer is off over the page content
    const onPointerMove = (e: PointerEvent) => {
      pointerRef.current.x = (e.clientX / window.innerWidth) * 2 - 1
      pointerRef.current.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointermove', onPointerMove)

    // Screen hit-testing — pointer feedback + click-to-activate while media is
    // showing. Raycast against the screen plane only.
    const raycaster = new THREE.Raycaster()
    const ndc = new THREE.Vector2()
    const hitsScreen = (e: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      ndc.set(
        ((e.clientX - rect.left) / rect.width) * 2 - 1,
        -((e.clientY - rect.top) / rect.height) * 2 + 1,
      )
      raycaster.setFromCamera(ndc, camera)
      return raycaster.intersectObject(screen, false).length > 0
    }
    const onCanvasMove = (e: PointerEvent) => {
      renderer.domElement.style.cursor =
        mediaActiveRef.current && onScreenActivateRef.current && hitsScreen(e)
          ? 'pointer'
          : ''
    }
    const onCanvasClick = (e: PointerEvent) => {
      if (mediaActiveRef.current && onScreenActivateRef.current && hitsScreen(e)) {
        onScreenActivateRef.current()
      }
    }
    renderer.domElement.addEventListener('pointermove', onCanvasMove)
    renderer.domElement.addEventListener('pointerdown', onCanvasClick)

    return () => {
      cancelAnimationFrame(rafId)
      ro.disconnect()
      window.removeEventListener('pointermove', onPointerMove)
      renderer.domElement.removeEventListener('pointermove', onCanvasMove)
      renderer.domElement.removeEventListener('pointerdown', onCanvasClick)
      headGeometry.dispose()
      bezelGeometry.dispose()
      screenGeometry.dispose()
      ringGeometry.dispose()
      bossGeometry.dispose()
      grilleGeometry.dispose()
      hoodGeometry.dispose()
      perfGeometry.dispose()
      wellGeometry.dispose()
      buttonGeometry.dispose()
      connectorGeometry.dispose()
      grommetGeometry.dispose()
      for (const g of cableRuns) g.dispose()
      postGeometry.dispose()
      shellMaterial.dispose()
      darkMaterial.dispose()
      cableMaterial.dispose()
      braidMaterial.dispose()
      metalMaterial.dispose()
      screenMaterial.dispose()
      grilleMaterial.dispose()
      postMaterial.dispose()
      sceneTarget.dispose()
      noise.dispose()
      grunge.dispose()
      blankMedia.dispose()
      envRT.dispose()
      pmrem.dispose()
      renderer.dispose()
      mount.removeChild(renderer.domElement)
    }
  }, [analyserRef, playbackAnalyserRef, speechLevelRef])

  return (
    <div ref={mountRef} className={className} style={MOUNT_STYLE}>
      {webglFailed && <div style={FALLBACK_STYLE} aria-hidden="true" />}
    </div>
  )
}
