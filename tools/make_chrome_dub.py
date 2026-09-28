#!/usr/bin/env python3
"""FRANKIE PALMERI — per-letter fat black outline chrome dub (NYC/London)."""
from __future__ import annotations
import math, random, os
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageChops

OUT = "/workspace/frankiepalmeri-site/assets"
random.seed(42); np.random.seed(42)

def wobble(pts, amp=2.6):
    return [(x + math.sin(i*1.9+x*0.11)*amp,
             y + math.cos(i*2.3+y*0.09)*amp*0.9) for i,(x,y) in enumerate(pts)]

LETTERS = {}
def L(name, outer, holes=None):
    LETTERS[name] = (wobble(outer, 2.4), [wobble(h, 1.4) for h in (holes or [])])

# Classic straight-letter proportions with slight flair
L("F", [(5,2),(96,2),(96,28),(40,28),(40,50),(84,50),(84,74),(40,74),(40,118),(5,118)])
L("R", [(5,2),(68,2),(90,8),(100,26),(100,52),(88,68),(68,76),(48,76),(84,118),(52,118),(36,80),(36,118),(5,118)],
  [[(36,28),(64,28),(76,34),(80,44),(76,56),(64,64),(36,64)]])
L("A", [(4,118),(34,2),(66,2),(96,118),(70,118),(62,90),(38,90),(30,118)],
  [[(42,66),(58,66),(54,40),(46,40)]])
L("N", [(5,2),(34,2),(34,72),(68,2),(95,2),(95,118),(66,118),(66,48),(34,118),(5,118)])
L("K", [(5,2),(34,2),(34,46),(70,2),(98,2),(52,56),(98,118),(70,118),(34,66),(34,118),(5,118)])
L("I", [(16,2),(84,2),(84,28),(62,28),(62,92),(84,92),(84,118),(16,118),(16,92),(38,92),(38,28),(16,28)])
L("E", [(5,2),(96,2),(96,28),(40,28),(40,48),(82,48),(82,72),(40,72),(40,92),(96,92),(96,118),(5,118)])
L("P", [(5,2),(68,2),(90,8),(100,26),(100,52),(88,68),(68,78),(36,78),(36,118),(5,118)],
  [[(36,28),(64,28),(76,34),(80,46),(76,58),(64,66),(36,66)]])
L("L", [(5,2),(34,2),(34,92),(96,92),(96,118),(5,118)])
L("M", [(2,118),(2,2),(30,2),(50,68),(70,2),(98,2),(98,118),(72,118),(72,40),(50,98),(28,40),(28,118)])

ROW1, ROW2 = list("FRANKIE"), list("PALMERI")
LETTER_W, LETTER_H, GAP = 118, 142, 14  # more gap so outlines don't merge
PAD_X, PAD_Y = 110, 90
SHADOW_DX, SHADOW_DY = 20, 24
OUTLINE_PASS = 7  # MaxFilter passes per letter (~14-18px fat outline)

def row_width(n): return n*LETTER_W + (n-1)*GAP
W = int(PAD_X*2 + row_width(7) + SHADOW_DX + 50)
H = int(PAD_Y*2 + LETTER_H*2 + 52 + SHADOW_DY + 50)

def letter_origin(row, i, n):
    total = row_width(n)
    start = (W - total)/2 - SHADOW_DX/5
    return start + i*(LETTER_W+GAP), PAD_Y + row*(LETTER_H+50)

def scale_pts(pts, ox, oy):
    sx, sy = LETTER_W/100.0, LETTER_H/120.0
    return [(ox+x*sx, oy+y*sy) for x,y in pts]

def placements():
    out=[]
    for row, letters in enumerate([ROW1, ROW2]):
        for i, ch in enumerate(letters):
            ox, oy = letter_origin(row, i, len(letters))
            outer, holes = LETTERS[ch]
            out.append({"ch":ch, "outer": scale_pts(outer,ox,oy),
                        "holes": [scale_pts(h,ox,oy) for h in holes]})
    return out

def round_mask(mask, radius=5):
    b = mask.filter(ImageFilter.GaussianBlur(radius))
    return Image.fromarray(np.where(np.array(b)>105, 255, 0).astype(np.uint8), "L")

def letter_mask(p, size):
    m = Image.new("L", size, 0); d = ImageDraw.Draw(m)
    d.polygon(p["outer"], fill=255)
    for h in p["holes"]: d.polygon(h, fill=0)
    return round_mask(m, 4)

def dilate(mask, n):
    out = mask
    for _ in range(n): out = out.filter(ImageFilter.MaxFilter(5))
    return out

def chrome_texture(size):
    w,h = size
    yy = np.linspace(0,1,h)[:,None]
    xx = np.linspace(0,1,w)[None,:]
    band = 0.50 + 0.30*np.sin((yy*2.3+0.25)*math.pi)
    band = band + 0.07*np.sin((yy*7.5+xx*1.4)*math.pi)
    band = band + 0.28*((1-yy)**1.55)
    band = band - 0.15*np.clip(yy-0.48,0,1)
    band = np.clip(band,0,1)
    fine = np.random.randn(h,w).astype(np.float32)*0.022
    small = np.random.rand(max(1,h//8), max(1,w//8))
    mott = np.array(Image.fromarray((small*255).astype(np.uint8)).resize((w,h), Image.Resampling.BILINEAR), dtype=np.float32)/255.0
    mott = (mott-0.5)*0.07
    val = np.clip(band+fine+mott,0,1)
    r = val*198+45; g = val*204+48; b = val*214+52
    spec = (np.clip(1.15-yy*2.8,0,1)**2)*0.48
    r=np.clip(r+spec*255,0,255); g=np.clip(g+spec*255,0,255); b=np.clip(b+spec*248,0,255)
    return Image.fromarray(np.dstack([r,g,b]).astype(np.uint8),"RGB").convert("RGBA")

def apply_mask(img_rgba, mask_L, edge_jitter=True):
    if edge_jitter:
        arr = np.array(mask_L, dtype=np.float32)
        h,w = arr.shape
        rim = (arr>16)&(arr<240)
        arr = np.clip(arr + (np.random.rand(h,w)-0.5)*16*rim, 0, 255).astype(np.uint8)
        mask_L = Image.fromarray(arr,"L").filter(ImageFilter.GaussianBlur(0.55))
    out = img_rgba.copy()
    out.putalpha(mask_L)
    return out

def solid(size, rgba, mask):
    return Image.composite(Image.new("RGBA", size, rgba), Image.new("RGBA", size, (0,0,0,0)), mask)

def render():
    size=(W,H)
    ps = placements()
    chrome_tex = chrome_texture(size)

    # Build combined masks
    fill_combined = Image.new("L", size, 0)
    black_combined = Image.new("L", size, 0)
    key_combined = Image.new("L", size, 0)

    for p in ps:
        fill = letter_mask(p, size)
        black = round_mask(dilate(fill, OUTLINE_PASS), 2)
        key = round_mask(dilate(black, 2), 1)
        fill_combined = ImageChops.lighter(fill_combined, fill)
        black_combined = ImageChops.lighter(black_combined, black)
        key_combined = ImageChops.lighter(key_combined, key)

    canvas = Image.new("RGBA", size, (0,0,0,0))

    # Soft 3D shadow (charcoal, offset) — behind everything
    sh = Image.new("L", size, 0)
    sh.paste(black_combined, (SHADOW_DX, SHADOW_DY))
    sh = sh.filter(ImageFilter.GaussianBlur(15))
    sh_arr = np.clip(np.array(sh,dtype=np.float32)*0.82, 0, 255).astype(np.uint8)
    canvas = Image.alpha_composite(canvas, solid(size, (12,12,16,255), Image.fromarray(sh_arr,"L")))

    # Outer light keyline (wall-contrast stand-in for dark site bg)
    key_ring = ImageChops.subtract(key_combined, black_combined).filter(ImageFilter.GaussianBlur(0.7))
    canvas = Image.alpha_composite(canvas, solid(size, (110,115,125,200), key_ring))

    # Fat black outline (per-letter dilated, then union)
    bb = black_combined.filter(ImageFilter.GaussianBlur(0.45))
    barr = np.array(bb, dtype=np.float32)
    speck = (np.random.rand(H,W)>0.99).astype(np.float32)*90
    near = (barr>10)&(barr<250)
    barr = np.clip(barr + speck*near, 0, 255).astype(np.uint8)
    canvas = Image.alpha_composite(canvas, solid(size, (0,0,0,255), Image.fromarray(barr,"L")))

    # Chrome fill
    canvas = Image.alpha_composite(canvas, apply_mask(chrome_tex, fill_combined))

    # Inner highlight inline
    er = fill_combined
    for _ in range(5): er = er.filter(ImageFilter.MinFilter(3))
    ring = ImageChops.subtract(fill_combined.filter(ImageFilter.MinFilter(3)), er)
    ring = ring.filter(ImageFilter.GaussianBlur(0.85))
    rarr = np.clip(np.array(ring,dtype=np.float32)*0.72, 0, 200).astype(np.uint8)
    canvas = Image.alpha_composite(canvas, solid(size, (238,242,250,255), Image.fromarray(rarr,"L")))

    # Drips from individual letters
    dlayer = Image.new("RGBA", size, (0,0,0,0))
    d = ImageDraw.Draw(dlayer)
    rng = random.Random(19)
    for p in ps:
        if rng.random() > 0.45: continue
        bottom_pts = sorted(p["outer"], key=lambda t:t[1], reverse=True)[:4]
        x0,y0 = rng.choice(bottom_pts)
        # push drip below the black outline
        y0 += OUTLINE_PASS * 2.2
        x0 += rng.uniform(-8,8)
        length = rng.uniform(18,42)
        width = rng.uniform(6.0, 9.5)
        d.rounded_rectangle([x0-width, y0, x0+width, y0+length], radius=width, fill=(0,0,0,255))
        d.ellipse([x0-width*0.95, y0+length-width*0.2, x0+width*0.95, y0+length+width], fill=(0,0,0,255))
        d.rounded_rectangle([x0-width*0.48, y0+3, x0+width*0.48, y0+length-1], radius=width*0.45, fill=(175,185,200,255))
        d.ellipse([x0-width*0.42, y0+length-width*0.05, x0+width*0.42, y0+length+width*0.55], fill=(165,175,190,255))
    canvas = Image.alpha_composite(canvas, dlayer)

    # Soft overspray
    halo = black_combined.filter(ImageFilter.GaussianBlur(26))
    harr = np.clip(np.array(halo,dtype=np.float32)*0.09, 0, 28).astype(np.uint8)
    outside = ImageChops.invert(fill_combined)
    himg = ImageChops.multiply(Image.fromarray(harr,"L"), outside)
    canvas = Image.alpha_composite(canvas, solid(size, (145,150,160,255), himg))

    os.makedirs(OUT, exist_ok=True)
    path = os.path.join(OUT, "graffiti-title.png")
    canvas.save(path, "PNG", optimize=True)
    print("wrote", path, canvas.size)

    prev = Image.new("RGBA", size, (78,74,68,255))
    prev = Image.alpha_composite(prev, canvas)
    prev.convert("RGB").save(os.path.join(OUT, "graffiti-title-preview.jpg"), quality=92)

    # dark site-like preview
    dark = Image.new("RGBA", size, (8,10,8,255))
    dark = Image.alpha_composite(dark, canvas)
    dark.convert("RGB").save(os.path.join(OUT, "graffiti-title-dark.jpg"), quality=92)

    for name in ("ascii","base","study"):
        canvas.save(os.path.join(OUT, f"graffiti-title-{name}.png"), "PNG", optimize=True)
    print("previews ok")

if __name__ == "__main__":
    render()
