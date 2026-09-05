"""
SalaryHub Icon Generator
Generates high-resolution PWA icons, apple-touch-icon, and favicons from the selected Concept B design.
"""
from PIL import Image
import os
import sys

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

    img = Image.open(master_path).convert('RGBA')

    # Crop to the squircle region
    crop_box = (50, 50, 974, 974)
    cropped = img.crop(crop_box)

    sizes = {
        'icon-512.png': (512, 512),
        'icon-192.png': (192, 192),
        'apple-touch-icon.png': (180, 180),
        'favicon.png': (32, 32),
    }

    for filename, size in sizes.items():
        out_path = os.path.join(icons_dir, filename)
        resized = cropped.resize(size, Image.Resampling.LANCZOS)
        resized.save(out_path, 'PNG', optimize=True)
        print(f"[OK] Generated {out_path} ({size[0]}x{size[1]})")

    # Generate multi-size favicon.ico
    ico_path = os.path.join(base_dir, 'favicon.ico')
    cropped.save(ico_path, format='ICO', sizes=[(16, 16), (32, 32), (48, 48)])
    print(f"[OK] Generated {ico_path} (16, 32, 48)")

    return True

if __name__ == '__main__':
    build_icons()
