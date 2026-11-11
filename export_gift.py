from pathlib import Path
import base64
import json
import re
import html
import zipfile

root = Path(__file__).parent
site = root / 'site'
source = (site / 'index.html').read_text(encoding='utf-8')
cache = {}

def inline_image(path):
    if not path or not isinstance(path, str):
        return path
    if path not in cache:
        img_file = site / path
        if img_file.exists() and img_file.suffix.lower() in ('.jpg', '.jpeg', '.png', '.webp'):
            cache[path] = 'data:image/jpeg;base64,' + base64.b64encode(img_file.read_bytes()).decode()
        else:
            return path
    return cache[path]

# Parse photos.js
photos_js = (site / 'photos.js').read_text(encoding='utf-8')
data_m = re.search(r'window\.BOSS_ALBUM_DATA\s*=\s*(.*?);\s*window\.BOSS_PHOTOS', photos_js, re.S)
photos_m = re.search(r'window\.BOSS_PHOTOS\s*=\s*(.*?);?\s*$', photos_js, re.S)

album_data = json.loads(data_m.group(1)) if data_m else {}
manifest = json.loads(photos_m.group(1)) if photos_m else []

# Inline images in album_data
if 'hardCover' in album_data:
    if 'coverPhoto' in album_data['hardCover']:
        album_data['hardCover']['coverPhoto'] = inline_image(album_data['hardCover']['coverPhoto'])
    if 'thumb' in album_data['hardCover']:
        album_data['hardCover']['thumb'] = inline_image(album_data['hardCover']['thumb'])

if 'coverSpread' in album_data:
    if 'src' in album_data['coverSpread']:
        album_data['coverSpread']['src'] = inline_image(album_data['coverSpread']['src'])
    if 'thumb' in album_data['coverSpread']:
        album_data['coverSpread']['thumb'] = inline_image(album_data['coverSpread']['thumb'])

for p in album_data.get('pages', []):
    if 'src' in p:
        p['src'] = inline_image(p['src'])
    if 'thumb' in p:
        p['thumb'] = inline_image(p['thumb'])
    if 'poster' in p:
        p['poster'] = inline_image(p['poster'])

for photo in manifest:
    photo['src'] = inline_image(photo['src'])
    photo['thumb'] = inline_image(photo['thumb'])
    if 'poster' in photo:
        photo['poster'] = inline_image(photo['poster'])

# Replace CSS
css_content = (site / 'style.css').read_text(encoding='utf-8')
standalone = re.sub(r'<link rel="stylesheet" href="style\.css(?:\?[^"]*)?">', f'<style>\n{css_content}\n</style>', source)

# Remove external script tags
standalone = re.sub(r'<script src="(?:photos|love-music|effects|app)\.js(?:\?[^"]*)?" defer></script>\s*', '', standalone)

# Replace static img src if any
standalone = re.sub(r'src="((?:photos|thumbs)/[^\"]+)"', lambda m: 'src="' + inline_image(m.group(1)) + '"', standalone)

# Inline JS
js_data = 'window.BOSS_ALBUM_DATA = ' + json.dumps(album_data, ensure_ascii=False, separators=(',', ':')) + ';\n'
js_manifest = 'window.BOSS_PHOTOS = ' + json.dumps(manifest, ensure_ascii=False, separators=(',', ':')) + ';\n'
js_music = (site / 'love-music.js').read_text(encoding='utf-8') + '\n'
js_effects = (site / 'effects.js').read_text(encoding='utf-8') + '\n'
js_app = (site / 'app.js').read_text(encoding='utf-8') + '\n'

bundled_js = f'<script>\n{js_data}{js_manifest}{js_music}{js_effects}{js_app}</script>'
standalone = standalone.replace('</body>', f'{bundled_js}</body>')

(root / 'My-Boss.html').write_text(standalone, encoding='utf-8')

# Update Thu-tinh-gui-Boss.txt from letterPages
l1 = album_data.get('letterPages', {}).get('23', {})
l2 = album_data.get('letterPages', {}).get('24', {})
letter_text_parts = [
    '12 tháng 11 · Kỷ niệm 4 năm tình yêu',
    '',
    l1.get('greeting', 'Gửi Boss của anh,'),
    '',
    '\n\n'.join(l1.get('paragraphs', [])),
    '',
    '\n\n'.join(l2.get('paragraphs', [])),
    '',
    l2.get('wish', 'Chúc mừng kỷ niệm 4 năm tình yêu của chúng mình! ❤️\nMãi là bến đỗ bình yên của nhau, em nhé.'),
    '',
    l2.get('signature', 'Yêu và thương Boss thật nhiều,\nAnh của em')
]
full_letter = '\n'.join(p for p in letter_text_parts if p) + '\n'
(root / 'Thu-tinh-gui-Boss.txt').write_text(full_letter, encoding='utf-8')

# Zip packaging (includes videos, photos, thumbs, html, js, css)
zip_name = root / 'My-Boss-Ky-Niem-4-Nam.zip'
with zipfile.ZipFile(zip_name, 'w', zipfile.ZIP_DEFLATED) as z:
    for p in sorted(site.rglob('*')):
        if p.is_file():
            z.write(p, Path('My-Boss') / p.relative_to(site))
    if (root / 'Thu-tinh-gui-Boss.txt').exists():
        z.write(root / 'Thu-tinh-gui-Boss.txt', 'My-Boss/Thu-tinh-gui-Boss.txt')
    if (root / 'Noi-dung-album.txt').exists():
        z.write(root / 'Noi-dung-album.txt', 'My-Boss/Noi-dung-album.txt')
    z.writestr('My-Boss/HUONG-DAN.txt', 'Mở file index.html bằng trình duyệt (Chrome, Safari, Edge) để xem album đầy đủ hiệu ứng lật sách và video.\nGiữ nguyên các thư mục photos, thumbs và videos đi kèm.\n')

print(f"Standalone HTML: {round((root / 'My-Boss.html').stat().st_size / 1024**2, 2)} MB")
print(f"ZIP package: {round(zip_name.stat().st_size / 1024**2, 2)} MB")
