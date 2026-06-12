#!/usr/bin/env python3
"""将球星卡规范为 800×1200（2:3）：按高度等比缩放后水平居中裁切/补边，绝不拉伸。"""
from __future__ import annotations

import sys
from pathlib import Path

from PIL import Image

TARGET_W = 800
TARGET_H = 1200


def normalize_card(src: Path, dst: Path) -> None:
    im = Image.open(src).convert('RGBA')
    src_w, src_h = im.size

    scale = TARGET_H / src_h
    scaled_w = max(1, round(src_w * scale))
    im = im.resize((scaled_w, TARGET_H), Image.Resampling.LANCZOS)

    if scaled_w > TARGET_W:
        left = (scaled_w - TARGET_W) // 2
        im = im.crop((left, 0, left + TARGET_W, TARGET_H))
    elif scaled_w < TARGET_W:
        canvas = Image.new('RGBA', (TARGET_W, TARGET_H), (0, 0, 0, 0))
        canvas.paste(im, ((TARGET_W - scaled_w) // 2, 0))
        im = canvas

    dst.parent.mkdir(parents=True, exist_ok=True)
    im.save(dst, format='PNG', optimize=True)
    print(f'{src.name} {src_w}x{src_h} -> {dst.name} {im.size}')


def main() -> None:
    if len(sys.argv) < 3:
        raise SystemExit('Usage: normalize-scout-card.py <src> <dst>')
    normalize_card(Path(sys.argv[1]), Path(sys.argv[2]))


if __name__ == '__main__':
    main()
