"""
SalaryHub Icon Generator
Generates high-resolution PWA icons, Apple Touch Icons (iOS / iPhone), favicons, and splash screens
from the Concept B master design, optimized for Apple HIG and W3C maskable standards.
"""
from PIL import Image, ImageDraw, ImageFilter, ImageFont
import os
import sys

if hasattr(sys.stdout, 'reconfigure'):
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

def build_icons():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    icons_dir = os.path.join(base_dir, 'icons')
    os.makedirs(icons_dir, exist_ok=True)

    master_path = os.path.join(icons_dir, 'master-concept-b.jpg')
    if not os.path.exists(master_path):
        # Fallback to brain artifact location
        master_path = os.path.join(
            os.path.expanduser('~'),
            r'.gemini\antigravity-ide\brain\835a72a5-99b6-4d18-b70a-104425414a2e\icon_concept_b_1788621793029.jpg'
        )

    if not os.path.exists(master_path):
        print(f"Error: Source image not found at {master_path}")
        return False

    img = Image.open(master_path).convert('RGB')

    # Crop to 720x720 centered box (151, 151, 871, 871)
    # This centers the emblem with ~73% coverage, perfectly conforming to Apple HIG safe area
    # and avoiding the artificial double-squircle border problem on iOS.
    crop_box = (151, 151, 871, 871)
    cropped = img.crop(crop_box)

    # 1. Apple Touch Icons for iOS / iPhone / iPad
    apple_sizes = {
        'apple-touch-icon.png': (180, 180),
        'apple-touch-icon-180x180.png': (180, 180),
        'apple-touch-icon-120x120.png': (120, 120),
        'apple-touch-icon-167x167.png': (167, 167),
        'apple-touch-icon-152x152.png': (152, 152),
        'apple-touch-icon-1024x1024.png': (1024, 1024),
    }

    for filename, size in apple_sizes.items():
        out_path = os.path.join(icons_dir, filename)
        resized = cropped.resize(size, Image.Resampling.LANCZOS)
        resized.save(out_path, 'PNG', optimize=True)
        print(f"[OK] Generated Apple Touch Icon: {filename} ({size[0]}x{size[1]})")

    # 2. Root fallbacks for direct iOS Safari requests
    root_apple = os.path.join(base_dir, 'apple-touch-icon.png')
    root_precomp = os.path.join(base_dir, 'apple-touch-icon-precomposed.png')
    apple_180 = cropped.resize((180, 180), Image.Resampling.LANCZOS)
    apple_180.save(root_apple, 'PNG', optimize=True)
    apple_180.save(root_precomp, 'PNG', optimize=True)
    print("[OK] Generated root /apple-touch-icon.png and /apple-touch-icon-precomposed.png")

    # 3. PWA and Favicon assets
    pwa_sizes = {
        'icon-512.png': (512, 512),
        'icon-192.png': (192, 192),
        'favicon.png': (32, 32),
    }

    for filename, size in pwa_sizes.items():
        out_path = os.path.join(icons_dir, filename)
        resized = cropped.resize(size, Image.Resampling.LANCZOS)
        resized.save(out_path, 'PNG', optimize=True)
        print(f"[OK] Generated PWA asset: {filename} ({size[0]}x{size[1]})")

    # Multi-size favicon.ico
    ico_path = os.path.join(base_dir, 'favicon.ico')
    cropped.save(ico_path, format='ICO', sizes=[(16, 16), (32, 32), (48, 48)])
    print(f"[OK] Generated {ico_path} (16, 32, 48)")

    # 4. Apple Touch Startup Splash Screens (iPhone PWA Launch Screens)
    splash_targets = [
        ('apple-splash-1290-2796.png', 1290, 2796, 380),  # iPhone 15 Pro Max, 14 Pro Max
        ('apple-splash-1179-2556.png', 1179, 2556, 360),  # iPhone 15 Pro, 15, 14 Pro
        ('apple-splash-1170-2532.png', 1170, 2532, 350),  # iPhone 14, 13, 12
        ('apple-splash-750-1334.png', 750, 1334, 240),    # iPhone SE, 8
    ]

    for fname, w, h, icon_sz in splash_targets:
        canvas = Image.new('RGB', (w, h), (11, 16, 30))
        cx, cy = w // 2, h // 2 - int(h * 0.04)

        icon_resized = cropped.resize((icon_sz, icon_sz), Image.Resampling.LANCZOS)
        mask = Image.new('L', (icon_sz, icon_sz), 0)
        m_draw = ImageDraw.Draw(mask)
        corner_r = int(icon_sz * 0.22)
        m_draw.rounded_rectangle([(0, 0), (icon_sz, icon_sz)], radius=corner_r, fill=255)

        canvas.paste(icon_resized, (cx - icon_sz // 2, cy - icon_sz // 2), mask)

        out_splash = os.path.join(icons_dir, fname)
        canvas.save(out_splash, 'PNG', optimize=True)
        print(f"[OK] Generated Apple Splash: {fname} ({w}x{h})")

    # 5. Generate realistic iPhone Mockup preview
    generate_iphone_mockup(cropped, icons_dir)

    return True

def generate_iphone_mockup(cropped_emblem, icons_dir):
    w, h = 800, 1500
    img = Image.new('RGBA', (w, h), (11, 16, 30, 255))
    draw = ImageDraw.Draw(img)

    # Luxury dark gradient wallpaper
    for y in range(h):
        t = y / h
        r = int(8 * (1 - t) + 16 * t)
        g = int(12 * (1 - t) + 26 * t)
        b = int(24 * (1 - t) + 48 * t)
        draw.line([(0, y), (w, y)], fill=(r, g, b, 255))

    # Dynamic Island
    draw.rounded_rectangle([(w // 2 - 95, 30), (w // 2 + 95, 75)], radius=22, fill=(0, 0, 0, 255))

    # Grid parameters
    icon_sz = 130
    corner_r = 29
    start_x = 85
    start_y = 200
    spacing_x = 170
    spacing_y = 190

    salaryhub_icon = cropped_emblem.resize((icon_sz, icon_sz), Image.Resampling.LANCZOS)
    mask = Image.new('L', (icon_sz, icon_sz), 0)
    ImageDraw.Draw(mask).rounded_rectangle([(0, 0), (icon_sz, icon_sz)], radius=corner_r, fill=255)

    apps = [
        ('FaceTime', (46, 204, 113)),
        ('Calendar', (245, 245, 245)),
        ('Photos', (238, 238, 240)),
        ('Camera', (140, 145, 150)),
        ('Mail', (52, 152, 219)),
        ('SalaryHub', None),
        ('Notes', (245, 200, 25)),
        ('Reminders', (230, 235, 240)),
        ('Settings', (130, 135, 140)),
        ('Wallet', (35, 35, 40)),
        ('Maps', (40, 180, 110)),
        ('Weather', (55, 160, 230)),
    ]

    for idx, (name, color) in enumerate(apps):
        col = idx % 4
        row = idx // 4
        x = start_x + col * spacing_x
        y = start_y + row * spacing_y

        if name == 'SalaryHub':
            shadow = Image.new('RGBA', (icon_sz + 30, icon_sz + 30), (0, 0, 0, 0))
            ImageDraw.Draw(shadow).rounded_rectangle(
                [(10, 12), (icon_sz + 20, icon_sz + 22)],
                radius=corner_r + 3,
                fill=(0, 245, 212, 60)
            )
            shadow = shadow.filter(ImageFilter.GaussianBlur(10))
            img.paste(shadow, (x - 15, y - 10), shadow)
            img.paste(salaryhub_icon, (x, y), mask)

            border = Image.new('RGBA', (icon_sz, icon_sz), (0, 0, 0, 0))
            ImageDraw.Draw(border).rounded_rectangle(
                [(0, 0), (icon_sz - 1, icon_sz - 1)],
                radius=corner_r,
                outline=(0, 245, 212, 190),
                width=2
            )
            img.paste(border, (x, y), border)
        else:
            app_img = Image.new('RGBA', (icon_sz, icon_sz), (*color, 255))
            img.paste(app_img, (x, y), mask)

        draw.text((x + icon_sz // 2 - 28, y + icon_sz + 10), name[:9], fill=(255, 255, 255, 230))

    # Dock
    dock_y = h - 200
    dock_bg = Image.new('RGBA', (w - 80, 150), (255, 255, 255, 40))
    dock_mask = Image.new('L', (w - 80, 150), 0)
    ImageDraw.Draw(dock_mask).rounded_rectangle([(0, 0), (w - 80, 150)], radius=40, fill=255)
    img.paste(dock_bg, (40, dock_y), dock_mask)

    dock_apps = [(46, 204, 113), (52, 152, 219), (230, 126, 34), (65, 135, 200)]
    for i, col in enumerate(dock_apps):
        dx = 90 + i * spacing_x
        dy = dock_y + 18
        d_img = Image.new('RGBA', (icon_sz - 14, icon_sz - 14), (*col, 255))
        d_mask = Image.new('L', (icon_sz - 14, icon_sz - 14), 0)
        ImageDraw.Draw(d_mask).rounded_rectangle([(0, 0), (icon_sz - 14, icon_sz - 14)], radius=corner_r - 2, fill=255)
        img.paste(d_img, (dx, dy), d_mask)

    # Home indicator
    draw.rounded_rectangle([(w // 2 - 75, h - 25), (w // 2 + 75, h - 18)], radius=3, fill=(255, 255, 255, 180))

    out_mockup = os.path.join(icons_dir, 'iphone-homescreen-mockup.png')
    img.save(out_mockup, 'PNG')
    print("[OK] Generated iPhone Home Screen mockup: iphone-homescreen-mockup.png")

if __name__ == '__main__':
    build_icons()
