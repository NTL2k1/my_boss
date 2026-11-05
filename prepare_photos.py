from pathlib import Path
from PIL import Image, ImageOps
import json

root = Path(__file__).parent
source = root / 'raw_photos'
site = root / 'site'
photos_dir = site / 'photos'
thumbs_dir = site / 'thumbs'

photos_dir.mkdir(parents=True, exist_ok=True)
thumbs_dir.mkdir(parents=True, exist_ok=True)

# List of photos in chronological / story sequence
photo_files = [
    'IMG_20260329_201103.jpg',
    '20260411_163354.jpg',
    '20260411_170832.jpg',
    '20260411_171516.jpg',
    '20260411_215759.jpg',
    '20260411_215926.jpg',
    '20260411_221554.jpg',
    '20260412_055550.jpg',
    '20260412_152210_001.jpg',
    '20260412_163151.jpg',
    '20260412_164030.jpg',
    '20260718_185258.jpg',
    '20260911_194906.jpg',
    '20260920_142912.jpg',
    '20260920_142943.jpg'
]

# Mapping labels / captions for each
captions = {
    '1': 'Chỉ cần nhìn vào đôi mắt này, mọi muộn phiền ngoài kia đều biến mất.',
    '2': 'Đi đâu không quan trọng, quan trọng là luôn có Boss kề bên.',
    '3': 'Hoàng hôn hôm ấy rất đẹp, nhưng mắt anh chỉ mải ngắm em.',
    '4': 'Em như cơn sóng nhỏ, vừa mát lành vừa làm xao xuyến cả mùa hè.',
    '5': 'Lúc nào cũng rạng rỡ và ngập tràn năng lượng thế này nhé!',
    '6': 'Bình yên đôi khi chỉ là ngồi ngắm em cười vu vơ.',
    '7': 'Ra ngoài là Boss quyền lực, về cạnh anh là "tay đua nhí" đáng yêu.',
    '8': 'Nắng sớm, hoa hồng, và người xinh đẹp nhất trong mắt anh.',
    '9': 'Giữa biển trời bao la, tìm được nhau là điều may mắn nhất đời anh.',
    '10': 'Nàng thơ của anh giữa vịnh biển kỳ vĩ.',
    '11': 'Nụ cười thả ga, đắm mình trọn vẹn trong làn nước xanh mát.',
    '12': 'Một buổi hẹn hò xem phim, ly bắp rang và nụ cười quen thuộc.',
    '13': 'Kỷ niệm ngày bên nhau, cảm ơn Boss vì luôn ở đây cùng anh.',
    '14': 'Nặn gốm thì cần kiên nhẫn, còn yêu em thì anh chưa từng thấy đủ.',
    '15': 'Tác phẩm có thể chưa hoàn hảo, nhưng khoảnh khắc bên em thì luôn là tuyệt nhất.'
}

manifest = []

for idx, fname in enumerate(photo_files, start=1):
    src_path = source / fname
    if not src_path.exists():
        print(f"Warning: {src_path} not found")
        continue

    photo_id = str(idx)
    im = ImageOps.exif_transpose(Image.open(src_path)).convert('RGB')
    
    # Save optimized full photo
    full = im.copy()
    full.thumbnail((1200, 1200), Image.Resampling.LANCZOS)
    full_path = photos_dir / f"{photo_id}.jpg"
    full.save(full_path, quality=85, optimize=True)
    
    # Save optimized thumbnail
    thumb = im.copy()
    thumb.thumbnail((380, 380), Image.Resampling.LANCZOS)
    thumb_path = thumbs_dir / f"{photo_id}.jpg"
    thumb.save(thumb_path, quality=78, optimize=True)
    
    manifest.append({
        'id': photo_id,
        'src': f'photos/{photo_id}.jpg',
        'thumb': f'thumbs/{photo_id}.jpg',
        'width': full.width,
        'height': full.height,
        'label': captions.get(photo_id, f'Khoảnh khắc {photo_id}'),
        'original_name': fname
    })
    print(f"[{idx}/{len(photo_files)}] Processed {fname} -> {photo_id}.jpg ({full.width}x{full.height})")

js_content = 'window.BOSS_PHOTOS = ' + json.dumps(manifest, ensure_ascii=False, indent=2) + ';\n'
(site / 'photos.js').write_text(js_content, encoding='utf-8')

print(f"\nSuccessfully prepared {len(manifest)} photos.")
total_size = sum(f.stat().st_size for f in photos_dir.glob('*.jpg')) + sum(f.stat().st_size for f in thumbs_dir.glob('*.jpg'))
print(f"Total optimized images size: {total_size / (1024*1024):.2f} MB")

