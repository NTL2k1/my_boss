from pathlib import Path
from PIL import Image, ImageOps
import json
import re
import subprocess
import shutil

try:
    import imageio_ffmpeg
    FFMPEG_EXE = imageio_ffmpeg.get_ffmpeg_exe()
except Exception:
    FFMPEG_EXE = shutil.which('ffmpeg')

root = Path(__file__).parent
site = root / 'site'
photos_dir = site / 'photos'
thumbs_dir = site / 'thumbs'
videos_dir = site / 'videos'

photos_dir.mkdir(parents=True, exist_ok=True)
thumbs_dir.mkdir(parents=True, exist_ok=True)
videos_dir.mkdir(parents=True, exist_ok=True)

def parse_album_content(text_file: Path):
    content = text_file.read_text(encoding='utf-8')
    
    # 1. Hard cover outside
    hard_cover = {
        'overline': 'KỶ NIỆM TÌNH YÊU · 12.11',
        'title': 'Trạm Dừng Thứ 4.',
        'subtitle': 'Không phải đích đến, mà là một cột mốc đẹp trên hành trình dài của tụi mình.',
        'cover_photo': 'raw_photos/Đi_biển_Cát_Bà/Sun_World/20260411_215759.jpg',
        'name': 'MY BOSS',
        'date': '12.11.2022 — 12.11.2026',
        'button_text': 'Chạm để mở album ✨'
    }
    hc_match = re.search(r'\[BÌA CỨNG BÊN NGOÀI.*?\](.*?)--------------------------------------------------------------------------------', content, re.S)
    if hc_match:
        hc_text = hc_match.group(1)
        for line in hc_text.splitlines():
            line = line.strip()
            if line.startswith('- Dòng nhỏ trên cùng:'):
                hard_cover['overline'] = line.split(':', 1)[1].strip()
            elif line.startswith('- Tiêu đề lớn:'):
                hard_cover['title'] = line.split(':', 1)[1].strip()
            elif line.startswith('- Tiêu đề nhỏ:'):
                hard_cover['subtitle'] = line.split(':', 1)[1].strip()
            elif line.startswith('- Ảnh bìa cứng:'):
                hard_cover['cover_photo'] = line.split(':', 1)[1].strip().replace('\\', '/')
            elif line.startswith('- Tên:'):
                hard_cover['name'] = line.split(':', 1)[1].strip()
            elif line.startswith('- Ngày kỷ niệm:'):
                hard_cover['date'] = line.split(':', 1)[1].strip()
            elif line.startswith('- Nút bấm:'):
                hard_cover['button_text'] = line.split(':', 1)[1].strip()

    # 2. Cover Spread (Page 1)
    cover_spread = {
        'page_num': 1,
        'overline': 'KỶ NIỆM TÌNH YÊU · 12.11',
        'sub_overline': 'DÀNH TẶNG BOSS CỦA ANH',
        'title': '4 năm. 48 tháng. 1461 ngày.',
        'lead': 'Cảm ơn vì mọi khoảnh khắc chúng mình đã cùng nhau tạo nên. Chúc mừng kỷ niệm 4 năm của tụi mình. Anh không khéo tay để làm những món quà thủ công, vì thế anh chuẩn bị một thứ mà anh có thể làm tốt, album không hoàn hảo nhưng là tình cảm tôi dành cho em.',
        'date': '12.11.2022 — 12.11.2026',
        'photo': 'raw_photos/IMG_20260329_201103.jpg',
        'moment_title': 'Gái nhà ai mà xinh thí',
        'text': 'Nhìn vô đôi mắt này, mà lọt tỏm luôn.',
        'seal': 'with love, từ TÔI'
    }
    p1_match = re.search(r'\[TRANG 01 - TRANG MỞ ĐẦU ALBUM.*?\](.*?)================================================================================', content, re.S)
    if p1_match:
        p1_text = p1_match.group(1)
        m = re.search(r'-\s*Dòng đề tặng:\s*([^\n]+)', p1_text)
        if m: cover_spread['sub_overline'] = m.group(1).strip()
        m = re.search(r'-\s*Tiêu đề lớn:\s*([^\n]+)', p1_text)
        if m: cover_spread['title'] = m.group(1).strip()
        m = re.search(r'-\s*Lời dẫn:\s*([^\n]+)', p1_text)
        if m: cover_spread['lead'] = m.group(1).strip()
        m = re.search(r'-\s*Ngày tháng:\s*([^\n]+)', p1_text)
        if m: cover_spread['date'] = m.group(1).strip()
        m = re.search(r'-\s*File(?: ảnh)?:\s*([^\n]+)', p1_text)
        if m: cover_spread['photo'] = m.group(1).strip().replace('\\', '/')
        m = re.search(r'-\s*Tiêu đề khoảnh khắc:\s*([^\n]+)', p1_text)
        if m: cover_spread['moment_title'] = m.group(1).strip()
        m = re.search(r'-\s*Đoạn text:\s*([^\n]+)', p1_text)
        if m: cover_spread['text'] = m.group(1).strip()
        m = re.search(r'-\s*Con dấu góc trang:\s*([^\n]+)', p1_text)
        if m: cover_spread['seal'] = m.group(1).strip()

    # 3. Chapters
    chapters = []
    ch_blocks = re.findall(
        r'={10,}\s*\n(?:CHƯƠNG\s*\d+:\s*)?([^\n]+)\n-\s*Phụ đề chương:\s*([^\n]+)\n-\s*Câu trích dẫn chương:\s*([^\n]+)\s*\n={10,}',
        content
    )
    for idx, (title, subtitle, quote) in enumerate(ch_blocks, 1):
        chapters.append({
            'index': idx,
            'title': title.strip(),
            'subtitle': subtitle.strip(),
            'quote': quote.strip()
        })

    # 4. Pages 02 to 24
    page_blocks = re.findall(r'\[TRANG (\d+)(?: - ([^\]]+))?\]\n(.*?)(?=\n\[TRANG |\n={10,}|\Z)', content, re.S)
    
    pages = []
    def get_ch_index(p_num):
        if 2 <= p_num <= 10: return 1
        if 11 <= p_num <= 14: return 2
        if 15 <= p_num <= 17: return 3
        if 18 <= p_num <= 21: return 4
        if p_num == 22: return 5
        return 6

    letter_pages = {}

    for p_num_str, tag_note, block in page_blocks:
        p_num = int(p_num_str)
        if p_num == 1:
            continue
        if p_num in (23, 24):
            title_m = re.search(r'-\s*Tiêu đề trang:\s*([^\n]+)', block)
            greeting_m = re.search(r'-\s*Lời chào:\s*([^\n]+)', block)
            wish_m = re.search(r'-\s*Lời chúc kết thư:\s*([^\n]+(?:\n(?!\s*-\s*)[^\n]+)*)', block)
            sig_m = re.search(r'-\s*Chữ ký:\s*([^\n]+(?:\n(?!\s*-\s*)[^\n]+)*)', block)
            
            paragraphs = re.findall(r'-\s*Đoạn \d+:\s*([^\n]+(?:\n(?!\s*-\s*)[^\n]+)*)', block)
            paragraphs = [p.strip().replace('\n', ' ') for p in paragraphs]
            
            letter_pages[str(p_num)] = {
                'pageNum': p_num,
                'title': title_m.group(1).strip() if title_m else '',
                'greeting': greeting_m.group(1).strip() if greeting_m else '',
                'paragraphs': paragraphs,
                'wish': wish_m.group(1).strip() if wish_m else '',
                'signature': sig_m.group(1).strip() if sig_m else ''
            }
            continue

        is_video = 'VIDEO' in (tag_note or '') or 'raw_videos' in block
        file_m = re.search(r'-\s*File(?: ảnh)?:\s*([^\n]+)', block)
        tag_m = re.search(r'-\s*Địa điểm / Tag:\s*([^\n]+)', block)
        title_m = re.search(r'-\s*Tiêu đề khoảnh khắc:\s*([^\n]+)', block)
        text_m = re.search(r'-\s*Đoạn text:\s*([^\n]+(?:\n(?!\s*-\s*)[^\n]+)*)', block)

        file_path = file_m.group(1).strip().replace('\\', '/') if file_m else ''
        tag = tag_m.group(1).strip() if tag_m else ''
        title = title_m.group(1).strip() if title_m else f'Khoảnh khắc {p_num}'
        text = text_m.group(1).strip().replace('\n', ' ') if text_m else ''

        ch_idx = get_ch_index(p_num)

        page_data = {
            'pageNum': p_num,
            'chapter': ch_idx,
            'type': 'video' if is_video else 'photo',
            'file': file_path,
            'tag': tag,
            'title': title,
            'text': text
        }
        pages.append(page_data)

    return {
        'hardCover': hard_cover,
        'coverSpread': cover_spread,
        'chapters': chapters,
        'pages': pages,
        'letterPages': letter_pages
    }

def process_image(src_path: Path, full_path: Path, thumb_path: Path):
    im = ImageOps.exif_transpose(Image.open(src_path)).convert('RGB')
    
    # Save optimized full photo
    full = im.copy()
    full.thumbnail((1280, 1280), Image.Resampling.LANCZOS)
    full.save(full_path, quality=86, optimize=True)
    
    # Save optimized thumbnail
    thumb = im.copy()
    thumb.thumbnail((420, 420), Image.Resampling.LANCZOS)
    thumb.save(thumb_path, quality=80, optimize=True)
    
    return full.width, full.height

def extract_video_poster(src_path: Path, poster_raw: Path):
    if not FFMPEG_EXE:
        raise RuntimeError("ffmpeg not found! Please install imageio-ffmpeg.")
    cmd = [
        FFMPEG_EXE, '-y',
        '-ss', '00:00:01.000',
        '-i', str(src_path),
        '-vframes', '1',
        '-q:v', '2',
        str(poster_raw)
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

def transcode_video(src_path: Path, out_path: Path):
    if not FFMPEG_EXE:
        raise RuntimeError("ffmpeg not found! Please install imageio-ffmpeg.")
    print(f"   Transcoding video with ffmpeg: {src_path.name} -> {out_path.name} ...")
    cmd = [
        FFMPEG_EXE, '-y',
        '-i', str(src_path),
        '-vf', 'scale=-2:720',
        '-c:v', 'libx264',
        '-crf', '27',
        '-preset', 'faster',
        '-c:a', 'aac',
        '-b:a', '128k',
        '-movflags', '+faststart',
        str(out_path)
    ]
    subprocess.run(cmd, check=True)

def main():
    print("=" * 60)
    print("MY BOSS - PREPARE ALBUM MEDIA & CONTENT")
    print("=" * 60)
    
    text_file = root / 'Noi-dung-album.txt'
    if not text_file.exists():
        print(f"Error: {text_file} not found!")
        return

    data = parse_album_content(text_file)
    print(f"Loaded content from {text_file.name}:")
    print(f" - Chapters: {len(data['chapters'])}")
    print(f" - Regular moment pages: {len(data['pages'])}")
    print(f" - Letter pages: {len(data['letterPages'])}")

    # 1. Process Hard Cover Photo
    hc_src = root / data['hardCover']['cover_photo']
    hc_full = photos_dir / 'cover.jpg'
    hc_thumb = thumbs_dir / 'cover.jpg'
    if hc_full.exists() and hc_thumb.exists() and hc_full.stat().st_size > 0:
        with Image.open(hc_full) as im:
            w, h = im.width, im.height
        print(f"[Cover] Using existing cover photo -> photos/cover.jpg ({w}x{h})")
    elif hc_src.exists():
        w, h = process_image(hc_src, hc_full, hc_thumb)
        print(f"[Cover] Processed hard cover photo -> photos/cover.jpg ({w}x{h})")
    else:
        w, h = 960, 1280
    data['hardCover']['coverPhoto'] = 'photos/cover.jpg'
    data['hardCover']['thumb'] = 'thumbs/cover.jpg'
    data['hardCover']['width'] = w
    data['hardCover']['height'] = h

    # 2. Process Page 1 Photo
    p1_src = root / data['coverSpread']['photo']
    p1_full = photos_dir / '1.jpg'
    p1_thumb = thumbs_dir / '1.jpg'
    if p1_full.exists() and p1_thumb.exists() and p1_full.stat().st_size > 0:
        with Image.open(p1_full) as im:
            w, h = im.width, im.height
        print(f"[Page 01] Using existing opening photo -> photos/1.jpg ({w}x{h})")
    elif p1_src.exists():
        w, h = process_image(p1_src, p1_full, p1_thumb)
        print(f"[Page 01] Processed opening photo -> photos/1.jpg ({w}x{h})")
    else:
        w, h = 720, 1280
    data['coverSpread']['src'] = 'photos/1.jpg'
    data['coverSpread']['thumb'] = 'thumbs/1.jpg'
    data['coverSpread']['width'] = w
    data['coverSpread']['height'] = h

    # 3. Process Pages 02 - 22
    manifest_photos = []
    
    # Add page 1 to photos list
    manifest_photos.append({
        'id': '1',
        'pageNum': 1,
        'chapter': 0,
        'type': 'photo',
        'src': 'photos/1.jpg',
        'thumb': 'thumbs/1.jpg',
        'width': data['coverSpread'].get('width', 1200),
        'height': data['coverSpread'].get('height', 1200),
        'title': data['coverSpread']['moment_title'],
        'label': data['coverSpread']['moment_title'],
        'text': data['coverSpread']['text'],
        'tag': 'TRANG MỞ ĐẦU · KỶ NIỆM 4 NĂM',
        'original_name': Path(data['coverSpread']['photo']).name
    })

    for p in data['pages']:
        p_num = p['pageNum']
        src_path = root / p['file']
        if not src_path.exists():
            print(f"Warning: {src_path} not found for Page {p_num}!")
            continue

        if p['type'] == 'photo':
            full_out = photos_dir / f"{p_num}.jpg"
            thumb_out = thumbs_dir / f"{p_num}.jpg"
            if full_out.exists() and thumb_out.exists() and full_out.stat().st_size > 0:
                with Image.open(full_out) as im:
                    w, h = im.width, im.height
            else:
                w, h = process_image(src_path, full_out, thumb_out)
            p['src'] = f"photos/{p_num}.jpg"
            p['thumb'] = f"thumbs/{p_num}.jpg"
            p['width'] = w
            p['height'] = h
            p['label'] = p['title']
            p['original_name'] = src_path.name
            manifest_photos.append({
                'id': str(p_num),
                'pageNum': p_num,
                'chapter': p['chapter'],
                'type': 'photo',
                'src': p['src'],
                'thumb': p['thumb'],
                'width': w,
                'height': h,
                'title': p['title'],
                'label': p['title'],
                'text': p['text'],
                'tag': p['tag'],
                'original_name': src_path.name
            })
            print(f"[{p_num:02d}/24] Photo: {src_path.name} -> {full_out.name} ({w}x{h})")

        elif p['type'] == 'video':
            video_out = videos_dir / f"{p_num}.mp4"
            poster_temp = photos_dir / f"{p_num}_raw_poster.jpg"
            full_poster = photos_dir / f"{p_num}.jpg"
            thumb_poster = thumbs_dir / f"{p_num}.jpg"

            # Poster extraction
            if not full_poster.exists() or full_poster.stat().st_size == 0:
                extract_video_poster(src_path, poster_temp)
                w, h = process_image(poster_temp, full_poster, thumb_poster)
                if poster_temp.exists():
                    poster_temp.unlink()
            else:
                with Image.open(full_poster) as im:
                    w, h = im.width, im.height

            # Transcode video if needed
            if not video_out.exists() or video_out.stat().st_size == 0:
                transcode_video(src_path, video_out)
            else:
                print(f"[{p_num:02d}/24] Video {video_out.name} already exists ({video_out.stat().st_size / 1024**2:.1f} MB), skipping transcode.")

            p['src'] = f"photos/{p_num}.jpg"
            p['poster'] = f"photos/{p_num}.jpg"
            p['thumb'] = f"thumbs/{p_num}.jpg"
            p['videoSrc'] = f"videos/{p_num}.mp4"
            p['width'] = w
            p['height'] = h
            p['label'] = p['title']
            p['original_name'] = src_path.name

            manifest_photos.append({
                'id': str(p_num),
                'pageNum': p_num,
                'chapter': p['chapter'],
                'type': 'video',
                'src': p['src'],
                'poster': p['poster'],
                'thumb': p['thumb'],
                'videoSrc': p['videoSrc'],
                'width': w,
                'height': h,
                'title': p['title'],
                'label': p['title'],
                'text': p['text'],
                'tag': p['tag'],
                'original_name': src_path.name
            })
            print(f"[{p_num:02d}/24] Video ready: {video_out.name} ({video_out.stat().st_size / 1024**2:.1f} MB, poster {w}x{h})")

    # Save to site/photos.js
    output_js = (
        'window.BOSS_ALBUM_DATA = ' + json.dumps(data, ensure_ascii=False, indent=2) + ';\n'
        'window.BOSS_PHOTOS = ' + json.dumps(manifest_photos, ensure_ascii=False, indent=2) + ';\n'
    )
    (site / 'photos.js').write_text(output_js, encoding='utf-8')
    print("\nSaved updated manifest to site/photos.js")
    print(f"Total moments processed: {len(manifest_photos)}")

if __name__ == '__main__':
    main()
