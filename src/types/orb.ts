import type { MutableRefObject } from 'react'

export type OrbMode = 'chat' | 'voice'

export type OrbState =
  | 'idle'
  | 'listening'
  | 'thinking'
  | 'replying'

export const ORB_STATES: readonly OrbState[] = [
  'idle',
  'listening',
  'thinking',
  'replying',
]

/**
 * The contract every orb variant's canvas component implements — the
 * conversation page and the lab drive any orb through these props. Each
 * variant adds its own `settings` prop shape on top.
 */
export interface OrbCanvasBaseProps {
  /** Current interaction state — drives color, glow, motion and displacement */
  state: OrbState
  /** Stable ref from useAudioVisualization — .current is null when the mic is off */
  analyserRef?: MutableRefObject<AnalyserNode | null>
  /** Analyser attached to the reply audio playback (OpenAI TTS via Web Audio) */
  playbackAnalyserRef?: MutableRefObject<AnalyserNode | null>
  /** Word-impulse level (0–1) for the speechSynthesis fallback path */
  speechLevelRef?: MutableRefObject<number>
  className?: string
}

/** Orb V1's canvas props — base contract plus its settings shape */
export interface OrbCanvasProps extends OrbCanvasBaseProps {
  /** Palette and per-state animation targets */
  settings?: OrbSettings
}

/** The orb's iridescent palette. All values are hex strings. */
export interface OrbPalette {
  cyan: string
  blue: string
  pink: string
  violet: string
  cream: string
  mint: string
  core: string
}

/** Animation targets for one interaction state. Colors are hex strings. */
export interface OrbStateParams {
  /** Shader palette for this state — colors cross-fade on state changes */
  palette: OrbPalette
  /** Overall energy — drives flow speed and spin (0–1.2) */
  activity: number
  /** Brightness boost at silence (0–1.2) */
  glow: number
  /** Brightness boost at peak voice amplitude — equal to glow when mic is off */
  maxGlow: number
  /** Surface noise displacement at rest (0–0.15) */
  displace: number
  /** Maximum displacement at peak amplitude — equal to displace when mic is off */
  maxDisplace: number
  /** Accent color blended in proportionally to activity */
  tint: string
  /** Resting scale — the orb's size when amplitude is zero */
  baseScale: number
  /** Maximum scale at peak amplitude. Equal to baseScale for states with no mic input. */
  maxScale: number
  /** Background bloom spread — multiplies the glow's size (0 = none, 1 = orb-hugging, >1 = wide) */
  bloom: number
}

export interface OrbSettings {
  states: Record<OrbState, OrbStateParams>
  /**
   * Per-frame easing for state transitions — how fast the orb morphs between
   * states (0.01 = very slow drift, 0.2 = snappy). Optional so settings JSON
   * copied before this existed keeps working; defaults to 0.05.
   */
  transition?: number
}
