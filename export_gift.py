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
    if path not in cache:
        img_file = site / path
        if img_file.exists():
            cache[path] = 'data:image/jpeg;base64,' + base64.b64encode(img_file.read_bytes()).decode()
        else:
            return path
    return cache[path]

manifest = json.loads((site / 'photos.js').read_text(encoding='utf-8').removeprefix('window.BOSS_PHOTOS = ').strip().removesuffix(';'))

for photo in manifest:
    photo['src'] = inline_image(photo['src'])
    photo['thumb'] = inline_image(photo['thumb'])

# Replace CSS
css_content = (site / 'style.css').read_text(encoding='utf-8')
standalone = source.replace('<link rel="stylesheet" href="style.css">', f'<style>\n{css_content}\n</style>')

# Remove external script tags
standalone = standalone.replace('<script src="photos.js" defer></script>', '')
standalone = standalone.replace('<script src="love-music.js" defer></script>', '')
standalone = standalone.replace('<script src="effects.js" defer></script>', '')
standalone = standalone.replace('<script src="app.js" defer></script>', '')

# Replace images with base64
standalone = re.sub(r'src="((?:photos|thumbs)/[^\"]+)"', lambda m: 'src="' + inline_image(m.group(1)) + '"', standalone)

# Inline JS
js_manifest = 'window.BOSS_PHOTOS = ' + json.dumps(manifest, ensure_ascii=False, separators=(',', ':')) + ';\n'
js_music = (site / 'love-music.js').read_text(encoding='utf-8') + '\n'
js_effects = (site / 'effects.js').read_text(encoding='utf-8') + '\n'
js_app = (site / 'app.js').read_text(encoding='utf-8') + '\n'

bundled_js = f'<script>\n{js_manifest}{js_music}{js_effects}{js_app}</script>'
standalone = standalone.replace('</body>', f'{bundled_js}</body>')

(root / 'My-Boss.html').write_text(standalone, encoding='utf-8')

# Extract letter
letter_match = re.search(r'<article class="letter-content".*?>(.*?)<div class="letter-actions">', source, re.S)
if letter_match:
    letter = letter_match.group(1)
    letter = re.sub(r'<br\s*/?>', '\n', letter)
    letter = re.sub(r'</(?:p|h3|div)>', '\n\n', letter)
    letter = html.unescape(re.sub(r'<[^>]+>', '', letter))
    letter = re.sub(r'\n{3,}', '\n\n', letter).strip()
    (root / 'Thu-tinh-gui-Boss.txt').write_text(letter + '\n', encoding='utf-8')

# Zip packaging
zip_name = root / 'My-Boss-Ky-Niem-4-Nam.zip'
with zipfile.ZipFile(zip_name, 'w', zipfile.ZIP_DEFLATED) as z:
    for p in sorted(site.rglob('*')):
        if p.is_file():
            z.write(p, Path('My-Boss') / p.relative_to(site))
    if (root / 'Thu-tinh-gui-Boss.txt').exists():
        z.write(root / 'Thu-tinh-gui-Boss.txt', 'My-Boss/Thu-tinh-gui-Boss.txt')
    z.writestr('My-Boss/HUONG-DAN.txt', 'Mở file index.html bằng trình duyệt (Chrome, Safari, Edge) để xem album.\nGiữ nguyên thư mục photos và thumbs đi kèm.\n')

print(f"Standalone HTML: {round((root / 'My-Boss.html').stat().st_size / 1024**2, 2)} MB")
print(f"ZIP package: {round(zip_name.stat().st_size / 1024**2, 2)} MB")

