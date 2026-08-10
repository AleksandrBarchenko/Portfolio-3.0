import type { OrbSettings } from '@/types/orb'

/**
 * Default look, sampled from the reference image. The render loop lerps the
 * live uniforms toward the active state's values, so state changes always
 * transition smoothly.
 *
 * Scale semantics:
 *   baseScale — resting size when amplitude is zero
 *   maxScale  — ceiling at peak amplitude (set equal to baseScale for idle
 *               since the mic is off and there is nothing to react to)
 */
export const DEFAULT_ORB_SETTINGS: OrbSettings = {
  "transition": 0.04,
  "states": {
    "idle": {
      "palette": {
        "cyan": "#fff15c",
        "blue": "#ffffff",
        "pink": "#ff9999",
        "violet": "#ffffff",
        "cream": "#ffffff",
        "mint": "#ffffff",
        "core": "#b8f7ff"
      },
      "activity": 0.2,
      "glow": 0.47,
      "maxGlow": 0.96,
      "displace": 0.06,
      "maxDisplace": 0.108,
      "tint": "#e26060",
      "baseScale": 0.7,
      "maxScale": 1.15,
      "bloom": 0.18
    },
    "listening": {
      "palette": {
        "cyan": "#57a2ff",
        "blue": "#ffffff",
        "pink": "#b899ff",
        "violet": "#ffffff",
        "cream": "#ffffff",
        "mint": "#ffffff",
        "core": "#b8f7ff"
      },
      "activity": 1,
      "glow": 0.56,
      "maxGlow": 1,
      "displace": 0.02,
      "maxDisplace": 0.25,
      "tint": "#ffffff",
      "baseScale": 0.85,
      "maxScale": 2,
      "bloom": 0.69
    },
    "thinking": {
      "palette": {
        "cyan": "#57a2ff",
        "blue": "#f5feff",
        "pink": "#0084ff",
        "violet": "#ffffff",
        "cream": "#ffffff",
        "mint": "#ffffff",
        "core": "#ffffff"
      },
      "activity": 1.2,
      "glow": 0.8,
      "maxGlow": 0.2,
      "displace": 0,
      "maxDisplace": 0,
      "tint": "#bdfffe",
      "baseScale": 0.6,
      "maxScale": 0.3,
      "bloom": 0.65
    },
    "replying": {
      "palette": {
        "cyan": "#f1ffa8",
        "blue": "#ffffff",
        "pink": "#ff9999",
        "violet": "#ffffff",
        "cream": "#ffffff",
        "mint": "#ffffff",
        "core": "#b8f7ff"
      },
      "activity": 0.6,
      "glow": 0.56,
      "maxGlow": 0.6,
      "displace": 0.074,
      "maxDisplace": 0.181,
      "tint": "#c18a8a",
      "baseScale": 0.68,
      "maxScale": 0.92,
      "bloom": 0.52
    }
  }
}
