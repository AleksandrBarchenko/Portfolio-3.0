"""Preprocess a portrait photo into particle-portrait assets.

Outputs (into public/face/):
  - color.png : downscaled, background-removed RGBA portrait (particle colors)
  - mask.png  : grayscale alpha mask (white = subject, black = background)
  - depth.png : grayscale monocular depth map (white = near, black = far)

Run once during setup:
  .venv-face/bin/python scripts/preprocess-face.py <input_photo> [--size 512]

Deps (into .venv-face):
  pip install rembg onnxruntime pillow numpy torch transformers
"""
from __future__ import annotations

import argparse
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "public" / "face"


def load_and_resize(path: Path, size: int) -> Image.Image:
    img = Image.open(path).convert("RGB")
    img.thumbnail((size, size), Image.LANCZOS)
    return img


def remove_background(img: Image.Image) -> Image.Image:
    """Return an RGBA image with the background made transparent."""
    from rembg import remove  # imported lazily so --help works without deps

    return remove(img).convert("RGBA")


def estimate_depth(img: Image.Image) -> Image.Image:
    """Monocular depth via Depth Anything V2 (small). White = near."""
    import torch
    from transformers import pipeline

    device = "mps" if torch.backends.mps.is_available() else "cpu"
    pipe = pipeline(
        task="depth-estimation",
        model="depth-anything/Depth-Anything-V2-Small-hf",
        device=device,
    )
    depth = pipe(img)["depth"]  # PIL 'L' image, brighter = nearer
    return depth.convert("L").resize(img.size, Image.LANCZOS)


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("input", type=Path, help="path to the source portrait photo")
    ap.add_argument("--size", type=int, default=512, help="longest edge (px)")
    args = ap.parse_args()

    if not args.input.exists():
        print(f"error: input not found: {args.input}", file=sys.stderr)
        return 1

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    print("1/3 resize…")
    base = load_and_resize(args.input, args.size)

    print("2/3 background cutout (rembg)…")
    cutout = remove_background(base)  # RGBA
    alpha = cutout.split()[-1]

    print("3/3 depth (Depth Anything V2)…")
    depth = estimate_depth(base)

    # Zero out depth outside the subject so background particles are dropped.
    depth_arr = np.asarray(depth, dtype=np.uint8)
    alpha_arr = np.asarray(alpha, dtype=np.uint8)
    depth_arr = np.where(alpha_arr > 16, depth_arr, 0).astype(np.uint8)
    depth = Image.fromarray(depth_arr, mode="L")

    cutout.save(OUT_DIR / "color.png")
    alpha.save(OUT_DIR / "mask.png")
    depth.save(OUT_DIR / "depth.png")
    print(f"done → {OUT_DIR}/{{color,mask,depth}}.png  ({base.size[0]}x{base.size[1]})")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
