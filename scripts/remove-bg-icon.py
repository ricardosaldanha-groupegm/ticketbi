#!/usr/bin/env python3
"""Remove solid background from PNG and ensure transparency. Preserves white/black that are part of the icon."""
from PIL import Image
import os

def color_dist(c1, c2):
    return sum((a - b) ** 2 for a, b in zip(c1[:3], c2[:3])) ** 0.5

def remove_background(input_path: str, output_path: str, tolerance: int = 20):
    img = Image.open(input_path).convert("RGBA")
    w, h = img.size
    pixels = img.load()
    # Sample corners and edges to detect background color(s)
    samples = [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1),
               (w // 2, 0), (w // 2, h - 1), (0, h // 2), (w - 1, h // 2)]
    bg_colors = []
    seen = set()
    for x, y in samples:
        px = pixels[x, y]
        if px[3] < 128:
            continue
        key = px[:3]
        if key not in seen:
            seen.add(key)
            bg_colors.append(key)
    # Fallback: black only (icon has white outline - must not remove)
    if not bg_colors:
        bg_colors = [(0, 0, 0)]
    # Make pixels matching background (within tolerance) transparent
    if bg_colors:
        for y in range(h):
            for x in range(w):
                r, g, b, a = pixels[x, y]
                if a == 0:
                    continue
                for bg in bg_colors:
                    if color_dist((r, g, b), bg) <= tolerance:
                        pixels[x, y] = (r, g, b, 0)
                        break
    # Resize if too large (reduces file size)
    if w > 512 or h > 512:
        img = img.resize((min(512, w), min(512, h)), Image.Resampling.LANCZOS)
    img.save(output_path, "PNG", optimize=True)
    print(f"Saved to {output_path} ({os.path.getsize(output_path) // 1024} KB)")

if __name__ == "__main__":
    base = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    src = os.path.join(base, "public", "ticketbi-icon.png")
    remove_background(src, src)
