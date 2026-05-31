from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageChops, ImageFilter


TARGET_SIZE = 512
PIVOT_X = 256
PIVOT_Y = 450


def color_distance(pixel: tuple[int, int, int], key: tuple[int, int, int]) -> int:
    return abs(pixel[0] - key[0]) + abs(pixel[1] - key[1]) + abs(pixel[2] - key[2])


def remove_key(image: Image.Image) -> Image.Image:
    rgba = image.convert("RGBA")
    width, height = rgba.size
    samples = [
        rgba.getpixel((0, 0))[:3],
        rgba.getpixel((width - 1, 0))[:3],
        rgba.getpixel((0, height - 1))[:3],
        rgba.getpixel((width - 1, height - 1))[:3],
    ]
    key = tuple(sum(sample[i] for sample in samples) // len(samples) for i in range(3))

    pixels = rgba.load()
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            distance = color_distance((r, g, b), key)
            greenish = g > 130 and g > r * 1.25 and g > b * 1.25
            magentaish = r > 130 and b > 130 and g < 120
            if distance < 80 or greenish or magentaish:
                pixels[x, y] = (r, g, b, 0)
            elif distance < 150:
                alpha = max(0, min(255, int((distance - 80) / 70 * 255)))
                pixels[x, y] = (r, g, b, min(a, alpha))
    alpha = rgba.getchannel("A").filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.45))
    rgba.putalpha(alpha)
    return rgba


def fit_to_fixed_canvas(source: Image.Image) -> Image.Image:
    alpha = source.getchannel("A")
    bbox = alpha.getbbox()
    if not bbox:
        raise ValueError("No subject found after chroma-key removal")

    subject = source.crop(bbox)
    width, height = subject.size
    scale = min(390 / max(1, width), 430 / max(1, height), 1.4)
    new_size = (max(1, round(width * scale)), max(1, round(height * scale)))
    subject = subject.resize(new_size, Image.Resampling.LANCZOS)

    canvas = Image.new("RGBA", (TARGET_SIZE, TARGET_SIZE), (0, 0, 0, 0))
    left = round(PIVOT_X - new_size[0] / 2)
    top = round(PIVOT_Y - new_size[1])
    canvas.alpha_composite(subject, (left, top))
    return canvas


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True)
    parser.add_argument("--out", required=True)
    args = parser.parse_args()

    source = Image.open(args.input)
    keyed = remove_key(source)
    fixed = fit_to_fixed_canvas(keyed)
    Path(args.out).parent.mkdir(parents=True, exist_ok=True)
    fixed.save(args.out)


if __name__ == "__main__":
    main()
