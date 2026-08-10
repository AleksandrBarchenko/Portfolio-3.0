"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

import { faceFragmentShader, faceVertexShader } from "./facePoints.glsl";

// Number of points across the longer axis. ~200 → ~40k points, one draw call.
const DENSITY = 200;
// Monochrome tint: full mix toward white keeps only the photo's luminance,
// rendering the portrait as a silver/grey point cloud.
const TINT = new THREE.Color(1.0, 1.0, 1.0);
// Max head rotation while tracking the pointer (radians). Keeps the 2.5D relief
// convincing — beyond this the flat back edge would show.
const MAX_YAW = 0.32;
const MAX_PITCH = 0.2;

export default function FacePoints() {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const { viewport } = useThree();

  // Normalized pointer across the whole viewport (-1..1), tracked on window so
  // the head follows the cursor anywhere on the page.
  const pointer = useRef({ x: 0, y: 0 });
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener("pointermove", onMove);
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  const [colorMap, depthMap, maskMap] = useTexture([
    "/face/color.png",
    "/face/depth.png",
    "/face/mask.png",
  ]);

  // Color texture is sRGB; depth/mask are raw data.
  colorMap.colorSpace = THREE.SRGBColorSpace;
  depthMap.colorSpace = THREE.NoColorSpace;
  maskMap.colorSpace = THREE.NoColorSpace;

  const aspect =
    (colorMap.image?.width ?? 1) / (colorMap.image?.height ?? 1);

  // Build the point grid once. Plane height = 2 units; width follows aspect.
  const geometry = useMemo(() => {
    const height = 2;
    const width = height * aspect;
    const cols = Math.max(2, Math.round(DENSITY * Math.min(1, aspect)));
    const rows = Math.max(2, Math.round(DENSITY / Math.max(1, aspect)));

    const count = cols * rows;
    const positions = new Float32Array(count * 3);
    const uvs = new Float32Array(count * 2);
    const randoms = new Float32Array(count);

    let i = 0;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        const u = x / (cols - 1);
        const v = y / (rows - 1);
        positions[i * 3] = (u - 0.5) * width;
        positions[i * 3 + 1] = (0.5 - v) * height; // flip Y (texture space)
        positions[i * 3 + 2] = 0;
        uvs[i * 2] = u;
        uvs[i * 2 + 1] = 1 - v; // flip V to match image orientation
        randoms[i] = Math.random();
        i++;
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geo.setAttribute("aUv", new THREE.BufferAttribute(uvs, 2));
    geo.setAttribute("aRandom", new THREE.BufferAttribute(randoms, 1));
    return geo;
  }, [aspect]);

  const uniforms = useMemo(
    () => ({
      uColor: { value: colorMap },
      uDepth: { value: depthMap },
      uMask: { value: maskMap },
      uTime: { value: 0 },
      uDepthScale: { value: 0.7 },
      uPointSize: { value: 9 },
      uPixelRatio: { value: 1 },
      uTint: { value: TINT },
      uTintAmount: { value: 1.0 },
    }),
    [colorMap, depthMap, maskMap],
  );

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = t;
      materialRef.current.uniforms.uPixelRatio.value = Math.min(
        state.gl.getPixelRatio(),
        2,
      );
    }

    const points = pointsRef.current;
    if (!points) return;

    // Target rotation from pointer + gentle idle drift.
    const idleY = Math.sin(t * 0.5) * 0.06;
    const idleX = Math.sin(t * 0.4 + 1.2) * 0.03;
    const targetY = pointer.current.x * MAX_YAW + idleY;
    const targetX = pointer.current.y * MAX_PITCH + idleX;

    const damp = 1 - Math.pow(0.001, delta); // frame-rate independent easing
    points.rotation.y += (targetY - points.rotation.y) * damp;
    points.rotation.x += (targetX - points.rotation.x) * damp;
  });

  // Scale the whole cloud to comfortably fill the square panel.
  const scale = Math.min(viewport.width, viewport.height) * 0.62;

  return (
    <points ref={pointsRef} geometry={geometry} scale={scale}>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={faceVertexShader}
        fragmentShader={faceFragmentShader}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
