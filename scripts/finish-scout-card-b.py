#!/usr/bin/env python3
"""B 版球星卡后处理：洋红/暗底抠透明 → 等比置入 800×1200 透明画布。"""
from __future__ import annotations

import sys
from io import BytesIO
from pathlib import Path

from PIL import Image

try:
    from rembg import remove as rembg_remove
except ImportError:  # pragma: no cover
    rembg_remove = None

TARGET_W = 800
TARGET_H = 1200
KEY = (255, 0, 255)
MAGENTA_TOL = 62
DARK_MAX = 42


def color_dist(rgb: tuple[int, ...], key: tuple[int, int, int]) -> float:
    return ((rgb[0] - key[0]) ** 2 + (rgb[1] - key[1]) ** 2 + (rgb[2] - key[2]) ** 2) ** 0.5


def chroma_key(im: Image.Image) -> Image.Image:
    im = im.convert('RGBA')
    px = im.load()
    w, h = im.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if a == 0:
                continue
            if color_dist((r, g, b), KEY) <= MAGENTA_TOL:
                px[x, y] = (0, 0, 0, 0)
    return im


def flood_transparent(im: Image.Image) -> Image.Image:
    px = im.load()
    w, h = im.size
    stack: list[tuple[int, int]] = []
    for x in range(w):
        stack.extend([(x, 0), (x, h - 1)])
    for y in range(h):
        stack.extend([(0, y), (w - 1, y)])

    seen: set[tuple[int, int]] = set()

    def should_clear(r: int, g: int, b: int, a: int) -> bool:
        if a == 0:
            return False
        if color_dist((r, g, b), KEY) <= MAGENTA_TOL + 20:
            return True
        return (r + g + b) <= DARK_MAX

    while stack:
        x, y = stack.pop()
        if (x, y) in seen or x < 0 or y < 0 or x >= w or y >= h:
            continue
        seen.add((x, y))
        r, g, b, a = px[x, y]
        if not should_clear(r, g, b, a):
            continue
        px[x, y] = (0, 0, 0, 0)
        stack.extend([(x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)])
    return im


def transparent_ratio(im: Image.Image) -> float:
    px = im.convert('RGBA').load()
    w, h = im.size
    trans = sum(1 for y in range(h) for x in range(w) if px[x, y][3] < 20)
    return trans / (w * h)


def rembg_fallback(im: Image.Image) -> Image.Image:
    if rembg_remove is None:
        return im
    buf = BytesIO()
    im.convert('RGBA').save(buf, format='PNG')
    out = rembg_remove(buf.getvalue())
    return Image.open(BytesIO(out)).convert('RGBA')


def place_on_canvas(im: Image.Image) -> Image.Image:
    bbox = im.getbbox()
    if not bbox:
        return Image.new('RGBA', (TARGET_W, TARGET_H), (0, 0, 0, 0))
    cropped = im.crop(bbox)
    scale = min(TARGET_W / cropped.width, TARGET_H / cropped.height)
    new_w = max(1, round(cropped.width * scale))
    new_h = max(1, round(cropped.height * scale))
    resized = cropped.resize((new_w, new_h), Image.Resampling.LANCZOS)
    canvas = Image.new('RGBA', (TARGET_W, TARGET_H), (0, 0, 0, 0))
    canvas.paste(resized, ((TARGET_W - new_w) // 2, (TARGET_H - new_h) // 2), resized)
    return canvas


def finish_card(src: Path, dst: Path) -> None:
    im = Image.open(src).convert('RGBA')
    im = chroma_key(im)
    im = flood_transparent(im)
    if transparent_ratio(im) < 0.12:
        im = rembg_fallback(Image.open(src).convert('RGBA'))
        im = flood_transparent(im)
    out = place_on_canvas(im)
    dst.parent.mkdir(parents=True, exist_ok=True)
    out.save(dst, format='PNG', optimize=True)
    print(f'{src.name} -> {dst.name} transparent={transparent_ratio(out):.1%}')


def main() -> None:
    if len(sys.argv) < 3:
        raise SystemExit('Usage: finish-scout-card-b.py <src> <dst>')
    finish_card(Path(sys.argv[1]), Path(sys.argv[2]))


if __name__ == '__main__':
    main()
