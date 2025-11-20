#!/usr/bin/env python3
"""
Batch watermark Daily Reflection images with a subtle, transparent logo.

Features
- Places a PNG logo at configurable positions (top-center default)
- Automatically picks white or dark logo based on local background brightness
- Adjustable opacity and relative logo size
- Padding as percent of image
- Preserves EXIF when possible
- Safe output to a separate directory (or in-place with --inplace)

Usage
------
python watermark_reflections.py \
  --input "./reflections/*.jpg" \
  --output "./reflections_watermarked" \
  --logo-white "/mnt/data/logo-white.png" \
  --logo-dark "/mnt/data/logo.png" \
  --position top-center \
  --scale 0.18 \
  --opacity 0.28 \
  --padding 0.03

Positions: top-left, top-center, top-right, center-left, center, center-right,
           bottom-left, bottom-center, bottom-right
"""

import os, glob, argparse, math
from PIL import Image, ImageStat, ImageFilter

def parse_args():
    p = argparse.ArgumentParser(description="Batch watermark JPGs with a subtle logo.")
    p.add_argument("--input", required=True, help="Glob for input images (e.g., './images/*.jpg')")
    p.add_argument("--output", default=None, help="Output directory (default: <input_root>_wm). Ignored if --inplace")
    p.add_argument("--inplace", action="store_true", help="Overwrite images in place (writes a backup when possible)")
    p.add_argument("--logo-white", required=True, help="Path to white/bright logo PNG with alpha")
    p.add_argument("--logo-dark", required=True, help="Path to dark logo PNG with alpha")
    p.add_argument("--position", default="top-center",
                   choices=[
                       "top-left","top-center","top-right",
                       "center-left","center","center-right",
                       "bottom-left","bottom-center","bottom-right"
                   ], help="Watermark position (default: top-center)")
    p.add_argument("--scale", type=float, default=0.18, help="Logo width as fraction of image width (default: 0.18)")
    p.add_argument("--opacity", type=float, default=0.28, help="Logo opacity (0..1), default=0.28")
    p.add_argument("--padding", type=float, default=0.03, help="Padding from edges as fraction of min(img_w,img_h), default=0.03")
    p.add_argument("--shadow", type=float, default=0.0, help="Add a soft shadow behind logo (0..1 intensity). Default 0 (off)")
    p.add_argument("--luma-threshold", type=float, default=0.6, help="0..1 threshold; below => use white logo, above => dark (default 0.6)")
    p.add_argument("--quality", type=int, default=92, help="JPEG quality (default 92)")
    return p.parse_args()

def srgb_to_luma(pixel):
    # pixel is (R,G,B) 0..255
    r,g,b = pixel
    return 0.2126*r + 0.7152*g + 0.0722*b  # 0..255

def local_luminance(img, box):
    region = img.crop(box).convert("RGB")
    stat = ImageStat.Stat(region)
    # mean returns per-channel averages
    r,g,b = stat.mean
    return srgb_to_luma((r,g,b))/255.0  # 0..1

def compute_position(img_w, img_h, wm_w, wm_h, position, pad_px):
    positions = {
        "top-left":      (pad_px, pad_px),
        "top-center":    ((img_w - wm_w)//2, pad_px),
        "top-right":     (img_w - wm_w - pad_px, pad_px),
        "center-left":   (pad_px, (img_h - wm_h)//2),
        "center":        ((img_w - wm_w)//2, (img_h - wm_h)//2),
        "center-right":  (img_w - wm_w - pad_px, (img_h - wm_h)//2),
        "bottom-left":   (pad_px, img_h - wm_h - pad_px),
        "bottom-center": ((img_w - wm_w)//2, img_h - wm_h - pad_px),
        "bottom-right":  (img_w - wm_w - pad_px, img_h - wm_h - pad_px),
    }
    return positions[position]

def apply_opacity(logo, opacity):
    if logo.mode != "RGBA":
        logo = logo.convert("RGBA")
    alpha = logo.split()[-1]
    alpha = alpha.point(lambda a: int(a * max(0.0, min(1.0, opacity))))
    logo.putalpha(alpha)
    return logo

def add_shadow(base, logo, xy, strength=0.25):
    # simple blurred black shadow under logo
    if strength <= 0: return base
    x,y = xy
    shadow = Image.new("RGBA", logo.size, (0,0,0,0))
    # Build a solid alpha silhouette
    silhouette = Image.new("RGBA", logo.size, (0,0,0,int(180*strength)))
    # Use logo's alpha as mask
    shadow.paste(silhouette, (0,0), logo.split()[-1])
    blurred = shadow.filter(ImageFilter.GaussianBlur(radius=max(1, int(min(logo.size)*0.02))))
    base.alpha_composite(blurred, (x+1, y+1))
    return base

def main():
    args = parse_args()
    files = sorted(glob.glob(args.input))
    if not files:
        print("No input files matched.")
        return

    outdir = None
    if not args.inplace:
        # derive output directory from first file's root
        if args.output:
            outdir = args.output
        else:
            root = os.path.commonpath(files) if len(files) > 1 else os.path.dirname(files[0])
            outdir = root + "_wm"
        os.makedirs(outdir, exist_ok=True)

    logo_white = Image.open(args.logo_white).convert("RGBA")
    logo_dark  = Image.open(args.logo_dark).convert("RGBA")

    for i, path in enumerate(files, 1):
        try:
            with Image.open(path) as im:
                im = im.convert("RGBA")  # work in RGBA for compositing
                W,H = im.size

                # Compute desired logo size
                target_w = max(1, int(W * args.scale))
                ratio = target_w / logo_white.width
                target_h = max(1, int(logo_white.height * ratio))
                lw = logo_white.resize((target_w, target_h), Image.LANCZOS)
                ld = logo_dark.resize((target_w, target_h), Image.LANCZOS)

                pad_px = int(min(W,H) * args.padding)
                # default anchor box near the chosen position area for luminance sampling
                x,y = compute_position(W,H,target_w,target_h,args.position,pad_px)
                sample_box = (
                    max(0, x), max(0, y),
                    min(W, x+target_w), min(H, y+target_h)
                )

                luma = local_luminance(im, sample_box)
                use_dark = luma >= args.luma_threshold  # bright background -> dark logo
                logo = ld if use_dark else lw

                logo = apply_opacity(logo, args.opacity)

                # Composite
                canvas = im.copy()
                if args.shadow > 0:
                    canvas = add_shadow(canvas, logo, (x,y), strength=args.shadow)
                canvas.alpha_composite(logo, (x,y))

                # Save
                out_path = path if args.inplace else os.path.join(outdir, os.path.basename(path))
                # ensure JPEG
                rgb = canvas.convert("RGB")
                rgb.save(out_path, quality=args.quality, subsampling=1, optimize=True)
                print(f"[{i}/{len(files)}] ✅ {os.path.basename(path)}  →  {out_path}  (luma={luma:.2f}, {'dark' if use_dark else 'white'})")
        except Exception as e:
            print(f"[{i}/{len(files)}] ❌ {path}: {e}")

if __name__ == "__main__":
    main()
