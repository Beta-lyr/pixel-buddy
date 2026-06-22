"""生成 PixelBuddy 应用图标"""
from PIL import Image, ImageDraw
import os

def create_icon(size):
    """创建指定大小的图标"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 背景圆角矩形
    margin = size // 8
    radius = size // 6
    draw.rounded_rectangle(
        [margin, margin, size - margin, size - margin],
        radius=radius,
        fill=(255, 107, 107)  # #FF6B6B
    )

    # 身体（圆形）
    body_radius = size // 4
    center_x, center_y = size // 2, size // 2 + size // 16
    draw.ellipse(
        [center_x - body_radius, center_y - body_radius,
         center_x + body_radius, center_y + body_radius],
        fill=(255, 255, 255)
    )

    # 左眼
    eye_radius = size // 16
    left_eye_x = center_x - body_radius // 2
    left_eye_y = center_y - body_radius // 3
    draw.ellipse(
        [left_eye_x - eye_radius, left_eye_y - eye_radius,
         left_eye_x + eye_radius, left_eye_y + eye_radius],
        fill=(51, 51, 51)
    )

    # 右眼
    right_eye_x = center_x + body_radius // 2
    right_eye_y = center_y - body_radius // 3
    draw.ellipse(
        [right_eye_x - eye_radius, right_eye_y - eye_radius,
         right_eye_x + eye_radius, right_eye_y + eye_radius],
        fill=(51, 51, 51)
    )

    # 嘴巴（微笑弧线）
    mouth_y = center_y + body_radius // 4
    mouth_width = body_radius // 2
    draw.arc(
        [center_x - mouth_width, mouth_y - mouth_width // 2,
         center_x + mouth_width, mouth_y + mouth_width // 2],
        start=0, end=180,
        fill=(51, 51, 51),
        width=max(2, size // 32)
    )

    return img


def main():
    icons_dir = os.path.join(os.path.dirname(__file__), '..', 'src-tauri', 'icons')
    os.makedirs(icons_dir, exist_ok=True)

    # 生成不同尺寸的PNG图标
    sizes = {
        '32x32.png': 32,
        '128x128.png': 128,
        '128x128@2x.png': 256,
    }

    for filename, size in sizes.items():
        img = create_icon(size)
        filepath = os.path.join(icons_dir, filename)
        img.save(filepath, 'PNG')
        print(f'Generated {filepath} ({size}x{size})')

    # 生成 .ico 文件（Windows）
    ico_sizes = [16, 32, 48, 64, 128, 256]
    ico_images = [create_icon(s) for s in ico_sizes]
    ico_path = os.path.join(icons_dir, 'icon.ico')
    ico_images[0].save(
        ico_path, format='ICO',
        sizes=[(s, s) for s in ico_sizes],
        append_images=ico_images[1:]
    )
    print(f'Generated {ico_path}')

    # 生成 .icns 文件占位（macOS，需要在 macOS 上用 iconutil 生成）
    # 这里先生成一个 512x512 的 PNG 作为替代
    icns_img = create_icon(512)
    icns_path = os.path.join(icons_dir, 'icon.icns.png')
    icns_img.save(icns_path, 'PNG')
    print(f'Generated {icns_path} (placeholder for .icns)')

    print('\nAll icons generated successfully!')


if __name__ == '__main__':
    main()