// Shaders for the depth-displaced particle portrait.
// Vertex: displaces each grid point along Z by the photo's depth map, sizes it
// with perspective attenuation, and collapses points that fall outside the
// subject mask. Fragment: soft round point, photo color mixed toward the blue
// "AI" tint while preserving luminance so facial detail survives.

export const faceVertexShader = /* glsl */ `
  uniform sampler2D uDepth;
  uniform sampler2D uMask;
  uniform float uTime;
  uniform float uDepthScale;
  uniform float uPointSize;
  uniform float uPixelRatio;

  attribute vec2 aUv;
  attribute float aRandom;

  varying vec2 vUv;
  varying float vMask;
  varying float vRandom;
  varying float vDepth;

  void main() {
    vUv = aUv;
    vRandom = aRandom;

    float depth = texture2D(uDepth, aUv).r;
    float mask = texture2D(uMask, aUv).r;
    vMask = mask;
    vDepth = depth;

    vec3 pos = position;
    // Push toward the camera by depth (centered around the mid plane).
    pos.z += (depth - 0.5) * uDepthScale;
    // Subtle living shimmer.
    pos.x += sin(uTime * 0.8 + aRandom * 6.2831) * 0.004;
    pos.y += cos(uTime * 0.7 + aRandom * 6.2831) * 0.004;

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    float size = uPointSize * (0.65 + depth * 0.8);
    gl_PointSize = size * uPixelRatio * (1.0 / -mv.z);

    // Drop background points (outside the cutout mask).
    if (mask < 0.15) {
      gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
      gl_PointSize = 0.0;
    }
  }
`;

export const faceFragmentShader = /* glsl */ `
  uniform sampler2D uColor;
  uniform vec3 uTint;
  uniform float uTintAmount;

  varying vec2 vUv;
  varying float vMask;
  varying float vRandom;
  varying float vDepth;

  void main() {
    // Soft circular sprite.
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    if (d > 0.5) discard;
    float alpha = smoothstep(0.5, 0.08, d);

    vec3 col = texture2D(uColor, vUv).rgb;
    float lum = dot(col, vec3(0.299, 0.587, 0.114));

    // Blue-tinted but detail-preserving: keep the photo's luminance structure,
    // shift chroma toward the AI palette.
    vec3 tinted = mix(col, uTint * (0.35 + lum * 1.15), uTintAmount);
    tinted += vRandom * 0.04;

    gl_FragColor = vec4(tinted, alpha * vMask);
  }
`;
